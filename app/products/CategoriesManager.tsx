"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnCls, btnGhostCls, btnXsCls, Card, Badge, SectionTitle } from "@/components/ui";
import { IconBox } from "@/components/icons";
import { toast } from "@/components/toast";

type C = { id: string; name: string; _count: { products: number } };

export function CategoriesManager({ categories }: { categories: C[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setName("");
      setOpen(false);
      toast("تمت إضافة التصنيف", "success");
      router.refresh();
    } else toast(j.error || "تعذر الحفظ", "error");
  }

  async function rename() {
    if (!editing || !editing.name.trim()) return;
    const res = await fetch(`/api/categories/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editing.name.trim() }),
    });
    if (res.ok) {
      setEditing(null);
      toast("تم التعديل", "success");
      router.refresh();
    } else toast("تعذر التعديل", "error");
  }

  async function remove(id: string, n: number) {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      toast("تم الحذف", "success");
      router.refresh();
    } else toast(j.error || "تعذر الحذف", "error");
    void n;
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <SectionTitle icon={IconBox} title={`التصنيفات (${categories.length})`} />
        <button className={btnGhostCls + " text-sm"} onClick={() => setOpen(!open)}>+ تصنيف</button>
      </div>
      {open && (
        <form onSubmit={create} className="flex gap-2 mb-2">
          <input className={inputCls} placeholder="اسم التصنيف الجديد" value={name} onChange={(e) => setName(e.target.value)} required />
          <button className={btnCls}>حفظ</button>
        </form>
      )}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold">
            {editing?.id === c.id ? (
              <>
                <input className="w-28 border border-slate-300 rounded-lg px-1.5 py-1 text-xs" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                <button className="text-emerald-700" onClick={rename}>حفظ</button>
                <button className="text-slate-400" onClick={() => setEditing(null)}>×</button>
              </>
            ) : (
              <>
                {c.name} <Badge tone="gray">{c._count.products}</Badge>
                <button className="text-[var(--brand)] hover:underline" onClick={() => setEditing({ id: c.id, name: c.name })}>تعديل</button>
                {c._count.products === 0 && (
                  <button className="text-rose-600 hover:underline" onClick={() => remove(c.id, c._count.products)}>حذف</button>
                )}
              </>
            )}
          </span>
        ))}
        {categories.length === 0 && <p className="text-slate-400 text-sm">لا تصنيفات — أضف الأول</p>}
      </div>
    </Card>
  );
}
