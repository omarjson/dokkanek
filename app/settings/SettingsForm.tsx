"use client";
import { useState } from "react";
import { inputCls, btnCls, Field, Card } from "@/components/ui";

const FIELDS = [
  { key: "store_name", label: "اسم المتجر" },
  { key: "logo_text", label: "نص الشعار" },
  { key: "primary_color", label: "اللون الرئيسي", type: "color" },
  { key: "phone", label: "الهاتف" },
  { key: "address", label: "العنوان" },
  { key: "footer_note", label: "سطر الفاتورة" },
  { key: "currency", label: "العملة" },
  { key: "wa_enabled", label: "تفعيل إرسال واتساب", type: "checkbox" },
  { key: "wa_endpoint", label: "رابط مزود واتساب (Webhook)" },
  { key: "wa_token", label: "مفتاح المزود" },
  { key: "wa_sender", label: "اسم/رقم المرسل" },
  { key: "notify_sale", label: "تنبيه الزبون بفاتورته تلقائيا", type: "checkbox" },
];

export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const [form, setForm] = useState<Record<string, string>>(initial);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      window.location.reload();
    } else alert("تعذر الحفظ");
  }

  return (
    <form onSubmit={save}>
      <Card>
        <div className="grid md:grid-cols-2 gap-2">
          {FIELDS.map((f) => (
            <Field key={f.key} label={f.label}>
              {f.type === "checkbox" ? (
                <input
                  type="checkbox"
                  className="w-5 h-5"
                  checked={form[f.key] === "1"}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.checked ? "1" : "" })}
                />
              ) : (
                <input
                  type={f.type || "text"}
                  className={inputCls}
                  value={form[f.key] || ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              )}
            </Field>
          ))}
        </div>
        <button className={btnCls}>حفظ الإعدادات</button>
        {saved && <span className="text-green-600 text-sm mr-3">تم الحفظ بنجاح</span>}
      </Card>
    </form>
  );
}
