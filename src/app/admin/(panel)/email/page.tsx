import { requireAdmin } from "@/lib/auth";
import { saveMailSettings } from "@/lib/actions/admin";
import { getMailConfig } from "@/lib/mail";
import { Card, PageTitle } from "@/components/admin/ui";

const MESSAGES: Record<string, [string, string]> = {
  sent: ["bg-green-50 text-green-800 border-green-200", "შენახულია — სატესტო მეილი გაიგზავნა ✓ შეამოწმეთ საფოსტო ყუთი (სპამიც)."],
  failed: ["bg-red-50 text-red-800 border-red-200", "შენახულია, მაგრამ მეილი ვერ გაიგზავნა. გადაამოწმეთ სერვერი, პორტი, მომხმარებელი და პაროლი."],
  missing: ["bg-amber-50 text-amber-800 border-amber-200", "შენახულია. ტესტისთვის შეავსეთ სერვერი, მომხმარებელი და პაროლი."],
  saved: ["bg-slate-50 text-slate-700 border-slate-200", "შენახულია."],
};

const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

export default async function EmailAdmin({ searchParams }: PageProps<"/admin/email">) {
  await requireAdmin();
  const sp = await searchParams;
  const c = await getMailConfig();
  const msg = typeof sp.r === "string" ? MESSAGES[sp.r] : undefined;
  const detail = typeof sp.m === "string" ? sp.m : "";

  return (
    <>
      <PageTitle>მეილი</PageTitle>
      {msg && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${msg[0]}`}>
          {msg[1]}
          {detail && <div className="mt-1 font-mono text-xs opacity-80 break-all">{detail}</div>}
        </div>
      )}
      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        <Card title="SMTP — მეილის სერვერი">
          <form action={saveMailSettings} className="grid gap-4 max-w-xl">
            <label className="flex items-center gap-2 font-semibold">
              <input type="checkbox" name="enabled" defaultChecked={c.enabled} className="size-4 accent-[#ff5a00]" />
              მეილის შეტყობინებები ჩართულია
            </label>
            <div className="grid sm:grid-cols-[1fr_110px_150px] gap-3">
              <label className="grid gap-1">
                <span className="text-sm text-slate-500">SMTP სერვერი</span>
                <input name="host" defaultValue={c.host} placeholder="mail.emix.ge" className={input} spellCheck={false} />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-slate-500">პორტი</span>
                <input name="port" type="number" defaultValue={c.port} className={input} />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-slate-500">დაცვა</span>
                <select name="security" defaultValue={c.secure ? "ssl" : "tls"} className={input}>
                  <option value="ssl">SSL (465)</option>
                  <option value="tls">TLS / STARTTLS (587)</option>
                </select>
              </label>
            </div>
            <label className="grid gap-1">
              <span className="text-sm text-slate-500">მეილი (მომხმარებელი)</span>
              <input name="user" type="email" defaultValue={c.user} placeholder="info@emix.ge" autoComplete="off" className={input} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-slate-500">პაროლი</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder={c.password ? "შენახულია — შეცვლისთვის ჩაწერეთ ახალი" : "მეილის პაროლი"}
                className={input}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-slate-500">გამგზავნის სახელი</span>
              <input name="fromName" defaultValue={c.fromName} className={input} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-slate-500">შეკვეთების შეტყობინება მივიდეს (ცარიელი = იგივე მეილზე; რამდენიმე — მძიმით)</span>
              <input name="notifyTo" defaultValue={c.notifyTo} placeholder="orders@emix.ge, owner@gmail.com" className={input} />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="customerEmails" defaultChecked={c.customerEmails} className="size-4 accent-[#ff5a00]" />
              მომხმარებელსაც გაეგზავნოს შეკვეთის დადასტურება (თუ ელფოსტა მიუთითა)
            </label>
            <div className="flex flex-wrap gap-2">
              <button name="test" value="1" className="rounded-lg bg-[#ff5a00] px-5 py-2.5 font-semibold text-white hover:bg-[#e65100]">
                შენახვა და სატესტო მეილი
              </button>
              <button className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold hover:bg-slate-50">შენახვა</button>
            </div>
          </form>
        </Card>
        <Card title="როგორ დავაკავშირო">
          <div className="grid gap-3 text-sm text-slate-600">
            <p>ჰოსტინგის პანელში შექმენით მეილი (მაგ. info@emix.ge) და იქვე ნახეთ SMTP პარამეტრები — სერვერი, პორტი და დაცვის ტიპი.</p>
            <p>ჩაწერეთ აქ მეილი და მისი პაროლი, შემდეგ დააჭირეთ „შენახვა და სატესტო მეილი“.</p>
            <p>ახალ შეკვეთაზე მეილი მოვა ავტომატურად. ბარათით გადახდისას — მხოლოდ წარმატებული გადახდის შემდეგ.</p>
          </div>
        </Card>
      </div>
    </>
  );
}

export const instant = false;
