import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Icon } from "@/components/Icon";
import { InnerFooterBlocks } from "@/components/InnerFooterBlocks";
import { getPages } from "@/lib/pages";

export async function generateStaticParams() {
  const list = await getPages();
  // Cache Components-ს ერთი პარამეტრი მაინც სჭირდება; არარსებული → 404
  return list.length ? list.map((p) => ({ slug: p.slug })) : [{ slug: "_" }];
}

async function find(slug: string) {
  return (await getPages()).find((p) => p.slug === decodeURIComponent(slug));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const page = await find((await params).slug);
  if (!page) return {};
  return { title: `${page.title} | Express Mix`, description: page.metaDescription || page.subtitle || undefined };
}

/** body: ცარიელი ხაზი = ახალი აბზაცი, „## “ = ქვესათაური, „- “ = სია */
function Body({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) return <h2 key={i}>{b.slice(3)}</h2>;
        const lines = b.split("\n");
        if (lines.every((l) => /^[-•]\s/.test(l)))
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{l.replace(/^[-•]\s+/, "")}</li>
              ))}
            </ul>
          );
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {l}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

export default async function CustomPage({ params }: PageProps<"/[slug]">) {
  const page = await find((await params).slug);
  if (!page) notFound();
  return (
    <>
      <Breadcrumbs items={[{ label: page.title }]} />
      <main id="main" className="wrap internal-main">
        <section className="shop-hero">
          <div className="shop-hero-copy">
            {page.eyebrow && <span className="eyebrow">{page.eyebrow}</span>}
            <h1>{page.title}</h1>
            {page.subtitle && <p>{page.subtitle}</p>}
          </div>
          {page.image && (
            <div className="shop-hero-photo">
              <img src={page.image} alt="" fetchPriority="high" />
            </div>
          )}
        </section>
        {(page.body || page.buttonText) && (
          <article className="page-body">
            <Body text={page.body} />
            {page.buttonText && page.buttonHref && (
              <Link className="button primary" href={page.buttonHref}>
                {page.buttonText} <Icon name="arrow" />
              </Link>
            )}
          </article>
        )}
      </main>
      <InnerFooterBlocks />
    </>
  );
}
