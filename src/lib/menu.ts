// კატეგორიების მენიუ — სტრუქტურა alta.ge-ის მიხედვით.
// ბმული: არსებულ კატეგორიაზე (category) ან, სანამ რეალური კატალოგი შემოვა, ძიებაზე (q).
import { categoryHref } from "./data";

export type MenuLink = { name: string; href: string };
export type MenuGroup = { title: string; href: string; items?: MenuLink[] };
export type MenuSection = { id: string; name: string; image: string; href: string; groups: MenuGroup[] };

const q = (name: string) => "/products?q=" + encodeURIComponent(name);
const link = (name: string, href = q(name)): MenuLink => ({ name, href });
const group = (title: string, href = q(title), items?: MenuLink[]): MenuGroup => ({ title, href, items });

export const MENU: MenuSection[] = [
  {
    id: "large",
    name: "მსხვილი საყოფაცხოვრებო ტექნიკა",
    image: "/images/cat-washers.webp",
    href: "/products",
    groups: [
      group("მაცივარი", categoryHref("fridges")),
      group("სარეცხი მანქანა", categoryHref("washers")),
      group("საშრობი მანქანა"),
      group("ჭურჭლის სარეცხი მანქანა"),
      group("გაზქურა", categoryHref("ovens")),
      group("გამწოვი"),
      group("ჩასაშენებელი ტექნიკა", q("ჩასაშენებელი"), [
        link("ჩასაშენებელი ელექტრო ღუმელი", categoryHref("ovens")),
        link("ჩასაშენებელი ქურა"),
        link("ჩასაშენებელი გამწოვი"),
        link("ჩასაშენებელი მიკროტალღური"),
        link("ჩასაშენებელი ყავის აპარატი"),
      ]),
      group("კლიმატური ტექნიკა", q("კლიმატური"), [
        link("კონდიციონერი"),
        link("გაზის გამათბობელი"),
        link("ელექტრო გამათბობელი"),
        link("ჰაერის გამწმენდი & დამატენიანებელი"),
        link("გამაგრილებელი"),
        link("ვენტილატორი"),
        link("პორტატული კონდიციონერი"),
      ]),
      group("წყლის დისპენსერი"),
      group("ორთქლის კარადა"),
      group("საყოფაცხოვრებო ტექნიკის აქსესუარები"),
    ],
  },
  {
    id: "small",
    name: "წვრილი საოჯახო ტექნიკა",
    image: "/images/cat-kitchen.webp",
    href: categoryHref("kitchen"),
    groups: [
      group("სამზარეულოს წვრილი ტექნიკა", categoryHref("kitchen"), [
        link("ელექტრო ღუმელი", categoryHref("ovens")),
        link("ბლენდერი და ჩოპერი", categoryHref("blenders")),
        link("პურის საცხობი"),
        link("მიქსერი"),
        link("მულტი სახარში"),
        link("სენდვიჩ მეიქერი"),
        link("ვაფლის მეიქერი"),
        link("სლაშ მეიქერი"),
        link("ტოსტერი"),
        link("პიცის საცხობი"),
        link("გრილი"),
        link("წვენსაწური", q("საწური")),
        link("ჩირის აპარატი"),
        link("ყინულის აპარატი"),
        link("ფრის აპარატი"),
        link("ღვინის გასახსნელი"),
        link("სამზარეულოს სასწორი"),
        link("სამზარეულოს ტექნიკის აქსესუარები"),
        link("სლაისერი"),
      ]),
      group("ყავის მოყვარულთათვის", q("ყავის"), [
        link("ყავის აპარატი"),
        link("ყავის მადუღარა"),
        link("ყავის საფქვავი"),
        link("ყავის აპარატის აქსესუარები"),
        link("ყავა"),
        link("რძის ამომყვანი"),
      ]),
      group("მიკროტალღური ღუმელი", categoryHref("microwaves")),
      group("ელექტრო ჩაიდანი", q("ჩაიდანი")),
      group("სამზარეულოს კომბაინი"),
      group("ხორცსაკეპი"),
    ],
  },
  {
    // TODO: ქვეკატეგორიები ალტას მიხედვით დასაზუსტებელია (სქრინი არ გვქონდა)
    id: "home-care",
    name: "სახლის და ეზოს მოვლა",
    image: "/images/cat-vacuums.webp",
    href: categoryHref("vacuums"),
    groups: [group("მტვერსასრუტი", categoryHref("vacuums")), group("უთო", categoryHref("irons"))],
  },
];
