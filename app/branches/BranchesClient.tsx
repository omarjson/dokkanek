"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnCls, Field, Card, Badge, SectionTitle } from "@/components/ui";
import { IconBox } from "@/components/icons";
import { toast } from "@/components/toast";

type B = { id: string; name: string; city: string; phone: string; warehouses: { id: string; name: string }[]; _count: { users: number } };

export function BranchesClient({ branches }: { branches: B[] }) {
  const router = useRouter();
  const [bform, setBform] = useState({ name: "", city: "", phone: "" });
  const [wform, setWform] = useState({ name: "", branchId: "" });
  const [busy, setBusy] = useState(false);

  async function submit(body: object, msg: string) {
    if (busy) return;
    setBusy(true);
    const res = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      toast(msg, "success");
      router.refresh();
    } else toast(j.error || "تعذر الحفظ", "error");
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <div className="min-w-0">
        {branches.map((b) => (
          <Card key={b.id}>
            <div className="flex justify-between items-center">
              <b className="text-lg">{b.name}</b>
              <Badge>{b._count.users} موظف</Badge>
            </div>
            <div className="text-xs text-slate-500 mb-2">{b.city} • {b.phone}</div>
            <div className="flex flex-wrap gap-1.5">
              {b.warehouses.map((w) => (
                <span key={w.id} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold">
                  مخزن: {w.name}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <div className="min-w-0">
        <Card>
          <SectionTitle icon={IconBox} title="فرع جديد" />
          <div className="grid sm:grid-cols-3 gap-2 items-end">
            <Field label="اسم الفرع *"><input className={inputCls} value={bform.name} onChange={(e) => setBform({ ...bform, name: e.target.value })} /></Field>
            <Field label="المدينة"><input className={inputCls} value={bform.city} onChange={(e) => setBform({ ...bform, city: e.target.value })} /></Field>
            <Field label="الهاتف"><input className={inputCls} value={bform.phone} onChange={(e) => setBform({ ...bform, phone: e.target.value })} /></Field>
          </div>
          <button className={btnCls} disabled={busy} onClick={() => bform.name.trim() ? submit({ ...bform }, "تم إنشاء الفرع مع مخزنه") : toast("اكتب اسم الفرع", "error")}>
            + فرع (يُنشأ معه مخزن رئيسي)
          </button>
        </Card>
        <Card>
          <SectionTitle icon={IconBox} title="مخزن جديد لفرع" />
          <div className="grid sm:grid-cols-2 gap-2 items-end">
            <Field label="اسم المخزن *"><input className={inputCls} value={wform.name} onChange={(e) => setWform({ ...wform, name: e.target.value })} /></Field>
            <Field label="الفرع *">
              <select className={inputCls} value={wform.branchId} onChange={(e) => setWform({ ...wform, branchId: e.target.value })}>
                <option value="">—</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
          </div>
          <button className={btnCls} disabled={busy} onClick={() => wform.name.trim() && wform.branchId ? submit({ kind: "warehouse", ...wform }, "تم إنشاء المخزن") : toast("أكمل البيانات", "error")}>
            + مخزن
          </button>
        </Card>
      </div>
    </div>
  );
}
