import Link from "next/link";
import { notFound } from "next/navigation";
import { asc } from "drizzle-orm";
import { categories, db } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getContent } from "@/lib/content";
import { contentSections } from "@/lib/content-schema";
import { getLinkOptions } from "@/lib/link-options";
import { BUILTIN_PAGES } from "@/lib/site-links";
import { PageTitle } from "@/components/admin/ui";
import { ContentForm } from "@/components/admin/ContentForm";

// მთავარი გვერდის ის ნაწილები, რომლებიც სხვა განყოფილებიდან იმართება
const HOME_LINKS = [
  ["/admin/categories", "კატეგორიების ბადე", "კატეგორიაში „მთავარზე“ გადამრთველი"],
  ["/admin/products", "პოპულარული პროდუქცია", "პროდუქტში ⭐ „პოპულარული“"],
  ["/admin/brands", "ბრენდების ზოლი", "ლოგოები და რიგითობა"],
] as const;

export default async function EditContent({ params }: PageProps<"/admin/content/[key]">) {
  await requireAdmin();
  const { key } = await params;
  const section = contentSections.find((s) => s.key === key);
  if (!section) notFound();
  const [content, links, cats] = await Promise.all([
    getContent(),
    getLinkOptions(),
    db.select({ slug: categories.slug, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
  ]);
  const view = BUILTIN_PAGES.find((p) => p.edit === `/admin/content/${key}`)?.href;
  return (
    <>
      <PageTitle
        actions={
          view && (
            <a href={view} target="_blank" className="text-sm font-semibold text-[#ff5a00]">
              საიტზე ნახვა ↗
            </a>
          )
        }
      >
        <Link href="/admin/pages" className="text-slate-400 font-normal">
          გვერდები /
        </Link>{" "}
        {section.title}
      </PageTitle>
      <p className="text-slate-500 -mt-4 mb-5">{section.description}</p>
      {key === "home" && (
        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          {HOME_LINKS.map(([href, title, text]) => (
            <Link key={href} href={href} className="bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-orange-300">
              <div className="font-semibold">{title} →</div>
              <div className="text-xs text-slate-500">{text}</div>
            </Link>
          ))}
        </div>
      )}
      <ContentForm
        key={JSON.stringify(content[section.key])}
        sectionKey={section.key}
        fields={section.fields}
        initial={content[section.key] as Record<string, unknown>}
        links={links}
        categories={cats.map((c) => ({ value: c.slug, label: c.name }))}
      />
    </>
  );
}
