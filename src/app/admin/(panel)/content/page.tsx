import { redirect } from "next/navigation";

// ძველი მისამართი — ტექსტები ახლა „გვერდებშია“
export default function ContentIndex() {
  redirect("/admin/pages");
}
