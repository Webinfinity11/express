// კლიენტისთვისაც უსაფრთხო დამხმარეები (სერვერის import-ების გარეშე)

const GEO: Record<string, string> = {
  ა: "a", ბ: "b", გ: "g", დ: "d", ე: "e", ვ: "v", ზ: "z", თ: "t", ი: "i", კ: "k", ლ: "l", მ: "m", ნ: "n", ო: "o",
  პ: "p", ჟ: "zh", რ: "r", ს: "s", ტ: "t", უ: "u", ფ: "f", ქ: "q", ღ: "gh", ყ: "y", შ: "sh", ჩ: "ch", ც: "ts",
  ძ: "dz", წ: "ts", ჭ: "ch", ხ: "kh", ჯ: "j", ჰ: "h",
};

/** „სარეცხი მანქანა“ → "saretskhi-manqana" — ლათინური, URL-ისთვის მოსახერხებელი */
export function slugify(s: string) {
  return [...s.toLowerCase().trim()]
    .map((ch) => GEO[ch] ?? ch)
    .join("")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const ORDER_STATUSES = ["new", "confirmed", "delivered", "cancelled"] as const;
export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: "ახალი",
  confirmed: "დადასტურებული",
  delivered: "მიწოდებული",
  cancelled: "გაუქმებული",
};

export const DELIVERY_LABELS: Record<string, string> = { courier: "კურიერით", pickup: "თვითგატანა" };
export const PAYMENT_LABELS: Record<string, string> = { "on-delivery": "მიღებისას გადახდა", installment: "განვადება" };
