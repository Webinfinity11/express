import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getContent } from "@/lib/content";
import { contentSections } from "@/lib/content-schema";
import { PageTitle } from "@/components/admin/ui";
import { ContentForm } from "@/components/admin/ContentForm";

export default async function EditContent({ params }: PageProps<"/admin/content/[key]">) {
  await requireAdmin();
  const { key } = await params;
  const section = contentSections.find((s) => s.key === key);
  if (!section) notFound();
  const content = await getContent();
  return (
    <>
      <PageTitle>
        <Link href="/admin/content" className="text-slate-400 font-normal">
          ტექსტები /
        </Link>{" "}
        {section.title}
      </PageTitle>
      <p className="text-slate-500 -mt-4 mb-5">{section.description}</p>
      <ContentForm
        key={JSON.stringify(content[section.key])}
        sectionKey={section.key}
        fields={section.fields}
        initial={content[section.key] as Record<string, unknown>}
      />
    </>
  );
}
