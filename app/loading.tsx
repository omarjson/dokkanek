export default function Loading() {
  return (
    <div className="py-10 flex flex-col items-center gap-3" aria-busy="true">
      <div className="w-10 h-10 rounded-2xl bg-[var(--brand)]/10 animate-pulse" />
      <div className="w-48 h-4 rounded-full bg-slate-200 animate-pulse" />
      <div className="w-64 h-24 rounded-2xl bg-slate-100 animate-pulse" />
      <p className="text-sm text-slate-400">جاري التحميل...</p>
    </div>
  );
}
