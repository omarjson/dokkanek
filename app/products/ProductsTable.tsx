"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, btnGhostCls, btnXsCls } from "@/components/ui";
import { confirmDialog, toast } from "@/components/toast";
import { IconStar, IconStarFilled } from "@/components/icons";
import { lyd } from "@/lib/format";

type P = {
  id: string; sku: string; name: string; salePrice: number; costPrice: number;
  quantity: number; barcode: string; isFavorite: boolean; minQuantity: number;
  category?: { name: string } | null;
};

export function ProductsTable({ products }: { products: P[] }) {
  const router = useRouter();

  async function patch(id: string, body: object, confirmMsg?: string) {
    if (confirmMsg && !(await confirmDialog(confirmMsg))) return;
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) toast("تعذر التعديل", "error");
    router.refresh();
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
            <th className="p-2">التكلفة</th>
            <th className="p-2">البيع</th>
            <th className="p-2">الكمية</th>
            <th className="p-2">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t hover:bg-slate-50">
              <td className="p-2">
                <div className="font-bold flex items-center gap-1.5">
                  {p.isFavorite && <span className="text-amber-500"><IconStarFilled width={15} height={15} /></span>}{p.name}
                </div>
                <div className="text-xs text-slate-500">{p.category?.name ?? "—"}</div>
              </td>
              <td className="p-2 text-xs text-slate-600">{p.sku}<br />{p.barcode || "—"}</td>
              <td className="p-2 text-center">{lyd(p.costPrice)}</td>
              <td className="p-2 text-center font-bold">{lyd(p.salePrice)}</td>
              <td className="p-2 text-center">
                {p.quantity <= p.minQuantity ? (
                  <Badge tone="red">{p.quantity}</Badge>
                ) : (
                  <span>{p.quantity}</span>
                )}
              </td>
              <td className="p-2">
                <div className="flex flex-wrap gap-1">
                  <button className={btnXsCls} onClick={() => patch(p.id, { isFavorite: !p.isFavorite })}>
                    <span className="inline-flex items-center gap-1">
                      {p.isFavorite ? <><IconStarFilled width={13} height={13} /> مفضلة</> : <><IconStar width={13} height={13} /> مفضلة</>}
                    </span>
                  </button>
                  <button className={btnXsCls} onClick={() => patch(p.id, { quantity: 0 }, `تصفير كمية "${p.name}"؟`)}>
                    تصفير
                  </button>
                  <Link href={`/sticker/${p.id}`} className={btnXsCls}>ستيكر</Link>
                  <button className={btnXsCls + " !text-rose-600"} onClick={() => remove(p.id, p.name)}>حذف</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
