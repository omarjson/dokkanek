export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { lyd, fmtDate } from "@/lib/format";
import { PageTitle, Card, Badge, SectionTitle } from "@/components/ui";
import { IconBox } from "@/components/icons";

const MOVE_LABEL: Record<string, string> = {
  IN: "دخول", OUT: "بيع", ADJUST: "تعديل", TRANSFER: "تحويل", DAMAGE: "تالف", RETURN: "راجع",
};

// كارت الصنف: كل حركات المخزون لصنف واحد مع الرصيد الجاري
export default async function ProductLedgerPage({ params }: { params: { id: string } }) {
  const p = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      stockMoves: { orderBy: { date: "desc" }, take: 200 },
      saleItems: { include: { sale: true }, orderBy: { saleId: "desc" }, take: 10 },
    },
  });
  if (!p) notFound();

  return (
    <div className="max-w-3xl mx-auto">
      <PageTitle title={p.name} sub={`${p.sku} • ${p.category?.name ?? "بدون تصنيف"} • الرصيد الحالي ${p.quantity}`} />
      <Card>
        <div className="grid grid-cols-3 gap-2 text-center text-sm mb-2">
          <div><div className="text-slate-500 text-xs">التكلفة</div><b className="tnum">{lyd(p.costPrice)}</b></div>
          <div><div className="text-slate-500 text-xs">البيع</div><b className="tnum">{lyd(p.salePrice)}</b></div>
          <div><div className="text-slate-500 text-xs">الرصيد</div><b className="tnum">{p.quantity}</b></div>
        </div>
        <SectionTitle icon={IconBox} title={`سجل الحركات (${p.stockMoves.length})`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <tbody>
              {p.stockMoves.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="py-1.5 text-xs text-slate-500">{fmtDate(m.date)}</td>
                  <td className="py-1.5"><Badge tone={m.qty >= 0 ? "green" : "red"}>{MOVE_LABEL[m.type] ?? m.type}</Badge></td>
                  <td className="py-1.5 text-center font-bold tnum">{m.qty > 0 ? `+${m.qty}` : m.qty}</td>
                  <td className="py-1.5 text-xs text-slate-500">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {p.stockMoves.length === 0 && <p className="text-center text-slate-400 py-4 text-sm">لا حركات مسجلة</p>}
        <div className="mt-3 no-print">
          <Link href="/products" className="text-xs font-bold text-[var(--brand)] hover:underline">رجوع للأصناف</Link>
        </div>
      </Card>
    </div>
  );
}
