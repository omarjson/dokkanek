import { prisma } from "./db";

export type StoreModule = { key: string; label: string; desc: string };

// الوحدات القابلة للتفعيل/التعطيل حسب نوع المحل
export const MODULES: StoreModule[] = [
  { key: "maintenance", label: "الصيانة", desc: "استلام أجهزة وتذاكر وفنيون — لمحلات الهواتف والإلكترونيات" },
  { key: "delivery", label: "التوصيل والمناديب", desc: "مهام التوصيل والتحصيل عند التسليم" },
  { key: "suppliers", label: "الموردون والمشتريات", desc: "فواتير الشراء وديون الموردين" },
  { key: "employees", label: "الموظفون والحضور", desc: "رواتب تلقائية من الدقائق وعمولات" },
  { key: "expenses", label: "المصروفات", desc: "سجل مصروفات المحل" },
  { key: "returns", label: "الرواجع والتالف", desc: "مرتجعات الزبائن والأصناف التالفة" },
  { key: "shifts", label: "ورديات الخزينة", desc: "فتح بعهدة وإقفال بجرد فعلي" },
  { key: "reports", label: "التقارير", desc: "أرباح وهامش والأعلى مبيعا" },
  { key: "developers", label: "الربط API/MCP", desc: "مفتاح الربط الخارجي والذكاء الاصطناعي" },
  { key: "notifications", label: "التنبيهات", desc: "طابور رسائل الزبائن" },
  { key: "import", label: "الاستيراد", desc: "استيراد الأصناف من Excel" },
  { key: "stocktake", label: "الجرد المخزني", desc: "جرد فعلي وتسوية الفروقات" },
  { key: "transfers", label: "التحويل بين المخازن", desc: "سجل تحويلات موثق بمرجع" },
];

// presets حسب النشاط: القيم المذكورة فقط تُطفأ، الباقي يعمل
export const PRESETS: Record<string, { label: string; off: string[] }> = {
  general: { label: "عام — كل الوحدات", off: [] },
  phones: { label: "هواتف وإلكترونيات", off: [] },
  grocery: { label: "مواد غذائية", off: ["maintenance", "developers"] },
  clothing: { label: "ملابس", off: ["maintenance"] },
};

export async function getModuleState(): Promise<{ enabled: Record<string, boolean>; preset: string }> {
  let rows: { key: string; value: string }[] = [];
  try {
    rows = await prisma.setting.findMany();
  } catch {}
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const enabled: Record<string, boolean> = {};
  for (const m of MODULES) {
    enabled[m.key] = s[`mod_${m.key}`] !== "0";
  }
  return { enabled, preset: s.store_type || "general" };
}

export async function isModuleEnabled(key: string): Promise<boolean> {
  const { enabled } = await getModuleState();
  return enabled[key] !== false;
}
