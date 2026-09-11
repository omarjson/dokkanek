import type { ReactNode } from "react";

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="inline-block h-9 w-1.5 rounded-full bg-[var(--brand)]" aria-hidden />
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {sub && <p className="text-sm text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.08),0_4px_12px_rgba(16,24,40,0.06)] border border-slate-200/70 p-4 sm:p-5 mb-4">
      {children}
    </div>
  );
}

const TONES: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  gray: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: keyof typeof TONES }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="text-slate-400 text-sm py-6 text-center">{text}</p>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block mb-2">
      <span className="block text-sm mb-1 font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent";
export const btnCls =
  "bg-[var(--brand)] text-white font-bold rounded-xl px-5 py-2.5 shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50";
export const btnGhostCls =
  "border border-slate-300 bg-white rounded-xl px-4 py-2.5 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50";
