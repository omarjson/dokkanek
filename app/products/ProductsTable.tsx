"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, btnCls, btnXsCls, inputCls } from "@/components/ui";
import { confirmDialog, toast } from "@/components/toast";
import { IconStar, IconStarFilled } from "@/components/icons";
import { lyd } from "@/lib/format";

type P = {
  id: string; sku: string; name: string; salePrice: number; costPrice: number; costUsd: number;
  quantity: number; barcode: string; isFavorite: boolean; minQuantity: number;
  category?: { name: string } | null;
};

export function ProductsTable({ products, canCost, canEdit, canDelete, showUsd, usdRate }: {
  products: P[]; canCost: boolean; canEdit: boolean; canDelete: boolean; showUsd: boolean; usdRate: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<null | { id: string; name: string; costPrice: string; costUsd: string; salePrice: string; barcode: string; minQuantity: string }>(null);
  const [saving, setSaving] = useState(false);

  async function patch(id: string, body: object, confirmMsg?: string) {
    if (confirmMsg && !(await confirmDialog(confirmMsg))) return false;
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      toast("تعذر التعديل", "error");
      return false;
    }
    router.refresh();
    return true;
  }

  async function saveEdit() {
    if (!editing || !editing.name.trim()) {
      toast("اسم الصنف مطلوب", "error");
      return;
    }
    setSaving(true);
    const ok = await patch(editing.id, {
      name: editing.name.trim(),
      ...(canCost ? { costPrice: Number(editing.costPrice || 0) } : {}),
      ...(showUsd ? { costUsd: Number(editing.costUsd || 0) } : {}),
      salePrice: Number(editing.salePrice || 0),
      barcode: editing.barcode,
      minQuantity: Number(editing.minQuantity || 0),
    });
    setSaving(false);
    if (ok) {
      setEditing(null);
      toast("تم حفظ التعديل", "success");
    }
  }

  async function remove(id: string, name: string) {
    if (!(await confirmDialog(`حذف الصنف "${name}"؟`))) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) toast("تم الحذف", "success");
    else toast("تعذر الحذف", "error");
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.08),0_4px_12px_rgba(16,24,40,0.06)] border border-slate-200/70 overflow-x-auto">
      <table className="w-full text-sm min-w-[760px]">
        <thead>
            <tr className="bg-slate-50 text-slate-500 text-[13px]">
            <th className="p-2 text-start">الصنف</th>
            <th className="p-2 text-start">SKU / باركود</th>
            {canCost && <th className="p-2">التكلفة</th>}
            {showUsd && <th className="p-2">$</th>}
            <th className="p-2">البيع</th>
            <th className="p-2">الكمية</th>
            <th className="p-2">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            editing?.id === p.id ? (
            <tr key={p.id} className="border-t bg-amber-50/60">
              <td colSpan={6} className="p-3">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                  <label className="text-xs font-bold text-slate-600 col-span-2 sm:col-span-1">الاسم
                    <input className={inputCls + " !py-2 mt-1"} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                  </label>
                  {canCost && (
                  <label className="text-xs font-bold text-slate-600">التكلفة
                    <input type="number" min="0" step="0.01" className={inputCls + " !py-2 mt-1"} value={editing.costPrice} onChange={(e) => setEditing({ ...editing, costPrice: e.target.value })} />
                  </label>
                  )}
                  <label className="text-xs font-bold text-slate-600">البيع
                    <input type="number" min="0" step="0.01" className={inputCls + " !py-2 mt-1"} value={editing.salePrice} onChange={(e) => setEditing({ ...editing, salePrice: e.target.value })} />
                  </label>
                  {showUsd && (
                  <label className="text-xs font-bold text-slate-600">دولار (× {usdRate})
                    <input type="number" min="0" step="0.01" className={inputCls + " !py-2 mt-1"} value={editing.costUsd} onChange={(e) => {
                      const usd = e.target.value;
                      setEditing({ ...editing, costUsd: usd, costPrice: canCost && usdRate > 0 ? String(Math.round(Number(usd || 0) * usdRate * 100) / 100) : editing.costPrice });
                    }} />
                  </label>
                  )}
                  <label className="text-xs font-bold text-slate-600">باركود
                    <input className={inputCls + " !py-2 mt-1"} value={editing.barcode} onChange={(e) => setEditing({ ...editing, barcode: e.target.value })} />
                  </label>
                  <label className="text-xs font-bold text-slate-600">حد التنبيه
                    <input type="number" min="0" step="0.01" className={inputCls + " !py-2 mt-1"} value={editing.minQuantity} onChange={(e) => setEditing({ ...editing, minQuantity: e.target.value })} />
                  </label>
                </div>
                <div className="flex gap-2 mt-2">
                  <button className={btnCls + " !py-2 text-sm"} disabled={saving} onClick={saveEdit}>{saving ? "جاري الحفظ..." : "حفظ التعديل"}</button>
                  <button className={btnXsCls} onClick={() => setEditing(null)}>إلغاء</button>
                </div>
              </td>
            </tr>
            ) : (
            <tr key={p.id} className="border-t hover:bg-slate-50">
              <td className="p-2">
                <div className="font-bold flex items-center gap-1.5">
                  {p.isFavorite && <span className="text-amber-500"><IconStarFilled width={15} height={15} /></span>}<Link href={`/products/${p.id}`} className="hover:text-[var(--brand)] hover:underline">{p.name}</Link>
                </div>
                <div className="text-xs text-slate-500">{p.category?.name ?? "—"}</div>
              </td>
              <td className="p-2 text-xs text-slate-600">{p.sku}<br />{p.barcode || "—"}</td>
              {canCost && <td className="p-2 text-center tnum">{lyd(p.costPrice)}</td>}
              {showUsd && <td className="p-2 text-center tnum">${Number(p.costUsd || 0).toFixed(2)}</td>}
              <td className="p-2 text-center font-bold tnum">{lyd(p.salePrice)}</td>
              <td className="p-2 text-center">
                {p.quantity <= p.minQuantity ? (
                  <Badge tone="red">{p.quantity}</Badge>
                ) : (
                  <span>{p.quantity}</span>
                )}
              </td>
              <td className="p-2">
                <div className="flex flex-wrap gap-1">
                  {canEdit && (
                  <button className={btnXsCls} onClick={() => setEditing({ id: p.id, name: p.name, costPrice: String(p.costPrice), costUsd: String(p.costUsd || 0), salePrice: String(p.salePrice), barcode: p.barcode, minQuantity: String(p.minQuantity) })}>
                    تعديل
                  </button>
                  )}
                  <button className={btnXsCls} onClick={() => patch(p.id, { isFavorite: !p.isFavorite })}>
                    <span className="inline-flex items-center gap-1">
                      {p.isFavorite ? <><IconStarFilled width={13} height={13} /> مفضلة</> : <><IconStar width={13} height={13} /> مفضلة</>}
                    </span>
                  </button>
                  <button className={btnXsCls} onClick={() => patch(p.id, { quantity: 0 }, `تصفير كمية "${p.name}"؟`)}>
                    تصفير
                  </button>
                  <Link href={`/sticker/${p.id}`} className={btnXsCls}>ستيكر</Link>
                  {canDelete && <button className={btnXsCls + " !text-rose-600"} onClick={() => remove(p.id, p.name)}>حذف</button>}
                </div>
              </td>
            </tr>
            )
          ))}
        </tbody>
      </table>
    </div>
  );
}
