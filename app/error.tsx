"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="py-16 text-center">
      <h1 className="font-extrabold text-xl mb-1">حدث خطأ غير متوقع</h1>
      <p className="text-sm text-slate-500 mb-5">جرب تحديث الصفحة، ولو تكرر تواصل مع الإدارة</p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center justify-center gap-1.5 bg-[var(--brand)] text-white font-bold rounded-xl px-5 py-2.5"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
