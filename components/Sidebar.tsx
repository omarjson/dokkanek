"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { IconMenu, IconX, IconLogout } from "./icons";
import {
  IconDashboard, IconCart, IconBox, IconReceipt, IconUsers, IconTruck,
  IconWallet, IconDelivery, IconWrench, IconReturns, IconClock, IconUpload,
  IconChart, IconCode, IconId, IconShield, IconGear, IconBell, IconStore,
} from "./icons";
import { ROLES } from "@/lib/format";

const ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  dashboard: IconDashboard, pos: IconCart, products: IconBox, sales: IconReceipt,
  customers: IconUsers, suppliers: IconTruck, expenses: IconWallet, delivery: IconDelivery,
  maintenance: IconWrench, returns: IconReturns, shifts: IconClock, import: IconUpload,
  reports: IconChart, developers: IconCode, employees: IconId, notifications: IconBell,
  audit: IconShield, settings: IconGear, store: IconStore,
};

export type NavLink = { href: string; label: string; icon: string; roles?: string[] };

export function Sidebar({
  links,
  user,
  storeName,
}: {
  links: NavLink[];
  user: { name: string; role: string };
  storeName: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const visible = links.filter((l) => !l.roles || l.roles.includes(user.role));

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" }).catch(() => {});
    window.location.href = "/login";
  }

  const nav = (
    <div className="flex flex-col h-full">
      <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[var(--brand)] text-white shrink-0">
          <IconStore />
        </span>
        <span className="font-display font-bold text-lg leading-tight">{storeName}</span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-0.5">
        {visible.map((l) => {
          const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href + "/"));
          const Ico = ICONS[l.icon] ?? IconStore;
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                active
                  ? "bg-[var(--brand)]/15 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className={active ? "text-white" : "text-slate-400"}>
                <Ico />
              </span>
              {l.label}
              {active && <span className="ms-auto w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        <div className="rounded-xl bg-white/5 px-3 py-2.5 mb-2">
          <div className="text-sm font-bold truncate">{user.name}</div>
          <div className="text-xs text-slate-400">{ROLES[user.role] ?? user.role}</div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white transition"
        >
          <IconLogout />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* علوي للموبايل */}
      <div className="md:hidden sticky top-0 z-30 flex items-center gap-2 bg-slate-950 text-white px-4 py-3 no-print">
        <button onClick={() => setOpen(true)} aria-label="القائمة" className="p-2.5 -m-1 min-w-[40px] min-h-[40px]">
          <IconMenu />
        </button>
        <span className="font-extrabold">{storeName}</span>
      </div>
      {/* جانبي لسطح المكتب */}
      <aside className="hidden md:flex w-64 shrink-0 bg-slate-950 text-white sticky top-0 h-screen no-print">
        {nav}
      </aside>
      {/* درج الموبايل */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden no-print">
          <div className="absolute inset-0 bg-slate-950/60" onClick={() => setOpen(false)} />
          <aside className="absolute top-0 bottom-0 start-0 w-72 max-w-[85vw] bg-slate-950 text-white shadow-2xl">
            <button onClick={() => setOpen(false)} aria-label="إغلاق" className="absolute top-4 start-4 text-slate-400 p-2.5 min-w-[40px] min-h-[40px]">
              <IconX />
            </button>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
