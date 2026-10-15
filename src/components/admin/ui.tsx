import type { ButtonHTMLAttributes, ReactNode } from "react";

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-[#ff5a00] focus:ring-2 focus:ring-[#ff5a00]/20 disabled:bg-slate-100";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-500 mt-1">{hint}</span>}
    </label>
  );
}

const variants = {
  primary: "bg-[#ff5a00] text-white hover:bg-[#e74d00]",
  secondary: "bg-white border border-slate-300 hover:border-[#ff5a00] hover:text-[#ff5a00]",
  danger: "bg-white border border-red-200 text-red-600 hover:bg-red-50",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition disabled:opacity-50 ${variants[variant]} ${className}`}
    />
  );
}

export function Card({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5">
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && <h2 className="font-bold text-lg">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h1 className="text-2xl font-bold">{children}</h1>
      {actions}
    </div>
  );
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  confirmed: "bg-amber-100 text-amber-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-slate-200 text-slate-600",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[status] ?? ""}`}>{label}</span>;
}
