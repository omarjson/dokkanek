import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="text-5xl mb-4">📡</div>
      <h1 className="text-2xl font-extrabold mb-2">لا يوجد اتصال بالإنترنت</h1>
      <p className="text-slate-500 text-sm mb-6">
        تحقق من الشبكة ثم أعد المحاولة. فواتير نقطة البيع المحفوظة في قائمة الانتظار تُزامَن تلقائيا من صفحة البيع.
      </p>
      <div className="flex gap-2 justify-center">
        <Link href="/" className="bg-[var(--brand)] text-white font-bold rounded-xl px-5 py-2.5">
          إعادة المحاولة
        </Link>
        <Link href="/pos" className="border border-slate-300 bg-white rounded-xl px-5 py-2.5">
          نقطة البيع
        </Link>
      </div>
    </div>
  );
}
