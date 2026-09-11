"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnXsCls } from "@/components/ui";
import { confirmDialog, toast } from "@/components/toast";

export function SaleActions({ id, no, status }: { id: string; no: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (status === "CANCELLED") return <span className="text-xs text-slate-400">—</span>;

  async function voidSale() {
    if (!(await confirmDialog(`إلغاء الفاتورة ${no}؟ سترجع الكميات للمخزون.`))) return;
    setBusy(true);
    const res = await fetch(`/api/sales/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "void" }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      toast("تم إلغاء الفاتورة ورجعت الكميات", "success");
      router.refresh();
    } else toast(j.error || "تعذر الإلغاء", "error");
  }

  return (
    <button className={btnXsCls + " !text-rose-600"} disabled={busy} onClick={voidSale}>
      {busy ? "جاري..." : "إلغاء"}
    </button>
  );
}
