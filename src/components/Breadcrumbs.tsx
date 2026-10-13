import Link from "next/link";
import { Fragment } from "react";
import { Icon } from "./Icon";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="breadcrumbs wrap" aria-label="გვერდის მდებარეობა">
      <Link href="/">
        <Icon name="home" />
        <span>მთავარი</span>
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
