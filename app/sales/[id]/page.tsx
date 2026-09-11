export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { lyd, fmtDate, SALE_STATUS, PAY_METHODS } from "@/lib/format";
import { PrintButton } from "@/components/PrintButton";

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const sale = await prisma.sale.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: true } }, customer: true, cashier: true, branch: true },
  });
  if (!sale) notFound();
  const settings = Object.fromEntries((await prisma.setting.findMany()).map((r) => [r.key, r.value]));

  return (
    <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 print:border-0 print:rounded-none print:max-w-none print:p-0 print:shadow-none">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold">{settings.store_name || "دكّانك"}</h1>
        <p className="text-xs text-slate-500">{settings.address || ""} • {settings.phone || ""}</p>
        <p className="text-sm mt-2">فاتورة مبيعات: <b>{sale.no}</b></p>
        <p className="text-xs text-slate-500">{SALE_STATUS[sale.status] ?? sale.status} • {PAY_METHODS[sale.payMethod] ?? sale.payMethod} • {fmtDate(sale.date)}</p>
        {sale.customer && <p className="text-sm">الزبون: {sale.customer.name}</p>}
        {sale.cashier && <p className="text-xs text-slate-500">الكاشير: {sale.cashier.name}</p>}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-start py-1">الصنف</th>
            <th>الكمية</th>
            <th>السعر</th>
            <th className="text-end">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((it) => (
            <tr key={it.id} className="border-b">
              <td className="py-1">{it.product.name}</td>
              <td className="text-center">{it.qty}</td>
              <td className="text-center">{lyd(it.price)}</td>
              <td className="text-end">{lyd(it.price * it.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-sm mt-3 space-y-1 print:text-black">
        <div className="flex justify-between"><span>المجموع الفرعي</span><b className="tnum">{lyd(sale.subtotal)}</b></div>
        <div className="flex justify-between"><span>الخصم</span><b className="tnum">{lyd(sale.discount)}</b></div>
        <div className="flex justify-between text-lg print:text-base"><span>الإجمالي</span><b className="tnum">{lyd(sale.total)}</b></div>
        <div className="flex justify-between"><span>المدفوع</span><b className="tnum">{lyd(sale.paid)}</b></div>
        <div className="flex justify-between"><span>المتبقي</span><b className="tnum">{lyd(sale.total - sale.paid)}</b></div>
      </div>
      <p className="text-center text-xs text-slate-500 print:text-black mt-4">{settings.footer_note || "شكرا لتسوقكم معنا"}</p>
      <div className="mt-4 no-print"><PrintButton label="طباعة الفاتورة" /></div>
    </div>
  );
}
