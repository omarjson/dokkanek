import type { ComponentType, ReactNode, SVGProps } from "react";

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="inline-block h-9 w-1.5 rounded-full bg-[var(--brand)] shrink-0" aria-hidden />
      <div className="min-w-0">
        <h1 className="font-display font-semibold text-xl sm:text-2xl leading-9 truncate">{title}</h1>
        {sub && <p className="text-sm text-slate-500 mt-0.5 leading-6">{sub}</p>}
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

export function Stat({
  label,
  value,
  sub,
  icon,
  accent = "bg-[var(--brand)]/10 text-[var(--brand)]",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  accent?: string;
}) {
  const Ico = icon;
  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.08),0_4px_12px_rgba(16,24,40,0.06)] border border-slate-200/70 p-4 flex items-start gap-3">
      <span className={`flex items-center justify-center w-11 h-11 rounded-2xl shrink-0 ${accent}`}>
        <Ico width={22} height={22} />
      </span>
      <div className="min-w-0">
        <div className="text-[13px] text-slate-500 font-semibold leading-6">{label}</div>
        <div className="text-2xl font-bold leading-9 tabular-nums truncate">{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5 leading-5">{sub}</div>}
      </div>
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset whitespace-nowrap ${TONES[tone]}`}>
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

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.08),0_4px_12px_rgba(16,24,40,0.06)] border border-slate-200/70 overflow-x-auto">
      <table className="w-full text-sm min-w-[680px]">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead><tr className="bg-slate-50 text-slate-500 text-[13px]">{children}</tr></thead>;
}

export const inputCls =
  "w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent";
export const btnCls =
  "inline-flex items-center justify-center gap-1.5 bg-[var(--brand)] text-white font-bold rounded-xl px-5 py-2.5 shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50";
export const btnGhostCls =
  "inline-flex items-center justify-center gap-1.5 border border-slate-300 bg-white rounded-xl px-4 py-2.5 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50";
export const btnDangerCls =
  "inline-flex items-center justify-center gap-1.5 bg-rose-600 text-white font-bold rounded-xl px-4 py-2.5 shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50";
export const btnXsCls =
  "inline-flex items-center justify-center gap-1 border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 min-h-[40px] text-xs font-bold shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50";
export const chipCls =
  "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-bold border border-slate-300 bg-white transition hover:border-[var(--brand)]";
export const chipActiveCls =
  "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-bold bg-slate-950 text-white transition";
