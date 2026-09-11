import Link from "next/link";
import { btnCls } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <div className="font-display font-semibold text-6xl text-slate-200">404</div>
      <h1 className="font-extrabold text-xl mt-2 mb-1">الصفحة غير موجودة</h1>
      <p className="text-sm text-slate-500 mb-5">الرابط غلط أو الصفحة انحذفت</p>
      <Link href="/" className={btnCls}>رجوع للرئيسية</Link>
    </div>
  );
}
