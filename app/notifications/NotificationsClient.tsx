"use client";
import { toast } from "@/components/toast";
import { useRouter } from "next/navigation";
import { btnCls, Card, Badge } from "@/components/ui";
import { fmtDate } from "@/lib/format";

type N = {
  id: string; to: string; template: string; body: string; status: string;
  error: string; createdAt: string; sentAt: string | null;
};

const TONE: Record<string, "green" | "red" | "amber" | "gray"> = {
  SENT: "green", FAILED: "red", PENDING: "amber",
};
const LABEL: Record<string, string> = { SENT: "مرسل", FAILED: "فشل", PENDING: "بالانتظار" };

export function NotificationsClient({ items, enabled }: { items: N[]; enabled: boolean }) {
  const router = useRouter();

  async function retry() {
    const res = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "retry" }),
    });
    if (res.ok) router.refresh();
    else toast("تعذرت إعادة المحاولة");
  }

  return (
    <div>
      {!enabled && (
        <Card>
          <p className="text-sm text-amber-700 font-bold">التنبيهات محفوظة في قائمة الانتظار — <a href="/settings" className="underline">فعّل إرسال واتساب من الإعدادات</a> لبدء الإرسال الحقيقي.</p>
        </Card>
      )}
      <button className={btnCls + " mb-3"} onClick={retry}>إعادة محاولة الكل</button>
      <Card>
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <tbody>
            {items.map((n) => (
              <tr key={n.id} className="border-t">
                <td className="py-1"><Badge tone={TONE[n.status] ?? "gray"}>{LABEL[n.status] ?? n.status}</Badge></td>
                <td className="py-1 font-bold">{n.to}</td>
                <td className="py-1 text-xs text-slate-600">{n.template} — {n.body.slice(0, 80)}</td>
                <td className="py-1 text-xs text-slate-500">{fmtDate(n.createdAt)}{n.error ? ` • ${n.error}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {items.length === 0 && <p className="text-center text-slate-400 py-6">لا تنبيهات بعد — تُنشأ تلقائيا عند جهوزية الصيانة (لو رقم الزبون موجود)</p>}
      </Card>
    </div>
  );
}
