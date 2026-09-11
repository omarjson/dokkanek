"use client";
import { useState } from "react";
import { inputCls, btnCls } from "@/components/ui";
import { IconStore } from "@/components/icons";

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
      else if (res.status === 429) setError("محاولات كثيرة — انتظر 5 دقائق");
      else setError("بيانات الدخول غير صحيحة");
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[var(--brand)]/30 blur-3xl" aria-hidden />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[var(--brand)]/20 blur-3xl" aria-hidden />
      <form onSubmit={submit} className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-5">
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--brand)] text-white mb-3">
            <IconStore width={28} height={28} />
          </span>
          <h1 className="text-2xl font-extrabold">دكّانك</h1>
          <p className="text-sm text-slate-500 mt-0.5">منظومة المبيعات — تسجيل الدخول</p>
        </div>
        <label className="block mb-3">
          <span className="block text-sm mb-1 font-semibold text-slate-600">اسم المستخدم</span>
          <input
            className={inputCls}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            autoFocus
          />
        </label>
        <label className="block mb-4">
          <span className="block text-sm mb-1 font-semibold text-slate-600">كلمة المرور</span>
          <input
            type="password"
            className={inputCls}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error && (
          <p className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm font-bold px-3 py-2 mb-3">
            {error}
          </p>
        )}
        <button className={`${btnCls} w-full !py-3 text-base`} disabled={loading}>
          {loading ? "جاري الدخول..." : "دخول"}
        </button>
        <p className="text-[11px] text-slate-400 mt-4 text-center">تجريبي: admin / admin123 — cashier / 1234</p>
      </form>
    </div>
  );
}
