"use client";
import { useState } from "react";
import { inputCls, btnCls, Card, Field } from "@/components/ui";
import { confirmDialog, toast } from "@/components/toast";

export function DevelopersClient({ initialKey }: { initialKey: string }) {
  const [key, setKey] = useState(initialKey);
  const [loading, setLoading] = useState(false);

  async function regen() {
    if (!(await confirmDialog("توليد مفتاح جديد يبطل المفتاح القديم فورا — متابعة؟"))) return;
    setLoading(true);
    const res = await fetch("/api/v1/key", { method: "POST" });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) setKey(j.key);
    else toast("تعذر التوليد");
  }

  return (
    <div>
      <Card>
        <h2 className="font-bold mb-2">مفتاح الـ API</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <Field label="المفتاح الحالي (انسخه واحفظه)">
            <input className={inputCls + " font-mono w-full sm:!w-80 max-w-full"} readOnly value={key || "لا يوجد — ولّد واحدا"} dir="ltr" />
          </Field>
          <button className={btnCls} disabled={loading} onClick={regen}>
            {loading ? "جاري التوليد..." : "توليد مفتاح جديد"}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">يُرسل في كل طلب عبر الترويسة <code dir="ltr">x-api-key</code>. لا تشاركه علنا.</p>
      </Card>
      <Card>
        <h2 className="font-bold mb-2">أمثلة</h2>
        <pre className="bg-slate-900 text-green-200 text-xs rounded-xl p-3 overflow-x-auto" dir="ltr">
{`# الأصناف
curl -H "x-api-key: KEY" /api/v1/products?q=

# فاتورة من متجر خارجي
curl -X POST -H "Content-Type: application/json" \\
  -H "x-api-key: KEY" /api/v1/sales \\
  -d '{"items":[{"productId":"...","qty":1,"price":100}],
       "payMethod":"CASH","status":"COMPLETED"}'`}
        </pre>
        <p className="text-sm mt-2">
          الوثيقة الكاملة بصيغة JSON: <a href="/api/v1/docs" className="text-[var(--brand)] hover:underline" dir="ltr">/api/v1/docs</a>
        </p>
      </Card>
      <Card>
        <h2 className="font-extrabold text-[15px] mb-2">الربط بالذكاء الاصطناعي (MCP)</h2>
        <p className="text-sm text-slate-600 mb-2">
          دكّانك سيرفر MCP: أي مساعد ذكي يدعم البروتوكول يقدر يستعلم (الأصناف، النواقص، مبيعات اليوم، الديون، الصيانة) وينشئ فواتير معلقة للمراجعة — بنفس مفتاح API أعلاه عبر <code dir="ltr">POST /api/mcp</code> برسائل JSON-RPC.
        </p>
        <pre className="bg-slate-900 text-green-200 text-xs rounded-xl p-3 overflow-x-auto" dir="ltr">
{`{
  "mcpServers": {
    "dokkanek": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://HOST/api/mcp",
        "--header", "x-api-key: KEY"]
    }
  }
}`}
        </pre>
        <p className="text-sm mt-2">
          الأدوات: <code dir="ltr">store_info, list_products, low_stock, today_summary, customer_debt, ticket_status, create_sale</code>
        </p>
      </Card>
    </div>
  );
}
