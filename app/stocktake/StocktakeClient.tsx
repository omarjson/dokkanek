"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnCls, btnGhostCls, Field, Card, Badge, SectionTitle } from "@/components/ui";
import { IconBox, IconCheck } from "@/components/icons";
import { toast } from "@/components/toast";
import { lyd, fmtDate } from "@/lib/format";

type Product = { id: string; name: string; sku: string; quantity: number };
type Item = { id: string; countedQty: number; systemQty: number; product: { id: string; name: string; sku: string } };
type ST = { id: string; no: string; status: string; note: string; createdAt: string; items: Item[] };

export function StocktakeClient({ sessions, products }: { sessions: ST[]; products: Product[] }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [openId, setOpenId] = useState<string | null>(sessions.find((s) => s.status === "OPEN")?.id || null);
  const [q, setQ] = useState("");
  const [counts, setCounts] = useState<Record<string, string>>({});

  async function create() {
    const res = await fetch("/api/stocktake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setNote("");
      setOpenId(j.id);
      toast(`فُتح الجرد ${j.no}`, "success");
      router.refresh();
    } else toast(j.error || "تعذر الفتح", "error");
  }

  async function addCount(productId: string) {
    const v = Number(counts[productId] || "0");
    const res = await fetch(`/api/stocktake/${openId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", productId, countedQty: v }),
    });
    if (res.ok) {
      setCounts((c) => ({ ...c, [productId]: "" }));
      router.refresh();
    } else toast("تعذر الحفظ", "error");
  }

  async function close(id: string) {
    const res = await fetch(`/api/stocktake/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      toast(`أُقفل الجرد وسُوّي ${j.adjusted} صنف`, "success");
      setOpenId(null);
      router.refresh();
    } else toast(j.error || "تعذر الإقفال", "error");
  }

  const open = sessions.find((s) => s.id === openId && s.status === "OPEN") || null;
  const list = q
    ? products.filter((p) => p.name.includes(q) || p.sku.includes(q)).slice(0, 20)
    : products.slice(0, 20);

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-end mb-4">
        <Field label="ملاحظة الجرد الجديد">
          <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="جرد شهري مثلا" />
        </Field>
        <button className={btnCls} onClick={create}>+ فتح جرد</button>
        {sessions.filter((s) => s.status === "OPEN").map((s) => (
          <button key={s.id} onClick={() => setOpenId(s.id)} className={btnGhostCls + " text-sm"}>
            {s.no} {openId === s.id ? "(مفتوح هنا)" : ""}
          </button>
        ))}
      </div>

      {open && (
        <Card>
          <SectionTitle icon={IconBox} title={`الجرد ${open.no} — عدّ ثم اقفل للتسوية`} />
          <input className={inputCls + " mb-2"} placeholder="بحث عن صنف لعده" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="grid sm:grid-cols-2 gap-2 mb-3">
            {list.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2">
                <span className="flex-1 min-w-0 text-sm font-bold truncate">{p.name}<span className="block text-xs text-slate-400 font-normal">النظام: {p.quantity}</span></span>
                <input
                  type="number" min="0" step="0.01" placeholder="المعدود"
                  className="w-24 border border-slate-300 rounded-lg px-2 py-1.5"
                  value={counts[p.id] || ""}
                  onChange={(e) => setCounts({ ...counts, [p.id]: e.target.value })}
                />
                <button className={btnGhostCls + " !px-3 !py-1.5 text-sm"} onClick={() => addCount(p.id)}>حفظ</button>
              </div>
            ))}
          </div>
          <h3 className="font-extrabold text-sm mb-1">المعدود ({open.items.length})</h3>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm min-w-[480px]">
              <tbody>
                {open.items.map((it) => {
                  const diff = it.countedQty - it.systemQty;
                  return (
                    <tr key={it.id} className="border-t border-slate-100">
                      <td className="py-1 font-bold">{it.product.name}</td>
                      <td className="text-center">{it.systemQty}</td>
                      <td className="text-center">{it.countedQty}</td>
                      <td className="text-center">
                        {diff === 0 ? <Badge tone="green">مطابق</Badge> : <Badge tone={diff > 0 ? "blue" : "red"}>{diff > 0 ? "+" : ""}{diff}</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button className={btnCls} onClick={() => close(open.id)}>
            <span className="inline-flex items-center gap-2"><IconCheck /> إقفال وتسوية الفروقات</span>
          </button>
        </Card>
      )}

      <Card>
        <SectionTitle icon={IconBox} title="سجل الجرد" />
        {sessions.filter((s) => s.status === "CLOSED").map((s) => (
          <div key={s.id} className="border-t border-slate-100 py-2 text-sm flex justify-between">
            <span><b>{s.no}</b> <span className="text-slate-500">• {s.items.length} صنف • {fmtDate(s.createdAt)}</span></span>
            <Badge tone="gray">مقفل</Badge>
          </div>
        ))}
        {sessions.filter((s) => s.status === "CLOSED").length === 0 && <p className="text-slate-400 text-sm">لا جرد مقفل بعد</p>}
      </Card>
    </div>
  );
}
