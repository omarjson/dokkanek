import "./globals.css";
import type { CSSProperties, ReactNode } from "react";
import { Cairo } from "next/font/google";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/format";
import { Sidebar, type NavLink } from "@/components/Sidebar";
import { Toaster } from "@/components/toast";
import { ServiceWorker } from "@/components/ServiceWorker";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "600", "700", "800"] });

export const viewport = { themeColor: "#020617" };

async function getSettings(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.setting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

const LINKS: NavLink[] = [
  { href: "/", label: "الرئيسية", icon: "dashboard" },
  { href: "/pos", label: "نقطة البيع", icon: "pos" },
  { href: "/products", label: "الأصناف", icon: "products" },
  { href: "/sales", label: "الفواتير", icon: "sales" },
  { href: "/customers", label: "الزبائن والديون", icon: "customers" },
  { href: "/suppliers", label: "الموردون", icon: "suppliers" },
  { href: "/expenses", label: "المصروفات", icon: "expenses" },
  { href: "/delivery", label: "التوصيل", icon: "delivery" },
  { href: "/maintenance", label: "الصيانة", icon: "maintenance" },
  { href: "/returns", label: "الرواجع والتالف", icon: "returns" },
  { href: "/shifts", label: "الورديات", icon: "shifts" },
  { href: "/import", label: "استيراد", icon: "import", roles: ADMIN_ROLES },
  { href: "/reports", label: "التقارير", icon: "reports", roles: ADMIN_ROLES },
  { href: "/developers", label: "المطورون", icon: "developers", roles: ADMIN_ROLES },
  { href: "/employees", label: "الموظفون", icon: "employees", roles: ADMIN_ROLES },
  { href: "/notifications", label: "التنبيهات", icon: "notifications", roles: ADMIN_ROLES },
  { href: "/audit", label: "سجل الأمن", icon: "audit", roles: ADMIN_ROLES },
  { href: "/settings", label: "الإعدادات", icon: "settings", roles: ADMIN_ROLES },
];

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const user = await currentUser().catch(() => null);
  const storeName = settings.store_name || "دكّانك";
  const color = settings.primary_color || "#0d6efd";

  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className} style={{ "--brand": color } as CSSProperties}>
        <ServiceWorker />
        <Toaster />
        {user ? (
          <div className="min-h-screen md:flex md:items-stretch">
            <Sidebar links={LINKS} user={{ name: user.name, role: user.role }} storeName={storeName} />
            <div className="flex-1 min-w-0 flex flex-col">
              <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-5 py-4 sm:py-6">{children}</main>
              <footer className="text-center text-xs text-slate-400 pb-5 no-print">
                {storeName} — منظومة مفتوحة المصدر (MIT)
              </footer>
            </div>
          </div>
        ) : (
          <main>{children}</main>
        )}
      </body>
    </html>
  );
}
