"use client";
import { toast } from "@/components/toast";
import { useState } from "react";
import { inputCls, btnCls, btnGhostCls, Card, Field, Badge } from "@/components/ui";

// يقبل الترويسات الإنجليزية أو العربية
const ALIASES: Record<string, string> = {
  sku: "sku", "الرمز": "sku", "رمز": "sku",
  name: "name", "الاسم": "name", "اسم الصنف": "name", "الصنف": "name",
  salePrice: "salePrice", "سعر البيع": "salePrice", "السعر": "salePrice",
  costPrice: "costPrice", "سعر التكلفة": "costPrice", "التكلفة": "costPrice",
  quantity: "quantity", "الكمية": "quantity",
  barcode: "barcode", "الباركود": "barcode",
  minQuantity: "minQuantity", "حد التنبيه": "minQuantity", "الحد": "minQuantity",
  category: "category", "التصنيف": "category", "الفئة": "category",
  legacyNo: "legacyNo", "الرقم القديم": "legacyNo",
};

function parseCSV(text: string): Record<string, string>[] {
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = clean.split("\n").filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];
  const split = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if ((ch === "," || ch === ";" || ch === "\t") && !inQ) {
        out.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };
  const header = split(lines[0]).map((h) => ALIASES[h.trim()] || "");
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = split(lines[i]);
    const row: Record<string, string> = {};
    header.forEach((key, j) => {
      if (key) row[key] = (cells[j] || "").trim();
    });
    if (Object.values(row).some((v) => v !== "")) rows.push(row);
  }
  return rows;
}

export function ImportClient() {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; errors: { line: number; error: string }[] } | null>(null);

  async function onFile(f: File | undefined) {
    if (!f) return;
    const text = await f.text();
    setRows(parseCSV(text));
    setResult(null);
  }

  async function send() {
    if (rows.length === 0) return;
    setLoading(true);
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setResult(j);
      setRows([]);
    } else toast(j.error || "تعذر الاستيراد");
  }

  return (
    <div>
      <Card>
        <p className="text-sm text-slate-600 mb-2">
          من Excel: احفظ الملف بصيغة <b>CSV UTF-8</b> ثم ارفعه هنا. الأعمدة المقبولة (عربي أو إنجليزي):
          الاسم/سعر البيع (إجباري) + الرمز/التكلفة/الكمية/الباركود/حد التنبيه/التصنيف/الرقم القديم.
          الموجود بنفس الرمز يُحدَّث، والجديد يُنشأ.
        </p>
        <div className="flex flex-wrap gap-2 items-end">
          <Field label="ملف CSV">
          <input type="file" accept=".csv,.txt" className={inputCls + " !w-auto"} onChange={(e) => onFile(e.target.files?.[0])} />
          </Field>
          <a href="/api/import" className={btnGhostCls + " text-sm"}>تحميل القالب</a>
          {rows.length > 0 && (
            <button className={btnCls} disabled={loading} onClick={send}>
              {loading ? "جاري الاستيراد..." : `استيراد ${rows.length} سطر`}
            </button>
          )}
        </div>
      </Card>
      {rows.length > 0 && (
        <Card>
          <h2 className="font-extrabold text-[15px] mb-2">معاينة (أول 10 أسطر من {rows.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="p-1 text-start">الاسم</th>
                  <th className="p-1">البيع</th>
                  <th className="p-1">الكمية</th>
                  <th className="p-1 text-start">الرمز</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-1">{r.name || <span className="text-red-500">ناقص!</span>}</td>
                    <td className="p-1 text-center">{r.salePrice || <span className="text-red-500">ناقص!</span>}</td>
                    <td className="p-1 text-center">{r.quantity || "0"}</td>
                    <td className="p-1">{r.sku || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {result && (
        <Card>
          <p className="font-bold text-green-700">تم: جديد {result.created} • محدّث {result.updated} • أخطاء {result.errors.length}</p>
          {result.errors.length > 0 && (
          <div className="max-h-40 overflow-auto mt-2 flex flex-col gap-1">
          {result.errors.slice(0, 50).map((e, i) => (
            <p key={i} className="text-sm"><Badge tone="red">سطر {e.line}</Badge> <span className="text-rose-700">{e.error}</span></p>
          ))}
          </div>
          )}
        </Card>
      )}
    </div>
  );
}
