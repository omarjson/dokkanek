"use client";
import { useCallback, useEffect, useState } from "react";
import { IconCheck, IconX } from "./icons";

type ToastItem = { id: number; message: string; tone: "success" | "error" | "info" };
type ConfirmReq = { id: number; message: string };

let toastSeq = 1;
let confirmSeq = 1;
const confirmResolvers = new Map<number, (v: boolean) => void>();

export function toast(message: string, tone?: ToastItem["tone"]) {
  const t: ToastItem["tone"] =
    tone ??
    (/تعذر|غير |خطأ|كثيرة|نفد|المتاح|مطلوب|اختر |تأكد|فشل|تعذرت/.test(message)
      ? "error"
      : /نجاح|تم |حُفظ|زُامن|مزامنة|بنحاح|بنجاح/.test(message)
        ? "success"
        : "info");
  window.dispatchEvent(new CustomEvent("dk-toast", { detail: { id: toastSeq++, message, tone: t } }));
}

export function confirmDialog(message: string): Promise<boolean> {
  const id = confirmSeq++;
  window.dispatchEvent(new CustomEvent("dk-confirm", { detail: { id, message } }));
  return new Promise((resolve) => confirmResolvers.set(id, resolve));
}

const TONE_BAR = { success: "bg-emerald-500", error: "bg-rose-500", info: "bg-[var(--brand)]" };

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [confirm, setConfirm] = useState<ConfirmReq | null>(null);

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent).detail as ToastItem;
      setItems((list) => [...list.slice(-3), detail]);
      setTimeout(() => setItems((list) => list.filter((x) => x.id !== detail.id)), 3600);
    };
    const onConfirm = (e: Event) => {
      setConfirm((e as CustomEvent).detail as ConfirmReq);
    };
    window.addEventListener("dk-toast", onToast);
    window.addEventListener("dk-confirm", onConfirm);
    return () => {
      window.removeEventListener("dk-toast", onToast);
      window.removeEventListener("dk-confirm", onConfirm);
    };
  }, []);

  const answer = useCallback(
    (v: boolean) => {
      if (!confirm) return;
      confirmResolvers.get(confirm.id)?.(v);
      confirmResolvers.delete(confirm.id);
      setConfirm(null);
    },
    [confirm]
  );

  return (
    <>
      <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:bottom-6 sm:left-6 z-50 flex flex-col gap-2 no-print" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold rounded-2xl shadow-xl ps-2 pe-4 py-2.5 animate-[dk-in_.2s_ease-out]"
          >
            <span className={`flex items-center justify-center w-7 h-7 rounded-xl ${TONE_BAR[t.tone]} shrink-0`}>
              {t.tone === "error" ? <IconX /> : <IconCheck />}
            </span>
            <span className="flex-1">{t.message}</span>
            <button onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))} className="opacity-60 hover:opacity-100" aria-label="إغلاق">
              <IconX />
            </button>
          </div>
        ))}
      </div>
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 no-print" onClick={() => answer(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-extrabold text-lg mb-1">تأكيد</h3>
            <p className="text-sm text-slate-600 mb-4">{confirm.message}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => answer(false)} className="border border-slate-300 rounded-xl px-4 py-2 text-sm font-bold hover:bg-slate-50">
                تراجع
              </button>
              <button onClick={() => answer(true)} className="bg-rose-600 text-white rounded-xl px-4 py-2 text-sm font-bold hover:brightness-110">
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes dk-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>
    </>
  );
}
