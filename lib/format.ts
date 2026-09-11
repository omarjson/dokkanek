export const ROLES: Record<string, string> = {
  ADMIN: "مدير النظام",
  MANAGER: "مدير فرع",
  CASHIER: "كاشير",
  COURIER: "مندوب توصيل",
  TECHNICIAN: "فني صيانة",
};

// الأدوار الإدارية — ثابت عميل-آمن (لا يستورد next/headers)
export const ADMIN_ROLES = ["ADMIN", "MANAGER"];

export function lyd(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return `${v.toFixed(2)} د.ل`;
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const x = typeof d === "string" ? new Date(d) : d;
  try {
    // عربية ليبية بأرقام لاتينية (المغرب العربي) — ثابت في كل المنظومة
    return x.toLocaleString("ar-LY-u-nu-latn-ca-gregory", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    try {
      return x.toLocaleString("ar-u-nu-latn", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return String(x);
    }
  }
}

export const SALE_STATUS: Record<string, string> = {
  COMPLETED: "مكتملة",
  PENDING: "انتظار",
  HELD: "معلقة",
  COURIER: "بحوزة مندوب",
  RETURNED: "مرتجعة",
};

export const PAY_METHODS: Record<string, string> = {
  CASH: "نقدي",
  CARD: "بطاقة",
  TRANSFER: "تحويل",
  CREDIT: "آجل",
};

export const TICKET_STATUS: Record<string, string> = {
  RECEIVED: "مستلم",
  DIAGNOSIS: "قيد الفحص",
  WAITING_PARTS: "بانتظار قطعة",
  READY: "جاهز",
  DELIVERED: "تم التسليم",
};

export const TASK_STATUS: Record<string, string> = {
  PENDING: "بانتظار المندوب",
  WITH_COURIER: "بحوزة المندوب",
  DELIVERED: "تم التسليم",
  FAILED: "تعذر التسليم",
};
