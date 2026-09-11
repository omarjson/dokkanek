"use client";
import { useState } from "react";
import { inputCls, btnCls } from "@/components/ui";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) window.location.href = "/";
    else setError("بيانات الدخول غير صحيحة");
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-xl shadow border p-6 w-full max-w-sm">
      <h1 className="text-2xl font-bold mb-1 text-center">دكّانك</h1>
      <p className="text-sm text-gray-500 mb-4 text-center">تسجيل الدخول</p>
      <label className="block mb-2">
        <span className="block text-sm mb-1">اسم المستخدم</span>
        <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} required />
      </label>
      <label className="block mb-4">
        <span className="block text-sm mb-1">كلمة المرور</span>
        <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <button className={`${btnCls} w-full`} disabled={loading}>
        {loading ? "جاري الدخول..." : "دخول"}
      </button>
      <p className="text-xs text-gray-400 mt-4 text-center">تجريبي: admin / admin123 — cashier / 1234</p>
    </form>
  );
}
