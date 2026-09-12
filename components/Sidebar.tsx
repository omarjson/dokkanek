"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { IconMenu, IconX, IconLogout, IconCollapse } from "./icons";
import {
  IconDashboard, IconCart, IconBox, IconReceipt, IconUsers, IconTruck,
  IconWallet, IconDelivery, IconWrench, IconReturns, IconClock, IconUpload,
  IconChart, IconCode, IconId, IconShield, IconGear, IconBell, IconStore, IconClipboard, IconTag,
} from "./icons";
import { ROLES } from "@/lib/format";

const ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  dashboard: IconDashboard, pos: IconCart, products: IconBox, sales: IconReceipt,
  customers: IconUsers, suppliers: IconTruck, expenses: IconWallet, delivery: IconDelivery,
  maintenance: IconWrench, returns: IconReturns, shifts: IconClock, import: IconUpload,
  reports: IconChart, developers: IconCode, employees: IconId, notifications: IconBell,
  audit: IconShield, settings: IconGear, store: IconStore, stocktake: IconClipboard, stickers: IconTag,
};

const SECTIONS = ["العمل", "المخزون", "الميدان", "الإدارة"];

export type NavLink = { href: string; label: string; icon: string; section?: string; mod?: string; perm?: string; roles?: string[] };

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
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const [perms, setPerms] = useState<string[]>([]);
  const visible = links.filter((l) => {
    if (l.roles && !l.roles.includes(user.role)) return false;
    if (l.perm && !perms.includes(l.perm) && !perms.includes("*")) return false;
    return true;
  });

  useEffect(() => {
    fetch("/api/my-perms")
      .then((r) => (r.ok ? r.json() : { perms: [] }))
      .then((j) => setPerms(j.perms || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem("dk_nav_collapsed") === "1") setCollapsed(true);
    } catch {}
  }, []);

  function toggleCollapse() {
    setCollapsed((c) => {
      try {
        localStorage.setItem("dk_nav_collapsed", c ? "0" : "1");
      } catch {}
      return !c;
    });
  }

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" }).catch(() => {});
    window.location.href = "/login";
  }

  function isActive(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  }

  function linkRow(l: NavLink, mini: boolean) {
    const active = isActive(l.href);
    const Ico = ICONS[l.icon] ?? IconStore;
    return (
      <Link
        key={l.href}
        href={l.href}
        onClick={() => setOpen(false)}
        title={mini ? l.label : undefined}
        className={`flex items-center gap-2.5 rounded-lg text-[13px] font-semibold transition relative ${
          mini ? "justify-center px-0 py-2.5" : "px-3 py-2"
        } ${
          active ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
        }`}
      >
        {active && !mini && (
          <span className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-[var(--brand)]" aria-hidden />
        )}
        <span className={`shrink-0 ${active ? "text-[var(--brand)]" : ""}`}>
          <Ico width={19} height={19} />
        </span>
        {!mini && <span className="truncate">{l.label}</span>}
      </Link>
    );
  }

  function navBody(mini: boolean) {
    const home = visible.filter((l) => !l.section);
    return (
      <div className="flex flex-col h-full">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className={`flex items-center gap-2.5 px-4 pt-4 pb-3 ${mini ? "justify-center px-0" : ""}`}
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand)] to-slate-900 text-white shrink-0 font-display font-bold text-lg">
            {storeName.trim().charAt(0) || "د"}
          </span>
          {!mini && <span className="font-display font-semibold text-[17px] leading-tight truncate">{storeName}</span>}
        </Link>
        {/* الغلاف ltr ليظهر شريط التمرير يمينا، والمحتوى rtl */}
        <nav dir="ltr" className="nice-dark flex-1 overflow-y-auto px-2.5 pb-3">
          <div dir="rtl" className="flex flex-col gap-0.5">
          {home.map((l) => linkRow(l, mini))}
          {SECTIONS.map((sec) => {
            const items = visible.filter((l) => l.section === sec);
            if (items.length === 0) return null;
            return (
              <div key={sec} className="mt-3 first:mt-1">
                {!mini && (
                  <div className="px-3 mb-1 text-[11px] font-bold tracking-wide text-slate-500">{sec}</div>
                )}
                <div className="flex flex-col gap-0.5">{items.map((l) => linkRow(l, mini))}</div>
              </div>
            );
          })}
          </div>
        </nav>
        <div className="p-2.5 border-t border-white/10">
          {!mini ? (
            <>
              <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-xs font-extrabold shrink-0">
                  {user.name.trim().charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold truncate">{user.name}</span>
                  <span className="block text-[11px] text-slate-500">{ROLES[user.role] ?? user.role}</span>
                </span>
              </div>
              <div className="flex gap-1 mt-1">
                <button
                  onClick={logout}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-[13px] font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition"
                >
                  <IconLogout width={17} height={17} />
                  خروج
                </button>
                <button
                  onClick={toggleCollapse}
                  title="طي القائمة"
                  aria-label="طي القائمة"
                  className="hidden md:flex items-center justify-center rounded-lg px-2 py-2 text-slate-400 hover:bg-white/5 hover:text-white transition"
                >
                  <IconCollapse width={17} height={17} />
                </button>
              </div>
            </>
          ) : (
            <div className="hidden md:flex flex-col gap-1 items-center">
              <span
                title={`${user.name} — ${ROLES[user.role] ?? user.role}`}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-xs font-extrabold"
              >
                {user.name.trim().charAt(0)}
              </span>
              <button onClick={toggleCollapse} title="توسيع القائمة" aria-label="توسيع القائمة" className="p-2 text-slate-400 hover:text-white transition">
                <IconCollapse width={17} height={17} />
              </button>
              <button onClick={logout} title="تسجيل الخروج" aria-label="تسجيل الخروج" className="p-2 text-slate-400 hover:text-white transition">
                <IconLogout width={17} height={17} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* علوي للموبايل */}
      <div className="md:hidden sticky top-0 z-30 flex items-center gap-2 bg-slate-950 text-white px-4 py-2.5 no-print">
        <button onClick={() => setOpen(true)} aria-label="القائمة" className="p-2.5 -m-1 min-w-[40px] min-h-[40px]">
          <IconMenu />
        </button>
        <span className="font-display font-semibold">{storeName}</span>
      </div>
      {/* جانبي لسطح المكتب */}
      <aside
        className={`hidden md:flex shrink-0 bg-slate-950 text-white sticky top-0 h-screen no-print transition-all duration-200 overflow-hidden border-e border-white/5 ${
          collapsed ? "w-16" : "w-48"
        }`}
      >
        {navBody(collapsed)}
      </aside>
      {/* درج الموبايل */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden no-print">
          <div className="absolute inset-0 bg-slate-950/60" onClick={() => setOpen(false)} />
          <aside className="absolute top-0 bottom-0 start-0 w-72 max-w-[85vw] bg-slate-950 text-white shadow-2xl">
            <button onClick={() => setOpen(false)} aria-label="إغلاق" className="absolute top-4 start-4 text-slate-400 p-2.5 min-w-[40px] min-h-[40px]">
              <IconX />
            </button>
            {navBody(false)}
          </aside>
        </div>
      )}
    </>
  );
}
