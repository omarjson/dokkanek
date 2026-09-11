"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnCls, Card, SectionTitle } from "@/components/ui";
import { IconBox } from "@/components/icons";
import { MODULES, PRESETS } from "@/lib/modules";
import { toast } from "@/components/toast";

export function ModulesForm({ initial, preset }: { initial: Record<string, boolean>; preset: string }) {
  const router = useRouter();
  const [mods, setMods] = useState<Record<string, boolean>>(initial);
  const [loading, setLoading] = useState(false);

  function applyPreset(key: string) {
    const off = new Set(PRESETS[key]?.off || []);
    const next: Record<string, boolean> = {};
    for (const m of MODULES) next[m.key] = !off.has(m.key);
    setMods(next);
    save(next, key, true);
  }

  async function save(next: Record<string, boolean>, presetKey?: string, silent = false) {
    setLoading(true);
    const body: Record<string, string> = {};
    for (const m of MODULES) body[`mod_${m.key}`] = next[m.key] ? "1" : "0";
    if (presetKey) body.store_type = presetKey;
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) {
      if (!silent) toast("تم حفظ الوحدات — القائمة تحدثت", "success");
      router.refresh();
      setTimeout(() => window.location.reload(), silent ? 400 : 900);
    } else toast("تعذر الحفظ", "error");
  }

  return (
    <Card>
      <SectionTitle icon={IconBox} title="وحدات المنظومة حسب نشاطك" />
      <p className="text-sm text-slate-500 mb-3 leading-6">
        اختر نوع محلك فيتضبط كل شي تلقائيا — أو فعّل وعطّل الوحدات يدويا. المعطلة تختفي من القائمة والصفحات.
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(PRESETS).map(([key, p]) => (
          <button
            key={key}
            disabled={loading}
            onClick={() => applyPreset(key)}
            className={
              preset === key
                ? "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-bold bg-slate-950 text-white transition"
                : "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-bold border border-slate-300 bg-white transition hover:border-[var(--brand)]"
            }
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {MODULES.map((m) => (
          <label
            key={m.key}
            className={`flex items-start gap-3 rounded-2xl border p-3 cursor-pointer transition ${
              mods[m.key] ? "border-[var(--brand)] bg-[var(--brand)]/[0.04]" : "border-slate-200 opacity-70"
            }`}
          >
            <input
              type="checkbox"
              className="w-6 h-6 mt-0.5 accent-[var(--brand)] shrink-0"
              checked={!!mods[m.key]}
              onChange={(e) => setMods({ ...mods, [m.key]: e.target.checked })}
            />
            <span>
              <span className="block font-bold text-sm">{m.label}</span>
              <span className="block text-xs text-slate-500 leading-5">{m.desc}</span>
            </span>
          </label>
        ))}
      </div>
      <button className={btnCls + " mt-3"} disabled={loading} onClick={() => save(mods)}>
        {loading ? "جاري الحفظ..." : "حفظ الوحدات"}
      </button>
    </Card>
  );
}
