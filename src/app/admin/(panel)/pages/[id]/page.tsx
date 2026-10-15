import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, pages } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getLinkOptions } from "@/lib/link-options";
import { PageTitle } from "@/components/admin/ui";
import { PageForm } from "@/components/admin/PageForm";

export default async function EditPage({ params }: PageProps<"/admin/pages/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "new";
  // საიტის „რედაქტირების“ ღილაკი slug-ით მოდის
  const [page] = isNew
    ? [null]
    : await db
        .select()
        .from(pages)
        .where(/^\d+$/.test(id) ? eq(pages.id, Number(id)) : eq(pages.slug, decodeURIComponent(id)));
  if (!isNew && !page) notFound();
  const links = await getLinkOptions();
  return (
    <>
      <PageTitle
        actions={
          page && (
            <a href={`/${page.slug}`} target="_blank" className="text-sm font-semibold text-[#ff5a00]">
              საიტზე ნახვა ↗
            </a>
          )
        }
      >
        <Link href="/admin/pages" className="text-slate-400 font-normal">
          გვერდები /
        </Link>{" "}
        {page ? page.title : "ახალი გვერდი"}
      </PageTitle>
      <PageForm key={page?.updatedAt.toISOString() ?? "new"} page={page} links={links} />
    </>
  );
}
