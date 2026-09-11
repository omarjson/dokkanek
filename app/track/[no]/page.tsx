export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { lyd, fmtDate, TICKET_STATUS } from "@/lib/format";
import { Badge } from "@/components/ui";
import { IconCheck } from "@/components/icons";

const FLOW = ["RECEIVED", "DIAGNOSIS", "WAITING_PARTS", "READY", "DELIVERED"];

// صفحة عامة (بدون دخول): الزبون يمسح QR أو يفتح الرابط ليتابع جهازه
export default async function TrackPage({ params }: { params: { no: string } }) {
  const t = await prisma.maintenanceTicket.findUnique({
    where: { no: decodeURIComponent(params.no) },
    include: { parts: true },
  });
  if (!t) notFound();

  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const url = `${proto}://${host}/track/${encodeURIComponent(t.no)}`;
  const qr = await QRCode.toDataURL(url, { width: 180, margin: 1 }).catch(() => "");
  const settings = Object.fromEntries((await prisma.setting.findMany()).map((r) => [r.key, r.value]));
  const step = FLOW.indexOf(t.status);

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white border rounded-xl p-6 text-center">
        <h1 className="text-xl font-bold">{settings.store_name || "دكّانك"}</h1>
        <p className="text-sm text-slate-500">تتبع حالة الصيانة — تذكرة {t.no}</p>
        <div className="my-3">
          <Badge tone={t.status === "DELIVERED" ? "green" : t.status === "READY" ? "green" : "blue"}>
            {TICKET_STATUS[t.status] ?? t.status}
          </Badge>
        </div>
        <div className="flex justify-center gap-1 my-4">
          {FLOW.map((s, i) => (
            <div key={s} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  i < step ? "bg-green-500 text-white" : i === step ? "bg-[var(--brand)] text-white" : "bg-slate-200 text-slate-500"
                }`}
              >
                {i < step ? <IconCheck /> : i + 1}
              </div>
              <span className="text-xs mt-1">{TICKET_STATUS[s]}</span>
            </div>
          ))}
        </div>
        <div className="text-sm text-start space-y-1 border-t pt-3">
          <div className="flex justify-between"><span className="text-slate-500">الزبون</span><b>{t.customerName}</b></div>
          <div className="flex justify-between"><span className="text-slate-500">الجهاز</span><b>{t.device}</b></div>
          {t.issue && <div className="flex justify-between"><span className="text-slate-500">العطل</span><b>{t.issue}</b></div>}
          {t.parts.length > 0 && (
            <div className="flex justify-between"><span className="text-slate-500">القطع</span><b>{t.parts.map((p) => p.name).join("، ")}</b></div>
          )}
          <div className="flex justify-between"><span className="text-slate-500">التكلفة</span><b>{lyd(t.cost)}</b></div>
          <div className="flex justify-between"><span className="text-slate-500">المدفوع</span><b>{lyd(t.paid)}</b></div>
          <div className="flex justify-between"><span className="text-slate-500">المتبقي</span><b>{lyd(t.cost - t.paid)}</b></div>
          <div className="flex justify-between"><span className="text-slate-500">تاريخ الاستلام</span><b>{fmtDate(t.receivedAt)}</b></div>
        </div>
        {qr && (
          <div className="mt-4 no-print">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR التتبع" className="mx-auto border rounded-lg" />
            <p className="text-xs text-slate-400 mt-1">امسح الرمز للرجوع لهذه الصفحة</p>
          </div>
        )}
      </div>
    </div>
  );
}
