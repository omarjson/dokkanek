import { prisma } from "./db";

export type Perm = { key: string; label: string; desc: string };

// صلاحيات دقيقة تُمنح حسب الدور، ويقدر المالك يعدلها من صفحة الصلاحيات
export const PERMISSIONS: Perm[] = [
  { key: "cost.view", label: "رؤية التكلفة", desc: "أسعار التكلفة وهوامش الربح التفصيلية" },
  { key: "price.edit", label: "تعديل الأسعار والأصناف", desc: "إضافة وتعديل الأصناف وأسعار البيع" },
  { key: "price.usd", label: "التكلفة بالدولار", desc: "رؤية وتعديل التكلفة الدولارية" },
  { key: "products.delete", label: "حذف الأصناف", desc: "" },
  { key: "sales.discount", label: "الخصومات", desc: "خصم في نقطة البيع" },
  { key: "sales.void", label: "إلغاء الفواتير", desc: "" },
  { key: "purchases.manage", label: "المشتريات والموردون", desc: "فواتير الشراء وإضافة الموردين والسداد" },
  { key: "expenses.view", label: "المصروفات", desc: "عرض وتسجيل المصروفات (إيجارات وغيرها)" },
  { key: "reports.profit", label: "الأرباح والتقارير", desc: "" },
  { key: "hr.view", label: "الموظفون والرواتب", desc: "كشوف الرواتب والحضور" },
  { key: "hr.advance", label: "السلف", desc: "منح وتسوية سلف الموظفين" },
  { key: "stocktake.adjust", label: "تسوية الجرد", desc: "إقفال الجرد وتعديل المخزون" },
  { key: "users.manage", label: "المستخدمون", desc: "الحسابات والأدوار" },
  { key: "settings.edit", label: "الإعدادات", desc: "الهوية والوحدات والصلاحيات" },
];

// الافتراضي حسب الدور — المالك يقدر يعدل أي دور من صفحة الصلاحيات
export const ROLES_LIST = ["MANAGER", "CASHIER", "COURIER", "TECHNICIAN"];
export const ROLE_DEFAULTS: Record<string, string[]> = {
  ADMIN: ["*"],
  MANAGER: ["price.edit", "sales.discount", "purchases.manage", "expenses.view", "reports.profit", "stocktake.adjust"],
  CASHIER: [],
  COURIER: [],
  TECHNICIAN: [],
};

export async function getRolePerms(role: string): Promise<Set<string>> {
  const rows = await prisma.setting.findMany().catch(() => [] as { key: string; value: string }[]);
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const set = new Set<string>();
  if ((ROLE_DEFAULTS[role] || []).includes("*")) {
    PERMISSIONS.forEach((p) => set.add(p.key));
    return set;
  }
  for (const k of ROLE_DEFAULTS[role] || []) set.add(k);
  for (const p of PERMISSIONS) {
    const v = s[`perm_${role}_${p.key}`];
    if (v === "1") set.add(p.key);
    else if (v === "0") set.delete(p.key);
  }
  return set;
}

export async function hasPerm(role: string | undefined | null, key: string): Promise<boolean> {
  if (!role) return false;
  return (await getRolePerms(role)).has(key);
}
