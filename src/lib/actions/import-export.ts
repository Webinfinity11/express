"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { categories, db, products, shippingClasses } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { matchPhotos, type PhotoMatch } from "@/lib/photo-match";
import { parseWorkbook, planImport, type ImportPlan } from "@/lib/product-sheet";

const MAX_IMAGES = 12;

const MAX_FILE = 3.5 * 1024 * 1024;
const PREVIEW_ITEMS = 300;
const INSERT_CHUNK = 100;
const UPDATE_PARALLEL = 5;

export type ImportPreview =
  | {
      ok: true;
      created: number;
      updated: number;
      same: number;
      errors: ImportPlan["errors"];
      warnings: ImportPlan["warnings"];
      items: { action: "create" | "update"; row: number; name: string; sku: string; changes: string[] }[];
    }
  | { ok: false; error: string };

export type ImportResult = { ok: true; created: number; updated: number; same: number } | { ok: false; error: string };

async function buildPlan(form: FormData): Promise<{ ok: true; plan: ImportPlan } | { ok: false; error: string }> {
  const file = form.get("file");
  if (!(file instanceof File)) return { ok: false, error: "ფაილი ვერ მოიძებნა" };
  if (!file.name.toLowerCase().endsWith(".xlsx")) return { ok: false, error: "ატვირთეთ .xlsx ფორმატის ფაილი" };
  if (file.size > MAX_FILE) return { ok: false, error: "ფაილი 3.5MB-ზე მეტია" };
  const sheet = await parseWorkbook(await file.arrayBuffer());
  if (!sheet.ok) return sheet;
  const [existing, cats, classes] = await Promise.all([
    db.select().from(products),
    db.select().from(categories),
    db.select().from(shippingClasses),
  ]);
  return { ok: true, plan: planImport(sheet.rows, existing, cats, classes) };
}

/** ბაზას არ ცვლის: აჩვენებს, რა მოხდება დადასტურების შემდეგ. */
export async function previewImport(form: FormData): Promise<ImportPreview> {
  await requireAdmin();
  const res = await buildPlan(form);
  if (!res.ok) return res;
  const { items, errors, warnings } = res.plan;
  const count = (action: string) => items.filter((i) => i.action === action).length;
  return {
    ok: true,
    created: count("create"),
    updated: count("update"),
    same: count("same"),
    errors,
    warnings,
    items: items
      .filter((i) => i.action !== "same")
      .slice(0, PREVIEW_ITEMS)
      .map((i) => ({ action: i.action as "create" | "update", row: i.row, name: i.name, sku: i.sku, changes: i.changes })),
  };
}

/** ფაილი თავიდან მოწმდება. შეცდომის არსებობისას არაფერი იწერება. პროდუქტი არასდროს იშლება. */
export async function applyImport(form: FormData): Promise<ImportResult> {
  await requireAdmin();
  const res = await buildPlan(form);
  if (!res.ok) return res;
  const { items, errors } = res.plan;
  if (errors.length) return { ok: false, error: `ფაილში ${errors.length} შეცდომაა. ჯერ გაასწორეთ` };

  const creates = items.flatMap((i) => (i.action === "create" ? [i.values] : []));
  const updates = items.flatMap((i) => (i.action === "update" ? [i] : []));
  let created = 0;
  let updated = 0;
  try {
    for (let i = 0; i < creates.length; i += INSERT_CHUNK) {
      const chunk = creates.slice(i, i + INSERT_CHUNK);
      await db.insert(products).values(chunk);
      created += chunk.length;
    }
    const now = new Date();
    for (let i = 0; i < updates.length; i += UPDATE_PARALLEL) {
      const chunk = updates.slice(i, i + UPDATE_PARALLEL);
      await Promise.all(chunk.map((u) => db.update(products).set({ ...u.values, updatedAt: now }).where(eq(products.id, u.id))));
      updated += chunk.length;
    }
  } catch (e) {
    console.error("product import failed", e);
    return { ok: false, error: `იმპორტი შეწყდა: დაემატა ${created}, განახლდა ${updated}. თავიდან ცდამდე შეამოწმეთ პროდუქცია` };
  } finally {
    if (created || updated) updateTag("catalog");
  }
  return { ok: true, created, updated, same: items.length - created - updated };
}

// ───────── ფოტოები დასახელებით ─────────

const fileNames = z.array(z.string().min(1).max(300)).min(1).max(1000);

/** ბაზას არ ცვლის: აჩვენებს, რომელი ფაილი რომელ პროდუქტს ერგება. */
export async function matchPhotoFiles(files: string[]): Promise<{ ok: true; matches: PhotoMatch[] } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = fileNames.safeParse(files);
  if (!parsed.success) return { ok: false, error: "ერთ ჯერზე მაქსიმუმ 1000 ფოტოა დაშვებული" };
  const rows = await db.select({ id: products.id, name: products.name, published: products.published, images: products.images }).from(products);
  const list = rows.map((p) => ({ id: p.id, name: p.name, published: p.published, imageCount: p.images.length }));
  return { ok: true, matches: matchPhotos(parsed.data, list) };
}

const blobUrl = z.url({ protocol: /^https$/ }).refine((u) => new URL(u).hostname.endsWith(".public.blob.vercel-storage.com"), "არასწორი ბმული");
const attachInput = z.object({ productId: z.number().int(), urls: z.array(blobUrl).min(1).max(MAX_IMAGES), replace: z.boolean() });

export async function attachPhotos(input: z.input<typeof attachInput>): Promise<{ ok: true; added: number; skipped: number } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = attachInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "ფოტოს მონაცემები არასწორია" };
  const { productId, urls, replace } = parsed.data;
  const [product] = await db.select({ images: products.images }).from(products).where(eq(products.id, productId));
  if (!product) return { ok: false, error: "პროდუქტი ვერ მოიძებნა" };
  const base = replace ? [] : product.images;
  const room = Math.max(0, MAX_IMAGES - base.length);
  const fresh = urls.filter((u) => !base.includes(u));
  const added = fresh.slice(0, room);
  if (added.length || replace) {
    await db.update(products).set({ images: [...base, ...added], updatedAt: new Date() }).where(eq(products.id, productId));
    updateTag("catalog");
  }
  return { ok: true, added: added.length, skipped: fresh.length - added.length };
}
