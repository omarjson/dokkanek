"use client";

export function PrintButton({ label = "طباعة" }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className="border rounded-lg px-4 py-2 hover:bg-gray-50">
      {label}
    </button>
  );
}
