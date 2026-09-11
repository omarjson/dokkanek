"use client";
import { toast } from "@/components/toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnGhostCls, Card, Badge } from "@/components/ui";
import { lyd, fmtDate, TASK_STATUS } from "@/lib/format";

type T = {
  id: string; courierName: string; status: string; codAmount: number; collected: number;
  date: string; sale: { id: string; no: string; total: number; paid: number; customer?: { name: string } | null };
};

const TONE: Record<string, "green" | "red" | "amber" | "blue" | "gray"> = {
  PENDING: "amber", WITH_COURIER: "blue", DELIVERED: "green", FAILED: "red",
};

export function DeliveryClient({ tasks }: { tasks: T[] }) {
  const router = useRouter();
  const [collect, setCollect] = useState<Record<string, string>>({});

  async function patch(id: string, body: object) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) router.refresh();
    else toast("تعذر التحديث");
  }

  return (
    <div>
      {tasks.map((t) => (
        <Card key={t.id}>
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <b>{t.sale.no}</b> — {t.sale.customer?.name ?? "بدون زبون"} <Badge tone={TONE[t.status] ?? "gray"}>{TASK_STATUS[t.status] ?? t.status}</Badge>
              <div className="text-xs text-gray-500">المندوب: {t.courierName || "—"} • {fmtDate(t.date)}</div>
            </div>
            <div className="text-sm text-left">
              <div>الإجمالي {lyd(t.sale.total)} • المحصل {lyd(t.collected)} • المتبقي {lyd(t.sale.total - t.sale.paid)}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                <button className={btnGhostCls + " !px-2 !py-1 text-xs"} onClick={() => patch(t.id, { status: "WITH_COURIER" })}>بحوزة المندوب</button>
                <button className={btnGhostCls + " !px-2 !py-1 text-xs"} onClick={() => patch(t.id, { status: "DELIVERED" })}>تم التسليم</button>
                <button className={btnGhostCls + " !px-2 !py-1 text-xs"} onClick={() => patch(t.id, { status: "FAILED" })}>تعذر</button>
              </div>
              <div className="flex gap-1 mt-1">
                <input type="number" min="0" placeholder="تحصيل مبلغ" className={inputCls + " !py-1 text-xs"} value={collect[t.id] || ""} onChange={(e) => setCollect({ ...collect, [t.id]: e.target.value })} />
                <button className={btnGhostCls + " !px-2 !py-1 text-xs"} onClick={() => patch(t.id, { collected: Number(collect[t.id] || 0) })}>تحصيل</button>
              </div>
            </div>
          </div>
        </Card>
      ))}
      {tasks.length === 0 && <Card><p className="text-center text-gray-400 py-6">لا مهام توصيل — فواتير التوصيل من نقطة البيع تظهر هنا</p></Card>}
    </div>
  );
}
