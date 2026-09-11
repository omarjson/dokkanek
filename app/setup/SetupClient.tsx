"use client";
import { useState } from "react";
import { inputCls, btnCls, btnGhostCls, Field } from "@/components/ui";
import { IconStore, IconCheck } from "@/components/icons";
import { PRESETS } from "@/lib/modules";
import { toast } from "@/components/toast";

const COLORS = ["#0d6efd", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#16a34a", "#0e7490", "#1e293b"];

export function SetupClient() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    store_name: "", phone: "", address: "", currency: "د.ل",
    store_type: "general", primary_color: "#0d6efd",
    admin_name: "", admin_username: "", admin_password: "", clean: false,
  });
  function set(k: string, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function install() {
    setLoading(true);
    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form }),
    });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      toast("تم التثبيت بنجاح — مرحبا بك", "success");
      setTimeout(() => (window.location.href = "/"), 800);
    } else {
      toast(j.error || "تعذر التثبيت", "error");
    }
  }

  const steps = ["الترحيب", "المتجر", "النشاط", "الهوية", "المدير", "التثبيت"];

  return (
    <div className="min-h-screen bg-[#eef1f6] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_24px_64px_-16px_rgba(2,6,23,0.25)] border border-slate-200/70 p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="flex items-center justify-center w-10 h-10 rounded-2xl text-white font-display font-bold text-lg" style={{ background: form.primary_color }}>
            {(form.store_name || "د").trim().charAt(0) || "د"}
          </span>
          <span className="font-display font-semibold text-xl">تثبيت دكّانك</span>
        </div>
        <div className="flex gap-1.5 my-4">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? "" : "bg-slate-100"}`} style={i <= step ? { background: form.primary_color } : undefined} />
              <div className={`text-[11px] mt-1 ${i === step ? "font-bold" : "text-slate-400"}`}>{s}</div>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="text-center py-6">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-3 text-white" style={{ background: form.primary_color }}>
              <IconStore width={32} height={32} />
            </span>
            <h1 className="font-display font-semibold text-2xl mb-2">أهلا بك في دكّانك</h1>
            <p className="text-sm text-slate-500 leading-7 mb-6">معالج من 5 خطوات يجهز محلك: البيانات، النشاط، الهوية، وحساب المدير — في أقل من دقيقتين.</p>
            <button className={btnCls} onClick={() => setStep(1)}>ابدأ التثبيت</button>
          </div>
        )}

        {step === 1 && (
          <div className="grid sm:grid-cols-2 gap-2">
            <Field label="اسم المتجر *"><input className={inputCls} value={form.store_name} onChange={(e) => set("store_name", e.target.value)} placeholder="مثال: النور للهواتف" /></Field>
            <Field label="الهاتف"><input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="09xxxxxxxx" /></Field>
            <Field label="العنوان"><input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="طرابلس — ..." /></Field>
            <Field label="العملة"><input className={inputCls} value={form.currency} onChange={(e) => set("currency", e.target.value)} /></Field>
          </div>
        )}

        {step === 2 && (
          <div className="grid sm:grid-cols-2 gap-2">
            {Object.entries(PRESETS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => set("store_type", key)}
                className={`rounded-2xl border p-4 text-start transition ${
                  form.store_type === key ? "border-transparent shadow-md" : "border-slate-200 hover:border-slate-300"
                }`}
                style={form.store_type === key ? { boxShadow: `inset 0 0 0 2px ${form.primary_color}` } : undefined}
              >
                <b className="block">{p.label}</b>
                <span className="text-xs text-slate-500">
                  {key === "general" && "كل الوحدات تعمل"}
                  {key === "phones" && "مبيعات + صيانة + توصيل"}
                  {key === "grocery" && "بدون صيانة وربط خارجي"}
                  {key === "clothing" && "بدون صيانة"}
                </span>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div>
            <Field label="اللون الرئيسي">
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("primary_color", c)}
                    aria-label={c}
                    className={`w-10 h-10 rounded-xl transition ${form.primary_color === c ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : ""}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </Field>
            <div className="rounded-2xl border border-slate-200 p-4 mt-2 flex items-center gap-3">
              <span className="flex items-center justify-center w-11 h-11 rounded-2xl text-white font-display font-bold text-xl" style={{ background: form.primary_color }}>
                {(form.store_name || "د").trim().charAt(0) || "د"}
              </span>
              <div>
                <div className="font-display font-semibold text-lg">{form.store_name || "اسم متجرك"}</div>
                <div className="text-xs text-slate-500">هكذا سيظهر في القائمة والفواتير</div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid sm:grid-cols-2 gap-2">
            <Field label="اسم المدير"><input className={inputCls} value={form.admin_name} onChange={(e) => set("admin_name", e.target.value)} placeholder="اسمك الكريم" /></Field>
            <Field label="اسم المستخدم *"><input className={inputCls} dir="ltr" value={form.admin_username} onChange={(e) => set("admin_username", e.target.value)} placeholder="admin" /></Field>
            <Field label="كلمة المرور * (4 أحرف على الأقل)"><input type="password" className={inputCls} value={form.admin_password} onChange={(e) => set("admin_password", e.target.value)} /></Field>
            <label className="flex items-start gap-2 rounded-2xl border border-slate-200 p-3 cursor-pointer sm:col-span-2">
              <input type="checkbox" className="w-6 h-6 accent-[var(--brand)] shrink-0" checked={form.clean} onChange={(e) => set("clean", e.target.checked)} />
              <span>
                <b className="block text-sm">بداية نظيفة (بدون بيانات تجريبية)</b>
                <span className="block text-xs text-slate-500">بدونها تُترك بيانات تجريبية للتعلم والحذف لاحقا</span>
              </span>
            </label>
          </div>
        )}

        {step === 5 && (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm leading-7">
            <p><b>المتجر:</b> {form.store_name || "—"} • {form.phone} • {form.address}</p>
            <p><b>النشاط:</b> {PRESETS[form.store_type]?.label}</p>
            <p><b>المدير:</b> {form.admin_username} {form.clean ? "• بداية نظيفة" : "• مع بيانات تجريبية"}</p>
            <p className="text-slate-500 text-xs mt-2">بالضغط على تثبيت سيُنشأ حساب المدير وتُطبق الإعدادات فورا.</p>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button className={btnGhostCls} disabled={step === 0} onClick={() => setStep(step - 1)}>رجوع</button>
          {step < 5 ? (
            <button
              className={btnCls}
              style={{ background: form.primary_color }}
              onClick={() => {
                if (step === 1 && !form.store_name.trim()) { toast("اكتب اسم المتجر أولا", "error"); return; }
                if (step === 4 && (form.admin_username.trim().length < 3 || form.admin_password.length < 4)) { toast("بيانات المدير ناقصة", "error"); return; }
                setStep(step + 1);
              }}
            >
              التالي
            </button>
          ) : (
            <button className={btnCls} style={{ background: form.primary_color }} disabled={loading} onClick={install}>
              {loading ? "جاري التثبيت..." : <span className="inline-flex items-center gap-2">تثبيت <IconCheck /></span>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
