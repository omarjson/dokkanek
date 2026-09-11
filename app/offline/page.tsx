import Link from "next/link";
import { IconStore } from "@/components/icons";
import { btnCls, btnGhostCls, btnXsCls } from "@/components/ui";

export default function OfflinePage() {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <span className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[var(--brand)]/10 text-[var(--brand)] mb-4">
        <IconStore width={32} height={32} />
      </span>
      <h1 className="text-2xl font-extrabold mb-2">لا يوجد اتصال بالإنترنت</h1>
      <p className="text-slate-500 text-sm mb-6">
        تحقق من الشبكة ثم أعد المحاولة. فواتير نقطة البيع المحفوظة في قائمة الانتظار تُزامَن تلقائيا من صفحة البيع.
      </p>
      <div className="flex gap-2 justify-center">
        <Link href="/" className={btnCls}>
          إعادة المحاولة
        </Link>
        <Link href="/pos" className={btnGhostCls}>
          نقطة البيع
        </Link>
      </div>
    </div>
  );
}
