"use client";

import { Fragment } from "react";
import { Link, useT } from "@/i18n/client";
import { Icon } from "./Icon";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  const t = useT();
  return (
    <nav className="breadcrumbs wrap" aria-label={t("გვერდის მდებარეობა")}>
      <Link href="/">
        <Icon name="home" />
        <span>{t("მთავარი")}</span>
      </Link>
      {items.map((item, i) => (
        <Fragment key={i}>
          <Icon name="chevron" />
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
