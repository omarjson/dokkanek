"use client";
import { useState } from "react";
import { inputCls, btnCls } from "@/components/ui";
import { IconStore, IconCart, IconBox, IconWrench } from "@/components/icons";

const FEATURES = [
  { icon: IconCart, text: "نقطة بيع سريعة: نقدي، بطاقة، آجل وتوصيل" },
  { icon: IconBox, text: "مخزون وباركود وتنبيهات النواقص" },
  { icon: IconWrench, text: "صيانة هواتف بتتبع QR للزبون" },
];

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) window.location.href = "/";
      else if (res.status === 429) setError("محاولات كثيرة — انتظر 5 دقائق وحاول مجددا");
      else setError("اسم المستخدم أو كلمة المرور غير صحيحة");
    } catch {
      setError("تعذر الاتصال بالخادم — تحقق من الإنترنت");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#eef1f6] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-3xl shadow-[0_24px_64px_-16px_rgba(2,6,23,0.25)] overflow-hidden border border-slate-200/70">
        {/* لوحة العلامة */}
        <div className="relative hidden md:flex flex-col justify-between bg-slate-950 text-white p-8 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.15]"
            aria-hidden
            style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          />
          <div
            className="absolute -bottom-24 -start-24 w-72 h-72 rounded-full bg-[var(--brand)] opacity-30 blur-3xl"
            aria-hidden
          />
          <div className="relative flex items-center gap-3">
            <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[var(--brand)] text-white font-display font-bold text-xl">
              د
            </span>
            <span className="font-display font-semibold text-xl">دكّانك</span>
          </div>
          <div className="relative">
            <p className="font-display font-semibold text-3xl leading-[1.9] mb-2">محلّك كله<br />في شاشة واحدة</p>
            <p className="text-sm text-slate-400 leading-7 mb-6">منظومة مبيعات ليبية مفتوحة المصدر — عربية، خفيفة، وتشتغل حتى بلا نت.</p>
            <ul className="flex flex-col gap-3">
              {FEATURES.map((f, i) => {
                const Ico = f.icon;
                return (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-200">
                    <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 shrink-0">
                      <Ico width={18} height={18} />
                    </span>
                    {f.text}
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="relative text-[11px] text-slate-500">رخصة MIT — حرّة للأبد</p>
        </div>

        {/* الفورم */}
        <div className="p-6 sm:p-10 flex flex-col justify-center">
          <div className="md:hidden flex items-center gap-2.5 mb-6">
            <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[var(--brand)] text-white font-display font-bold text-lg">د</span>
            <span className="font-display font-semibold text-xl">دكّانك</span>
          </div>
          <h1 className="font-display font-semibold text-2xl mb-1">مرحبا بعودتك</h1>
          <p className="text-sm text-slate-500 mb-6">سجل الدخول للوصول إلى منظومتك</p>
          <form onSubmit={submit}>
            <label className="block mb-3">
              <span className="block text-sm mb-1.5 font-semibold text-slate-600">اسم المستخدم</span>
              <input
                className={inputCls + " !py-3"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoFocus
                placeholder="مثال: admin"
              />
            </label>
            <label className="block mb-4">
              <span className="block text-sm mb-1.5 font-semibold text-slate-600">كلمة المرور</span>
              <input
                type="password"
                className={inputCls + " !py-3"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </label>
            {error && (
              <p className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm font-bold px-3 py-2.5 mb-4">
                {error}
              </p>
            )}
            <button className={btnCls + " w-full !py-3.5 text-base"} disabled={loading}>
              {loading ? "جاري الدخول..." : "دخول"}
            </button>
            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-center" dir="ltr">
              <p className="text-[11px] font-bold text-slate-500 mb-1">حسابات التجربة</p>
              <p className="text-xs text-slate-600 font-mono">admin / admin123 <span className="text-slate-400">• مدير</span></p>
              <p className="text-xs text-slate-600 font-mono mt-0.5">cashier / 1234 <span className="text-slate-400">• كاشير</span></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
