"use client";
import { toast } from "@/components/toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnCls, Field, Card, Badge, SectionTitle } from "@/components/ui";
import { IconClock } from "@/components/icons";
import { lyd, fmtDate } from "@/lib/format";

type Shift = { id: string; opening: number; closing: number | null; openedAt: string; closedAt: string | null; status: string };

async function call(body: object) {
  const res = await fetch("/api/shifts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, j: await res.json().catch(() => ({})) };
}

export function ShiftsClient({ open, history, expected }: { open: Shift | null; history: Shift[]; expected: number }) {
  const router = useRouter();
  const [opening, setOpening] = useState("");
  const [closing, setClosing] = useState("");
  const [last, setLast] = useState<{ expected: number; closing: number; diff: number } | null>(null);

  return (
    <div>
      <Card>
        {open ? (
          <div>
            <p>وردية مفتوحة منذ <b>{fmtDate(open.openedAt)}</b> — العهدة الافتتاحية <b>{lyd(open.opening)}</b></p>
            <p className="mt-1">المتوقع في الدرج الآن (عهدة + مقبوضات نقدية): <b>{lyd(expected)}</b></p>
            <div className="flex flex-wrap gap-2 mt-3 items-end">
              <Field label="الجرد الفعلي">
                <input type="number" min="0" step="0.01" className={inputCls} value={closing} onChange={(e) => setClosing(e.target.value)} placeholder={String(expected)} />
              </Field>
              <button
                className={btnCls}
                onClick={async () => {
                  const { ok, j } = await call({ action: "close", closing: Number(closing || expected) });
                  if (ok) { setLast(j); setClosing(""); router.refresh(); } else toast(j.error || "تعذر الإقفال");
                }}
              >
                إقفال الوردية
              </button>
            </div>
            {last && (
              <p className="mt-2 text-sm">
                آخر إقفال: متوقع {lyd(last.expected)} / فعلي {lyd(last.closing)} / الفرق{" "}
                <Badge tone={last.diff === 0 ? "green" : "red"}>{lyd(last.diff)}</Badge>
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 items-end">
            <Field label="عهدة الدرج الافتتاحية">
              <input type="number" min="0" step="0.01" className={inputCls} value={opening} onChange={(e) => setOpening(e.target.value)} />
            </Field>
            <button
              className={btnCls}
              onClick={async () => {
                const { ok, j } = await call({ action: "open", opening: Number(opening || 0) });
                if (ok) { setOpening(""); router.refresh(); } else toast(j.error || "تعذر الفتح");
              }}
            >
              فتح وردية
            </button>
          </div>
        )}
      </Card>
      <Card>
        <SectionTitle icon={IconClock} title="سجل الورديات" />
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <tbody>
            {history.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="py-1 text-xs">{fmtDate(s.openedAt)}</td>
                <td className="text-center">{lyd(s.opening)}</td>
                <td className="text-center">{s.closing != null ? lyd(s.closing) : "—"}</td>
                <td><Badge tone={s.status === "OPEN" ? "green" : "gray"}>{s.status === "OPEN" ? "مفتوحة" : "مغلقة"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {history.length === 0 && <p className="text-center text-slate-400 py-6">لا ورديات بعد</p>}
      </Card>
    </div>
  );
}
