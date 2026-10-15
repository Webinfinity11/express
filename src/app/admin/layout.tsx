import type { Metadata } from "next";
import "./admin.css";

// ადმინი ყოველთვის ახალ მონაცემებს კითხულობს — მყისიერი ნავიგაციის შემოწმება არ სჭირდება
export const instant = false;

export const metadata: Metadata = { title: { default: "ადმინი", template: "%s · ადმინი" }, robots: { index: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50 text-slate-800 text-[15px]">{children}</div>;
}
