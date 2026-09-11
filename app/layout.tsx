import "./globals.css";
import type { CSSProperties, ReactNode } from "react";
import { Cairo } from "next/font/google";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { LogoutButton } from "@/components/LogoutButton";
import { currentUser, ROLES, ADMIN_ROLES } from "@/lib/auth";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "600", "700", "800"] });

async function getSettings(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.setting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

const LINKS: { href: string; label: string; roles?: string[] }[] = [
  { href: "/", label: "الرئيسية" },
  { href: "/pos", label: "نقطة البيع" },
  { href: "/products", label: "الأصناف" },
  { href: "/sales", label: "الفواتير" },
  { href: "/customers", label: "الزبائن والديون" },
  { href: "/suppliers", label: "الموردون" },
  { href: "/expenses", label: "المصروفات" },
  { href: "/delivery", label: "التوصيل" },
  { href: "/maintenance", label: "الصيانة" },
  { href: "/returns", label: "الرواجع والتالف" },
  { href: "/shifts", label: "الورديات" },
  { href: "/import", label: "استيراد", roles: ADMIN_ROLES },
  { href: "/employees", label: "الموظفون", roles: ADMIN_ROLES },
  { href: "/audit", label: "سجل الأمن", roles: ADMIN_ROLES },
  { href: "/settings", label: "الإعدادات", roles: ADMIN_ROLES },
];

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const user = await currentUser().catch(() => null);
  const storeName = settings.store_name || "دكّانك";
  const color = settings.primary_color || "#0d6efd";

  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className} style={{ "--brand": color } as CSSProperties}>
        <header className="bg-gradient-to-l from-[var(--brand)] to-black/40 text-white shadow-lg sticky top-0 z-20 no-print">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <Link href="/" className="font-extrabold text-xl tracking-tight flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 text-lg">🏪</span>
              {storeName}
            </Link>
            {user && (
              <div className="text-sm flex items-center gap-3">
                <span className="hidden sm:inline bg-white/15 rounded-full px-3 py-1">
                  {user.name} ({ROLES[user.role] ?? user.role})
                </span>
                <LogoutButton />
              </div>
            )}
          </div>
          {user && (
            <nav className="bg-black/25 backdrop-blur">
              <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap gap-1.5 text-sm">
                {LINKS.filter((l) => !l.roles || (user && l.roles.includes(user.role))).map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-full px-3 py-1.5 bg-white/10 hover:bg-white/25 transition font-semibold"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        <footer className="text-center text-xs text-gray-500 pb-6 no-print">
          {storeName} — منظومة مفتوحة المصدر (MIT)
        </footer>
      </body>
    </html>
  );
}
