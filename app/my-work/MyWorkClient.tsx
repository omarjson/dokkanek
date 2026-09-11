"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnCls, btnXsCls, Card, Badge, Empty } from "@/components/ui";
import { toast } from "@/components/toast";
import { lyd, fmtDate, TASK_STATUS, TICKET_STATUS } from "@/lib/format";

type Task = {
  id: string; courierName: string; status: string; collected: number; date: string;
  sale: { id: string; no: string; total: number; paid: number; customerName: string };
};
type Ticket = {
  id: string; no: string; customerName: string; customerPhone: string; device: string;
  issue: string; status: string; cost: number; paid: number; technician: string;
};

export function MyWorkClient({ role, name, tasks, tickets }: { role: string; name: string; tasks: Task[]; tickets: Ticket[] }) {
  const router = useRouter();
  const [collect, setCollect] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function taskAct(id: string, body: object, msg: string) {
    if (busy) return;
    setBusy(true);
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      toast(msg, "success");
      router.refresh();
    } else toast("تعذر التنفيذ", "error");
  }

  async function ticketAct(id: string, body: object, msg: string) {
    if (busy) return;
    setBusy(true);
    const res = await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      toast(msg, "success");
      router.refresh();
    } else toast(j.error || "تعذر التنفيذ", "error");
  }

  if (role === "COURIER") {
    return (
      <div>
        {tasks.length === 0 && <Card><Empty text="لا مهام مسندة إليك حاليا" /></Card>}
        {tasks.map((t) => (
          <Card key={t.id}>
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <b className="text-lg">{t.sale.no}</b> — {t.sale.customerName} <Badge>{TASK_STATUS[t.status] ?? t.status}</Badge>
                <div className="text-xs text-slate-500 mt-0.5">{fmtDate(t.date)}</div>
              </div>
              <div className="text-sm text-end">
                <div>الإجمالي <b>{lyd(t.sale.total)}</b> • المتبقي <b>{lyd(t.sale.total - t.sale.paid)}</b></div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {!t.courierName && (
                    <button className={btnCls + " !py-2 text-sm"} disabled={busy} onClick={() => taskAct(t.id, { status: "WITH_COURIER", courierName: name }, "استلمت المهمة")}>استلام</button>
                  )}
                  {t.courierName === name && t.status !== "DELIVERED" && (
                    <>
                      <button className={btnCls + " !py-2 text-sm"} disabled={busy} onClick={() => taskAct(t.id, { status: "DELIVERED" }, "تم التسليم")}>تم التسليم</button>
                      <button className={btnXsCls} disabled={busy} onClick={() => taskAct(t.id, { status: "FAILED" }, "سُجل تعذر التسليم")}>تعذر</button>
                    </>
                  )}
                </div>
                {t.courierName === name && t.status !== "DELIVERED" && (
                  <div className="flex gap-1 mt-2">
                    <input type="number" min="0" placeholder="تحصيل مبلغ" className={inputCls + " !py-2 text-sm min-w-0 flex-1"} value={collect[t.id] || ""} onChange={(e) => setCollect({ ...collect, [t.id]: e.target.value })} />
                    <button className={btnXsCls} disabled={busy} onClick={() => taskAct(t.id, { collected: Number(collect[t.id] || 0) }, "تم التحصيل")}>تحصيل</button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      {tickets.length === 0 && <Card><Empty text="لا أجهزة مسندة إليك حاليا" /></Card>}
      {tickets.map((t) => (
        <Card key={t.id}>
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <b>{t.no}</b> — {t.device} <Badge>{TICKET_STATUS[t.status] ?? t.status}</Badge>
              <div className="text-xs text-slate-500 mt-0.5">{t.customerName} • {t.customerPhone}{t.issue ? ` • ${t.issue}` : ""}</div>
            </div>
            <div className="text-sm text-end">
              <div>التكلفة <b>{lyd(t.cost)}</b> • المتبقي <b>{lyd(t.cost - t.paid)}</b></div>
              <div className="flex flex-wrap gap-1 mt-2">
                {!t.technician && (
                  <button className={btnCls + " !py-2 text-sm"} disabled={busy} onClick={() => ticketAct(t.id, { action: "advance", technician: name }, "استلمت الجهاز وبدأ الفحص")}>استلام وبدء الفحص</button>
                )}
                {t.technician === name && t.status !== "DELIVERED" && (
                  <button className={btnCls + " !py-2 text-sm"} disabled={busy} onClick={() => ticketAct(t.id, { action: "advance" }, "تحولت للمرحلة التالية")}>المرحلة التالية</button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
