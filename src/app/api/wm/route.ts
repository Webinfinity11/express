import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const HOST = /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i;

let logoCache: Buffer | null = null;
async function loadLogo(origin: string): Promise<Buffer> {
  if (logoCache) return logoCache;
  try {
    logoCache = await readFile(path.join(process.cwd(), "public", "images", "logo.webp"));
  } catch {
    logoCache = Buffer.from(await (await fetch(`${origin}/images/logo.webp`)).arrayBuffer());
  }
  return logoCache;
}

/** პროდუქტის სურათი Express Mix-ის ლოგოთი (ვატერმარკი). ორიგინალი Blob-ში უცვლელი რჩება. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  let src: URL;
  try {
    src = new URL(searchParams.get("u") ?? "");
  } catch {
    return new Response("bad url", { status: 400 });
  }
  if (src.protocol !== "https:" || !HOST.test(src.hostname)) return new Response("forbidden", { status: 403 });

  const res = await fetch(src);
  if (!res.ok) return new Response("not found", { status: 404 });
  const input = Buffer.from(await res.arrayBuffer());

  try {
    const base = sharp(input, { failOn: "none" }).rotate().resize({ width: 1600, withoutEnlargement: true });
    const { data, info } = await base.toBuffer({ resolveWithObject: true });
    const w = Math.max(90, Math.round(info.width * 0.36));
    const pad = Math.round(w * 0.06);
    const logo = await sharp(await loadLogo(origin)).resize({ width: w - pad * 2 }).toBuffer({ resolveWithObject: true });
    const plateW = logo.info.width + pad * 2;
    const plateH = logo.info.height + pad * 2;
    const plate = await sharp({ create: { width: plateW, height: plateH, channels: 4, background: { r: 18, g: 19, b: 19, alpha: 0.5 } } })
      .composite([{ input: Buffer.from(`<svg width="${plateW}" height="${plateH}"><rect rx="${Math.round(pad * 1.4)}" width="${plateW}" height="${plateH}" fill="#fff"/></svg>`), blend: "dest-in" }, { input: logo.data, left: pad, top: pad }])
      .png()
      .toBuffer();
        const out = await sharp(data)
      .composite([{ input: plate, left: Math.max(0, Math.round((info.width - plateW) / 2)), top: Math.max(0, Math.round((info.height - plateH) / 2)) }])
      .webp({ quality: 85 })
      .toBuffer();
    return new Response(new Uint8Array(out), {
      headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable", "Content-Disposition": "inline" },
    });
  } catch {
    // ფორმატი ვერ დამუშავდა — ორიგინალი
    return new Response(new Uint8Array(input), { headers: { "Content-Type": res.headers.get("content-type") ?? "image/jpeg", "Cache-Control": "public, max-age=3600" } });
  }
}
