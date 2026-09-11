export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { lyd } from "@/lib/format";
import { PrintButton } from "@/components/PrintButton";

function Bars({ code }: { code: string }) {
  const bars = code.split("").flatMap((ch, i) => {
    const w = (ch.charCodeAt(0) % 4) + 1;
    return [
      <span key={`${i}-b`} style={{ display: "inline-block", width: w * 2, height: 48, background: "#000" }} />,
      <span key={`${i}-s`} style={{ display: "inline-block", width: (i % 3) + 1, height: 48 }} />,
    ];
  });
  return <div dir="ltr" style={{ lineHeight: 0 }}>{bars}</div>;
}

export default async function StickerPage({ params }: { params: { id: string } }) {
  const p = await prisma.product.findUnique({ where: { id: params.id } });
  if (!p) notFound();
  const settings = Object.fromEntries((await prisma.setting.findMany()).map((r) => [r.key, r.value]));
  return (
    <div>
      <div className="no-print mb-3"><PrintButton label="طباعة الستيكر" /></div>
      <div className="bg-white border-2 border-dashed rounded-lg p-4 w-64 text-center">
        <div className="font-bold text-sm">{settings.store_name || "دكّانك"}</div>
        <div className="text-sm my-1">{p.name}</div>
        <div className="font-bold text-lg my-1">{lyd(p.salePrice)}</div>
        <Bars code={p.barcode || p.sku} />
        <div className="text-xs mt-1 tracking-widest">{p.barcode || p.sku}</div>
      </div>
      <p className="text-xs text-gray-400 mt-2 no-print">لطباعة شيت كامل كرر الصفحة بعدد الستيكرات من نافذة الطباعة.</p>
    </div>
  );
}
