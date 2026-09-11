import "./globals.css";
import type { CSSProperties, ReactNode } from "react";
import { IBM_Plex_Sans_Arabic, El_Messiri } from "next/font/google";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/format";
import { Sidebar, type NavLink } from "@/components/Sidebar";
import { getModuleState } from "@/lib/modules";
import { Toaster } from "@/components/toast";
import { ServiceWorker } from "@/components/ServiceWorker";

const plex = IBM_Plex_Sans_Arabic({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"] });
const messiri = El_Messiri({ subsets: ["arabic", "latin"], weight: ["500", "600", "700"], variable: "--font-display" });

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
  { href: "/pos", label: "نقطة البيع", icon: "pos", section: "العمل" },
  { href: "/sales", label: "الفواتير", icon: "sales", section: "العمل" },
  { href: "/customers", label: "الزبائن والديون", icon: "customers", section: "العمل" },
  { href: "/products", label: "الأصناف", icon: "products", section: "المخزون" },
  { href: "/stickers", label: "طباعة الستيكرات", icon: "stickers", section: "المخزون" },
  { href: "/stocktake", label: "الجرد", icon: "stocktake", section: "المخزون", mod: "stocktake" },
  { href: "/transfers", label: "التحويلات", icon: "returns", section: "المخزون", mod: "transfers" },
  { href: "/suppliers", label: "الموردون", icon: "suppliers", section: "المخزون", mod: "suppliers" },
  { href: "/expenses", label: "المصروفات", icon: "expenses", section: "المخزون", mod: "expenses" },
  { href: "/returns", label: "الرواجع والتالف", icon: "returns", section: "المخزون", mod: "returns" },
  { href: "/shifts", label: "الورديات", icon: "shifts", section: "المخزون", mod: "shifts" },
  { href: "/closing", label: "إقفال اليوم", icon: "reports", section: "المخزون" },
  { href: "/delivery", label: "التوصيل", icon: "delivery", section: "الميدان", mod: "delivery" },
  { href: "/maintenance", label: "الصيانة", icon: "maintenance", section: "الميدان", mod: "maintenance" },
  { href: "/my-work", label: "مهامي", icon: "employees", section: "الميدان", roles: ["COURIER", "TECHNICIAN"] },
  { href: "/import", label: "استيراد", icon: "import", section: "الإدارة", mod: "import", roles: ADMIN_ROLES },
  { href: "/reports", label: "التقارير", icon: "reports", section: "الإدارة", mod: "reports", roles: ADMIN_ROLES },
  { href: "/developers", label: "المطورون", icon: "developers", section: "الإدارة", mod: "developers", roles: ADMIN_ROLES },
  { href: "/employees", label: "الموظفون", icon: "employees", section: "الإدارة", mod: "employees", roles: ADMIN_ROLES },
  { href: "/branches", label: "الفروع", icon: "store", section: "الإدارة", roles: ADMIN_ROLES },
  { href: "/users", label: "المستخدمون", icon: "customers", section: "الإدارة", roles: ADMIN_ROLES },
  { href: "/notifications", label: "التنبيهات", icon: "notifications", section: "الإدارة", mod: "notifications", roles: ADMIN_ROLES },
  { href: "/audit", label: "سجل الأمن", icon: "audit", section: "الإدارة", roles: ADMIN_ROLES },
  { href: "/settings", label: "الإعدادات", icon: "settings", section: "الإدارة", roles: ADMIN_ROLES },
];

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const user = await currentUser().catch(() => null);
  const { enabled } = await getModuleState();
  const storeName = settings.store_name || "دكّانك";
  const color = settings.primary_color || "#0d6efd";
  const links = LINKS.filter((l) => !l.mod || enabled[l.mod]);

  return (
    <html lang="ar" dir="ltr">
      <body dir="rtl" className={`${plex.className} ${messiri.variable}`} style={{ "--brand": color } as CSSProperties}>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=El+Messiri:wght@500;600;700&display=swap"
        />
        <ServiceWorker />
        <Toaster />
        {user ? (
          <div className="min-h-screen md:flex md:items-stretch">
            <Sidebar links={links} user={{ name: user.name, role: user.role }} storeName={storeName} />
            <div className="flex-1 min-w-0 flex flex-col">
              <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-6">{children}</main>
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
