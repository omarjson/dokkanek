"use client";
import { useState } from "react";
import { inputCls, btnCls, PageTitle, Card } from "@/components/ui";
import { IconPrint } from "@/components/icons";

type P = { id: string; name: string; salePrice: number; sku: string; barcode: string };

function Bars({ code }: { code: string }) {
  const bars = code.split("").flatMap((ch, i) => {
    const w = (ch.charCodeAt(0) % 4) + 1;
    return [
      <span key={`${i}-b`} style={{ display: "inline-block", width: w * 2, height: 40, background: "#000" }} />,
      <span key={`${i}-s`} style={{ display: "inline-block", width: (i % 3) + 1, height: 40 }} />,
    ];
  });
  return <div dir="ltr" style={{ lineHeight: 0 }}>{bars}</div>;
}

export function StickersClient({ products }: { products: P[] }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Record<string, number>>({});

  const list = (q
    ? products.filter((p) => p.name.includes(q) || p.sku.includes(q) || (p.barcode || "").includes(q))
    : products
  ).slice(0, 60);

  function toggle(id: string) {
    setSel((s) => {
      const n = { ...s };
      if (n[id]) delete n[id];
      else n[id] = 1;
      return n;
    });
  }

  const jobs = Object.entries(sel)
    .map(([id, qty]) => ({ p: products.find((x) => x.id === id)!, qty: Math.max(1, qty || 1) }))
    .filter((j) => j.p);
  const total = jobs.reduce((s, j) => s + j.qty, 0);

  return (
    <div>
      <PageTitle title="طباعة الستيكرات" sub="اختر الأصناف والعدد ثم اطبع شيتا كاملا" />
      <div className="no-print">
        <Card>
          <input className={inputCls + " mb-2"} placeholder="بحث باسم الصنف / SKU / باركود" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="max-h-56 overflow-auto divide-y divide-slate-100">
            {list.map((p) => (
              <label key={p.id} className="flex items-center gap-2 py-1.5 text-sm cursor-pointer">
                <input type="checkbox" className="w-5 h-5 accent-[var(--brand)]" checked={!!sel[p.id]} onChange={() => toggle(p.id)} />
                <span className="flex-1 font-bold truncate">{p.name}</span>
                {sel[p.id] !== undefined && (
                  <input
                    type="number" min="1" max="999" value={sel[p.id]}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setSel((s) => ({ ...s, [p.id]: Math.max(1, Number(e.target.value || 1)) }))}
                    className="w-20 border border-slate-300 rounded-lg px-2 py-1"
                  />
                )}
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3">
            <b className="text-sm">المجموع: {total} ستيكر</b>
            <button className={btnCls} disabled={total === 0} onClick={() => window.print()}>
              <span className="inline-flex items-center gap-1.5"><IconPrint /> طباعة الشيت</span>
            </button>
          </div>
        </Card>
      </div>
      {jobs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 print:grid-cols-3 gap-3">
            {jobs.flatMap((j) =>
              Array.from({ length: j.qty }, (_, i) => (
                <div key={`${j.p.id}-${i}`} className="border border-dashed border-slate-300 print:border-black rounded-lg p-2 text-center break-inside-avoid">
                  <div className="text-xs font-bold truncate">{j.p.name}</div>
                  <div className="font-extrabold">{j.p.salePrice.toFixed(2)} د.ل</div>
                  <div className="flex justify-center my-1"><Bars code={j.p.barcode || j.p.sku} /></div>
                  <div className="text-[10px] tracking-widest text-slate-500">{j.p.barcode || j.p.sku}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
