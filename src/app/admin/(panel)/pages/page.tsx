import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, pages } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { contentSections } from "@/lib/content-schema";
import { BUILTIN_PAGES } from "@/lib/site-links";
import { Button, PageTitle } from "@/components/admin/ui";
import { PageToggle } from "@/components/admin/Toggles";

// საიტის საერთო ნაწილები (არა ცალკე გვერდი)
const SHARED = ["header", "footer", "site", "shipping", "info"] as const;

const row = "flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-slate-50";
const view = "text-sm text-slate-500 hover:text-[#ff5a00] whitespace-nowrap";
const edit = "text-sm font-semibold text-[#ff5a00] whitespace-nowrap";

export default async function PagesAdmin() {
  await requireAdmin();
  const list = await db.select().from(pages).orderBy(asc(pages.title));
  const shared = SHARED.map((k) => contentSections.find((s) => s.key === k)!);

  return (
    <>
      <PageTitle
        actions={
          <Link href="/admin/pages/new">
            <Button>+ ახალი გვერდი</Button>
          </Link>
        }
      >
        გვერდები და მენიუ
      </PageTitle>

      <h2 className="font-bold mb-2">საიტის გვერდები</h2>
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 mb-8">
        {BUILTIN_PAGES.map((p) => (
          <div key={p.href} className={row}>
            <Link href={p.edit} className="flex-1 min-w-48">
              <span className="font-semibold">{p.label}</span>
              <span className="block text-xs text-slate-500">{p.note}</span>
            </Link>
            <code className="text-xs text-slate-400">{p.href}</code>
            <a href={p.href} target="_blank" className={view}>
              ნახვა ↗
            </a>
            <Link href={p.edit} className={edit}>
              რედაქტირება
            </Link>
          </div>
        ))}
        {list.map((p) => (
          <div key={p.id} className={row}>
            <Link href={`/admin/pages/${p.id}`} className="flex-1 min-w-48">
              <span className="font-semibold">{p.title}</span>
              <span className="block text-xs text-slate-500">ჩემი გვერდი{!p.published && " · დამალულია"}</span>
            </Link>
            <code className="text-xs text-slate-400">/{p.slug}</code>
            <PageToggle id={p.id} value={p.published} />
            <a href={`/${p.slug}`} target="_blank" className={view}>
              ნახვა ↗
            </a>
            <Link href={`/admin/pages/${p.id}`} className={edit}>
              რედაქტირება
            </Link>
          </div>
        ))}
        <Link href="/admin/pages/new" className="block px-4 py-3 text-sm font-semibold text-[#ff5a00] hover:bg-orange-50">
          + ახალი გვერდის დამატება
        </Link>
      </div>

      <h2 className="font-bold mb-2">მენიუ და საერთო ნაწილები</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {shared.map((s) => (
          <Link key={s.key} href={`/admin/content/${s.key}`} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-orange-300">
            <div className="font-bold text-lg">{s.title}</div>
            <div className="text-sm text-slate-500 mt-1">{s.description}</div>
          </Link>
        ))}
        <Link href="/admin/categories" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-orange-300">
          <div className="font-bold text-lg">კატეგორიების მენიუ</div>
          <div className="text-sm text-slate-500 mt-1">რომელი კატეგორია ჩანს ჰედერის „კატეგორიების“ მენიუში და მთავარ გვერდზე, სახელები, სურათები, რიგითობა.</div>
        </Link>
      </div>
    </>
  );
}

// ადმინი ყოველ ჯერზე შესვლას ამოწმებს — მყისიერი ნავიგაციის შემოწმება არ სჭირდება
export const instant = false;
