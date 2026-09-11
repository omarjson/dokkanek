export function lyd(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return `${v.toFixed(2)} د.ل`;
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const x = typeof d === "string" ? new Date(d) : d;
  try {
    return x.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(x);
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
