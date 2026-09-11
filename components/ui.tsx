import type { ReactNode } from "react";

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">{children}</div>
  );
}

const TONES: Record<string, string> = {
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-blue-100 text-blue-800",
  gray: "bg-gray-100 text-gray-700",
};

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: keyof typeof TONES }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="text-gray-400 text-sm py-6 text-center">{text}</p>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block mb-2">
      <span className="block text-sm mb-1 text-gray-600">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]";
export const btnCls =
  "bg-[var(--brand)] text-white rounded-lg px-4 py-2 hover:opacity-90 disabled:opacity-50";
export const btnGhostCls = "border rounded-lg px-4 py-2 hover:bg-gray-50 disabled:opacity-50";
