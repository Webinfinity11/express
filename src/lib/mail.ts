import "server-only";
import nodemailer from "nodemailer";
import type { orders } from "@/db";
import { CITIES, gel } from "@/lib/data";
import { DELIVERY_LABELS, PAYMENT_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/admin-shared";

/**
 * მეილის პარამეტრები — მხოლოდ სერვერის env ცვლადებიდან (Vercel), ადმინში არ ჩანს:
 * SMTP_HOST, SMTP_PORT (465), SMTP_SECURE ("false" = STARTTLS/587), SMTP_USER, SMTP_PASS,
 * MAIL_FROM_NAME (Express Mix), MAIL_NOTIFY_TO (ცარიელი = SMTP_USER; რამდენიმე — მძიმით), MAIL_CUSTOMER ("false" = მომხმარებელს არა)
 */
export type MailConfig = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean; // true = SSL (465), false = STARTTLS (587)
  user: string;
  password: string;
  fromName: string;
  notifyTo: string; // შეკვეთების შეტყობინებების მიმღები (მძიმით რამდენიმე)
  customerEmails: boolean; // მომხმარებელსაც მიუვიდეს დადასტურება
};

export async function getMailConfig(): Promise<MailConfig> {
  const e = process.env;
  const port = Number(e.SMTP_PORT) || 465;
  return {
    enabled: true,
    host: (e.SMTP_HOST ?? "").trim(),
    port,
    secure: e.SMTP_SECURE ? e.SMTP_SECURE !== "false" : port === 465,
    user: (e.SMTP_USER ?? "").trim(),
    password: e.SMTP_PASS ?? "",
    fromName: e.MAIL_FROM_NAME || "Express Mix",
    notifyTo: e.MAIL_NOTIFY_TO ?? "",
    customerEmails: e.MAIL_CUSTOMER !== "false",
  };
}

const ready = (c: MailConfig) => c.enabled && !!c.host && !!c.user && !!c.password;

function transport(c: MailConfig) {
  return nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.secure,
    auth: { user: c.user, pass: c.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

export async function sendMail(c: MailConfig, to: string, subject: string, html: string, replyTo?: string) {
  await transport(c).sendMail({
    from: { name: c.fromName, address: c.user },
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
}

const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

type Order = typeof orders.$inferSelect;

function orderTable(o: Order) {
  const rows = o.items
    .map(
      (i) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${esc(i.name)}${i.variant ? ` <small style="color:#888">(${esc(i.variant)})</small>` : ""}${
          i.sku ? `<br><small style="color:#888">კოდი: ${esc(i.sku)}</small>` : ""
        }</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.qty}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${gel(i.total)}</td></tr>`,
    )
    .join("");
  const line = (k: string, v: string, bold = false) =>
    `<tr><td colspan="2" style="padding:4px 8px;color:#666">${k}</td><td style="padding:4px 8px;text-align:right;white-space:nowrap${bold ? ";font-weight:bold;font-size:16px" : ""}">${v}</td></tr>`;
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">
<tr style="background:#f6f6f6"><th style="padding:8px;text-align:left">პროდუქტი</th><th style="padding:8px">რაოდ.</th><th style="padding:8px;text-align:right">ფასი</th></tr>
${rows}
${line("პროდუქცია", gel(o.subtotal))}
${o.discount ? line(`პრომოკოდი ${esc(o.promoCode ?? "")}`, "−" + gel(o.discount)) : ""}
${line("მიწოდება", o.shipping ? gel(o.shipping) : "უფასო")}
${line("ჯამი", gel(o.total), true)}
</table>`;
}

function details(o: Order) {
  const city = CITIES[o.city as keyof typeof CITIES] ?? o.city;
  const pairs: [string, string][] = [
    ["სახელი", o.name],
    ["ტელეფონი", o.phone],
    ...(o.email ? ([["ელფოსტა", o.email]] as [string, string][]) : []),
    ["მიწოდება", `${DELIVERY_LABELS[o.delivery] ?? o.delivery}${o.delivery === "courier" ? ` · ${city}` : ""}`],
    ...(o.address ? ([["მისამართი", o.address]] as [string, string][]) : []),
    ["გადახდა", `${PAYMENT_LABELS[o.payment] ?? o.payment}${o.paymentStatus ? ` — ${PAYMENT_STATUS_LABELS[o.paymentStatus] ?? o.paymentStatus}` : ""}`],
    ...(o.comment ? ([["კომენტარი", o.comment]] as [string, string][]) : []),
  ];
  return `<table style="font-size:14px;border-collapse:collapse">${pairs
    .map(([k, v]) => `<tr><td style="padding:3px 12px 3px 0;color:#666;vertical-align:top">${k}</td><td style="padding:3px 0"><b>${esc(v)}</b></td></tr>`)
    .join("")}</table>`;
}

const wrap = (body: string) =>
  `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#222"><div style="background:#151515;padding:14px 20px;border-radius:8px 8px 0 0"><span style="color:#ff5a00;font-weight:bold;font-size:18px">Express Mix</span></div><div style="border:1px solid #eee;border-top:0;padding:20px;border-radius:0 0 8px 8px">${body}</div></div>`;

/**
 * შეკვეთის შეტყობინებები: მაღაზიას (notifyTo) და მომხმარებელს (თუ ელფოსტა მიუთითა).
 * შეცდომა შეკვეთას არ აფერხებს — მხოლოდ ლოგში იწერება.
 */
export async function sendOrderEmails(o: Order, origin = "https://emix.ge") {
  let c: MailConfig;
  try {
    c = await getMailConfig();
  } catch (e) {
    console.error("[mail] config", e);
    return;
  }
  if (!ready(c)) return;
  const paid = o.paymentStatus === "paid";
  const jobs: Promise<unknown>[] = [];

  const shopTo = c.notifyTo || c.user;
  jobs.push(
    sendMail(
      c,
      shopTo,
      `ახალი შეკვეთა ${o.number} — ${gel(o.total)}${paid ? " (გადახდილია)" : ""}`,
      wrap(
        `<h2 style="margin:0 0 12px">ახალი შეკვეთა ${esc(o.number)}</h2>${details(o)}<div style="height:16px"></div>${orderTable(o)}<p style="margin-top:20px"><a href="${origin}/admin/orders/${o.id}" style="background:#ff5a00;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">ადმინში ნახვა</a></p>`,
      ),
      o.email || undefined,
    ),
  );

  if (c.customerEmails && o.email) {
    jobs.push(
      sendMail(
        c,
        o.email,
        `თქვენი შეკვეთა ${o.number} მიღებულია — Express Mix`,
        wrap(
          `<h2 style="margin:0 0 8px">გმადლობთ, ${esc(o.name)}!</h2><p>თქვენი შეკვეთა <b>${esc(o.number)}</b> მიღებულია${
            paid ? " და გადახდა წარმატებით შესრულდა" : ""
          }. ოპერატორი მალე დაგიკავშირდებათ ნომერზე <b>${esc(o.phone)}</b>.</p>${orderTable(o)}<p style="color:#888;font-size:13px;margin-top:20px">Express Mix · <a href="${origin}" style="color:#ff5a00">emix.ge</a></p>`,
        ),
      ),
    );
  }

  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === "rejected") console.error("[mail] send failed", r.reason);
}
