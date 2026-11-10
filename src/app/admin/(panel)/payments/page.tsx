import { eq } from "drizzle-orm";
import { db, settings } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { ensurePaymentSchema } from "@/lib/bog";
import { saveBogSettings } from "@/lib/actions/admin";
import { BOG_SETTINGS_KEY } from "@/lib/bog";
import { Card, PageTitle } from "@/components/admin/ui";

const MESSAGES: Record<string, [string, string]> = {
  connected: ["bg-green-50 text-green-800 border-green-200", "შენახულია — ბანკთან კავშირი წარმატებულია ✓"],
  "auth-failed": ["bg-red-50 text-red-800 border-red-200", "შენახულია, მაგრამ ბანკმა გასაღებები ვერ დაადასტურა — გადაამოწმეთ Client ID და Secret Key."],
  saved: ["bg-slate-50 text-slate-700 border-slate-200", "შენახულია."],
};

export default async function PaymentsAdmin({ searchParams }: PageProps<"/admin/payments">) {
  await requireAdmin();
  await ensurePaymentSchema();
  const r = (await searchParams).r;
  const [row] = await db.select().from(settings).where(eq(settings.key, BOG_SETTINGS_KEY));
  const v = (row?.value ?? {}) as { enabled?: boolean; clientId?: string; clientSecret?: string };
  const enabled = v.enabled ?? true;
  const hasSecret = !!v.clientSecret;
  const secretHint = hasSecret ? `••••••••${v.clientSecret!.slice(-4)}` : "";
  const msg = typeof r === "string" ? MESSAGES[r] : undefined;

  return (
    <>
      <PageTitle>გადახდები</PageTitle>
      {msg && <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${msg[0]}`}>{msg[1]}</div>}
      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        <Card title="BOG Pay — საქართველოს ბანკი">
          <form action={saveBogSettings} className="grid gap-4 max-w-xl">
            <label className="flex items-center gap-2 font-semibold">
              <input type="checkbox" name="enabled" defaultChecked={enabled} className="size-4 accent-[#ff5a00]" />
              ბარათით გადახდა ჩართულია
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-slate-500">Client ID</span>
              <input
                name="clientId"
                defaultValue={v.clientId ?? ""}
                autoComplete="off"
                spellCheck={false}
                className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-slate-500">Secret Key</span>
              <input
                name="clientSecret"
                type="password"
                autoComplete="new-password"
                placeholder={hasSecret ? `შენახულია (${secretHint}) — შეცვლისთვის ჩაწერეთ ახალი` : "ჩაწერეთ Secret Key"}
                className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              />
            </label>
            <div>
              <button className="rounded-lg bg-[#ff5a00] px-5 py-2.5 font-semibold text-white hover:bg-[#e65100]">
                შენახვა და კავშირის შემოწმება
              </button>
            </div>
          </form>
        </Card>
        <Card title="ინფორმაცია">
          <div className="grid gap-3 text-sm text-slate-600">
            <p>Client ID და Secret Key-ს საქართველოს ბანკი გასცემს ონლაინ გადახდების (BOG Pay) ხელშეკრულების შემდეგ.</p>
            <p>
              Callback URL (თუ ბანკი მოგთხოვთ):
              <br />
              <code className="break-all text-xs bg-slate-100 rounded px-1.5 py-1 inline-block mt-1">https://emix.ge/api/payments/bog/callback</code>
            </p>
            <p>გასაღებების შენახვის შემდეგ გაფორმების გვერდზე გამოჩნდება მეთოდი „ბარათით გადახდა“. გადახდის სტატუსი ჩანს შეკვეთის გვერდზე.</p>
          </div>
        </Card>
      </div>
    </>
  );
}

export const instant = false;
