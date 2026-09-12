"use client";
import { useState } from "react";
import { btnCls, Card, SectionTitle } from "@/components/ui";
import { IconShield } from "@/components/icons";
import { PERMISSIONS } from "@/lib/permissions";
import { ROLES } from "@/lib/format";
import { toast } from "@/components/toast";

// مصفوفة الصلاحيات: لكل دور، لكل صلاحية — تُحفظ في الإعدادات (perm_<role>_<key>)
export function PermissionsClient({ initial }: { initial: Record<string, Record<string, boolean>> }) {
  const [grid, setGrid] = useState(initial);
  const [loading, setLoading] = useState(false);
  const roles = Object.keys(ROLES).filter((r) => r !== "ADMIN");

  function toggle(role: string, key: string) {
    setGrid((g) => ({ ...g, [role]: { ...g[role], [key]: !g[role]?.[key] } }));
  }

  async function save() {
    setLoading(true);
    const body: Record<string, string> = {};
    for (const role of roles) {
      for (const p of PERMISSIONS) {
        body[`perm_${role}_${p.key}`] = grid[role]?.[p.key] ? "1" : "0";
      }
    }
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) toast("تم حفظ الصلاحيات", "success");
    else toast("تعذر الحفظ", "error");
  }

  return (
    <div>
      <Card>
        <SectionTitle icon={IconShield} title="صلاحيات الأدوار" />
        <p className="text-sm text-slate-500 mb-3 leading-6">
          المدير العام (ADMIN) يملك كل شي دائما ولا يمكن سحبه. عدّل باقي الأدوار — التغيير يطبق فورا على القوائم والصفحات والعمليات.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[13px]">
                <th className="p-2 text-start">الصلاحية</th>
                {roles.map((r) => (
                  <th key={r} className="p-2 text-center">{ROLES[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p) => (
                <tr key={p.key} className="border-t border-slate-100">
                  <td className="p-2">
                    <b className="text-[13px]">{p.label}</b>
                    {p.desc && <span className="block text-[11px] text-slate-400 font-normal">{p.desc}</span>}
                    <code className="text-[10px] text-slate-400" dir="ltr">{p.key}</code>
                  </td>
                  {roles.map((r) => (
                    <td key={r} className="p-2 text-center">
                      <input
                        type="checkbox"
                        className="w-6 h-6 accent-[var(--brand)]"
                        checked={!!grid[r]?.[p.key]}
                        onChange={() => toggle(r, p.key)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className={btnCls + " mt-3"} disabled={loading} onClick={save}>
          {loading ? "جاري الحفظ..." : "حفظ الصلاحيات"}
        </button>
      </Card>
    </div>
  );
}
