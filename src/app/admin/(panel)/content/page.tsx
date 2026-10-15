import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { contentSections } from "@/lib/content-schema";
import { PageTitle } from "@/components/admin/ui";

export default async function ContentIndex() {
  await requireAdmin();
  return (
    <>
      <PageTitle>საიტის ტექსტები</PageTitle>
      <div className="grid sm:grid-cols-2 gap-4">
        {contentSections.map((s) => (
          <Link key={s.key} href={`/admin/content/${s.key}`} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-orange-300">
            <div className="font-bold text-lg">{s.title}</div>
            <div className="text-sm text-slate-500 mt-1">{s.description}</div>
          </Link>
        ))}
        <Link href="/admin/categories" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-orange-300">
          <div className="font-bold text-lg">კატეგორიების მენიუ</div>
          <div className="text-sm text-slate-500 mt-1">სახელები, სურათები და რიგითობა — ჩანს „კატეგორიების“ მენიუში და მთავარ გვერდზე.</div>
        </Link>
      </div>
    </>
  );
}
