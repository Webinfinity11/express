// ფოტოს ფაილის სახელის შედარება პროდუქტის დასახელებასთან. მიება მხოლოდ ერთმნიშვნელოვან დამთხვევაზე:
// „Franko აეროგრილი FAF-1217.jpg“ = მთავარი, „Franko აეროგრილი FAF-1217-2.jpg“ ან „… (2).jpg“ ან „…_2.jpg“ = დამატებითი.

export type MatchProduct = { id: number; name: string; published: boolean; imageCount: number };

export type PhotoMatch =
  | { file: string; status: "matched"; productId: number; productName: string; order: number; published: boolean; imageCount: number }
  | { file: string; status: "unmatched" }
  | { file: string; status: "ambiguous"; productName: string; count: number }
  | { file: string; status: "duplicate"; productName: string };

const MAX_ORDER = 12;

/** Windows-ის ფაილის სახელში აკრძალული სიმბოლოები ორივე მხარეს იგნორირდება. */
export const normalizeName = (s: string) =>
  s
    .normalize("NFC")
    .toLowerCase()
    .replace(/[\\/:*?"<>|_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const NUMBERED = /^(.*?)(?:\s*-\s*|\s*_\s*|\s*\(\s*)(\d{1,2})\s*\)?$/;

export function matchPhotos(files: string[], products: MatchProduct[]): PhotoMatch[] {
  const byName = new Map<string, MatchProduct[]>();
  for (const p of products) {
    const key = normalizeName(p.name);
    byName.set(key, [...(byName.get(key) ?? []), p]);
  }
  const taken = new Set<string>();

  return files.map((file): PhotoMatch => {
    const base = file.replace(/\.[^.]+$/, "").normalize("NFC").trim();
    let hits = byName.get(normalizeName(base));
    let order = 1;
    if (!hits) {
      const m = base.match(NUMBERED);
      const n = m ? Number(m[2]) : 0;
      if (m && n >= 2 && n <= MAX_ORDER) {
        hits = byName.get(normalizeName(m[1]));
        order = n;
      }
    }
    if (!hits) return { file, status: "unmatched" };
    if (hits.length > 1) return { file, status: "ambiguous", productName: hits[0].name, count: hits.length };
    const p = hits[0];
    const slot = `${p.id}:${order}`;
    if (taken.has(slot)) return { file, status: "duplicate", productName: p.name };
    taken.add(slot);
    return { file, status: "matched", productId: p.id, productName: p.name, order, published: p.published, imageCount: p.imageCount };
  });
}
