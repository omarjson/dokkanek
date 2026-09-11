"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnCls, btnXsCls, Field, Card, Badge, SectionTitle } from "@/components/ui";
import { IconUsers } from "@/components/icons";
import { ROLES } from "@/lib/format";
import { toast } from "@/components/toast";

type U = { id: string; name: string; username: string; role: string; active: boolean; branch?: { name: string } | null };

export function UsersClient({ users, branches }: { users: U[]; branches: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "CASHIER", branchId: "" });
  const [busy, setBusy] = useState(false);
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [newPass, setNewPass] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, branchId: form.branchId || null }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setForm({ name: "", username: "", password: "", role: "CASHIER", branchId: "" });
      setOpen(false);
      toast("تم إنشاء المستخدم", "success");
      router.refresh();
    } else toast(j.error || "تعذر الإنشاء", "error");
  }

  async function patch(id: string, body: object, msg: string) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      toast(msg, "success");
      router.refresh();
    } else toast(j.error || "تعذر التنفيذ", "error");
  }

  async function resetPass(id: string) {
    if (newPass.length < 4) {
      toast("كلمة المرور 4 أحرف على الأقل", "error");
      return;
    }
    await patch(id, { password: newPass }, "تم تصفير كلمة المرور");
    setResetFor(null);
    setNewPass("");
  }

  return (
    <div>
      <button className={btnCls + " mb-3"} onClick={() => setOpen(!open)}>+ مستخدم جديد</button>
      {open && (
        <form onSubmit={create}>
          <Card>
            <div className="grid sm:grid-cols-3 gap-2">
              <Field label="الاسم *"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
              <Field label="اسم المستخدم *"><input className={inputCls} dir="ltr" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></Field>
              <Field label="كلمة المرور *"><input type="password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>
              <Field label="الدور">
                <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="الفرع">
                <select className={inputCls} value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                  <option value="">بدون فرع محدد</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
            </div>
            <button className={btnCls} disabled={busy}>{busy ? "جاري..." : "إنشاء"}</button>
          </Card>
        </form>
      )}
      <Card>
        <SectionTitle icon={IconUsers} title={`المستخدمون (${users.length})`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={`border-t border-slate-100 ${u.active ? "" : "opacity-50"}`}>
                  <td className="py-2 font-bold">{u.name}<span className="block text-xs text-slate-500 font-normal" dir="ltr">{u.username} • {u.branch?.name || "كل الفروع"}</span></td>
                  <td className="p-2">
                    <select
                      className="border border-slate-300 rounded-lg px-1 py-1.5 text-xs bg-white"
                      value={u.role}
                      onChange={(e) => patch(u.id, { role: e.target.value }, "تم تغيير الدور")}
                    >
                      {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <Badge tone={u.active ? "green" : "gray"}>{u.active ? "نشط" : "موقوف"}</Badge>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      <button className={btnXsCls} onClick={() => patch(u.id, { active: !u.active }, u.active ? "تم إيقاف المستخدم" : "تم تفعيل المستخدم")}>
                        {u.active ? "إيقاف" : "تفعيل"}
                      </button>
                      <button className={btnXsCls} onClick={() => setResetFor(resetFor === u.id ? null : u.id)}>كلمة جديدة</button>
                    </div>
                    {resetFor === u.id && (
                      <div className="flex gap-1 mt-1">
                        <input type="password" placeholder="كلمة جديدة" className={inputCls + " !py-1.5 text-sm"} value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                        <button className={btnXsCls} onClick={() => resetPass(u.id)}>حفظ</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
