import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSale } from "@/lib/sales";
import { lyd } from "@/lib/format";

// سيرفر MCP (Model Context Protocol) ببروتوكول Streamable HTTP المبسط:
// POST /api/mcp برسائل JSON-RPC 2.0 + ترويسة x-api-key (نفس مفتاح API العام)
// يتيح لأي مساعد ذكي (تطبيق سطح مكتب عبر جسر mcp-remote مثلا) الاستعلام والبيع.

const PROTOCOL = "2024-11-05";

async function authorized(req: Request) {
  const key = req.headers.get("x-api-key") || "";
  if (!key) return false;
  const row = await prisma.setting.findUnique({ where: { key: "api_key" } });
  return !!row?.value && row.value === key;
}

function ok(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, result });
}
function err(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } });
}
function text(id: unknown, t: string) {
  return ok(id, { content: [{ type: "text", text: t }] });
}

const TOOLS = [
  {
    name: "store_info",
    description: "معلومات المتجر: الاسم والفروع وعدد الأصناف",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_products",
    description: "بحث الأصناف بالاسم أو الرمز أو الباركود مع الأسعار والكميات",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "كلمة البحث (اختياري)" },
        limit: { type: "number", description: "العدد الأقصى (افتراضي 20)" },
      },
    },
  },
  {
    name: "low_stock",
    description: "الأصناف التي وصلت للحد الأدنى أو تحته",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "today_summary",
    description: "ملخص مبيعات اليوم: الإيراد والربح التقريبي وعدد الفواتير",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "customer_debt",
    description: "الرصيد المستحق على زبون بالاسم أو الهاتف",
    inputSchema: {
      type: "object",
      properties: { q: { type: "string", description: "اسم الزبون أو هاتفه" } },
      required: ["q"],
    },
  },
  {
    name: "ticket_status",
    description: "حالة تذكرة صيانة برقمها",
    inputSchema: {
      type: "object",
      properties: { no: { type: "string", description: "رقم التذكرة مثل T-001" } },
      required: ["no"],
    },
  },
  {
    name: "create_sale",
    description: "إنشاء فاتورة بيع (افتراضيا معلقة PENDING للمراجعة البشرية)",
    inputSchema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          description: "الأصناف",
          items: {
            type: "object",
            properties: {
              sku: { type: "string" },
              productId: { type: "string" },
              qty: { type: "number" },
              price: { type: "number", description: "اختياري — افتراضيا سعر البيع" },
            },
            required: ["qty"],
          },
        },
        customerPhone: { type: "string" },
        payMethod: { type: "string", description: "CASH|CARD|TRANSFER|CREDIT" },
        status: { type: "string", description: "PENDING|COMPLETED|HELD|COURIER (افتراضي PENDING)" },
      },
      required: ["items"],
    },
  },
];

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    return err(body?.id ?? null, -32600, "طلب JSON-RPC غير صالح");
  }
  const { method, params, id } = body as { method: string; params?: Record<string, unknown>; id?: unknown };

  if (method === "initialize") {
    return ok(id ?? null, {
      protocolVersion: PROTOCOL,
      capabilities: { tools: {} },
      serverInfo: { name: "dokkanek-mcp", version: "0.9.0" },
    });
  }
  if (method === "notifications/initialized" || method.startsWith("notifications/")) {
    return new NextResponse(null, { status: 202 });
  }
  if (method === "ping") return ok(id ?? null, {});

  if (!(await authorized(req))) {
    return err(id ?? null, -32001, "مفتاح API غير صالح — أضف الترويسة x-api-key");
  }

  if (method === "tools/list") {
    return ok(id ?? null, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const name = String(params?.name || "");
    const args = (params?.arguments || {}) as Record<string, unknown>;
    try {
      switch (name) {
        case "store_info": {
          const [settings, branches, count] = await Promise.all([
            prisma.setting.findMany(),
            prisma.branch.findMany(),
            prisma.product.count({ where: { active: true } }),
          ]);
          const s = Object.fromEntries(settings.map((r) => [r.key, r.value]));
          return text(id ?? null, `المتجر: ${s.store_name || "دكّانك"} — الفروع: ${branches.map((b) => `${b.name} (${b.city})`).join("، ")} — الأصناف النشطة: ${count}`);
        }
        case "list_products": {
          const q = String(args.q || "");
          const limit = Math.min(Number(args.limit || 20), 100);
          const list = await prisma.product.findMany({
            where: q
              ? { active: true, OR: [{ name: { contains: q } }, { sku: { contains: q } }, { barcode: { contains: q } }] }
              : { active: true },
            orderBy: { name: "asc" },
            take: limit,
          });
          if (list.length === 0) return text(id ?? null, "لا أصناف مطابقة");
          return text(
            id ?? null,
            list.map((p) => `${p.name} [${p.sku}] — ${lyd(p.salePrice)} — متاح ${p.quantity}`).join("\n")
          );
        }
        case "low_stock": {
          const list = await prisma.product.findMany({ where: { active: true }, take: 500 });
          const low = list.filter((p) => p.quantity <= p.minQuantity);
          if (low.length === 0) return text(id ?? null, "المخزون بخير — لا أصناف منخفضة");
          return text(
            id ?? null,
            low.map((p) => `${p.name} [${p.sku}] — المتبقي ${p.quantity} (الحد ${p.minQuantity})`).join("\n")
          );
        }
        case "today_summary": {
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const [agg, count, items] = await Promise.all([
            prisma.sale.aggregate({
              _sum: { total: true },
              where: { date: { gte: start }, status: { in: ["COMPLETED", "COURIER"] } },
            }),
            prisma.sale.count({ where: { date: { gte: start }, status: { in: ["COMPLETED", "COURIER"] } } }),
            prisma.saleItem.findMany({
              where: { sale: { date: { gte: start }, status: { in: ["COMPLETED", "COURIER"] } } },
              include: { product: { select: { costPrice: true } } },
            }),
          ]);
          const profit = items.reduce((s, it) => s + (it.price - (it.product?.costPrice ?? 0)) * it.qty, 0);
          return text(
            id ?? null,
            `مبيعات اليوم: ${lyd(agg._sum.total)} — الربح التقريبي: ${lyd(profit)} — عدد الفواتير: ${count}`
          );
        }
        case "customer_debt": {
          const q = String(args.q || "");
          const c = await prisma.customer.findFirst({
            where: { OR: [{ name: { contains: q } }, { phone: { contains: q } }] },
          });
          if (!c) return text(id ?? null, "الزبون غير موجود");
          return text(id ?? null, `${c.name} (${c.phone || "بلا هاتف"}) — المستحق عليه: ${lyd(c.balance)} — سقف الآجل: ${lyd(c.creditLimit)}`);
        }
        case "ticket_status": {
          const t = await prisma.maintenanceTicket.findUnique({
            where: { no: String(args.no || "") },
            include: { parts: true },
          });
          if (!t) return text(id ?? null, "رقم التذكرة غير موجود");
          return text(
            id ?? null,
            `تذكرة ${t.no}: ${t.device} — الحالة ${t.status} — التكلفة ${lyd(t.cost)} — المدفوع ${lyd(t.paid)} — المتبقي ${lyd(t.cost - t.paid)}`
          );
        }
        case "create_sale": {
          const raw = (args.items || []) as { sku?: string; productId?: string; qty: number; price?: number }[];
          if (!Array.isArray(raw) || raw.length === 0) return err(id ?? null, -32602, "items مطلوبة");
          const items: { productId: string; qty: number; price: number }[] = [];
          for (const it of raw) {
            const p = it.productId
              ? await prisma.product.findUnique({ where: { id: it.productId } })
              : await prisma.product.findUnique({ where: { sku: String(it.sku || "") } });
            if (!p || !p.active) return err(id ?? null, -32602, `صنف غير صالح: ${it.sku || it.productId}`);
            items.push({ productId: p.id, qty: Number(it.qty), price: Number(it.price ?? p.salePrice) });
          }
          let customerId: string | null = null;
          if (args.customerPhone) {
            const c = await prisma.customer.findFirst({ where: { phone: String(args.customerPhone) } });
            customerId = c?.id || null;
          }
          const r = await createSale(
            {
              items,
              customerId,
              payMethod: String(args.payMethod || "CASH"),
              status: String(args.status || "PENDING"),
            },
            null
          );
          return text(id ?? null, `تم إنشاء الفاتورة ${r.no} بقيمة ${lyd(r.total)} (معلقة للمراجعة)`);
        }
        default:
          return err(id ?? null, -32601, `أداة غير معروفة: ${name}`);
      }
    } catch (e) {
      return err(id ?? null, -32000, String((e as Error)?.message || e));
    }
  }

  return err(id ?? null, -32601, `method غير معروف: ${method}`);
}

export async function GET() {
  return NextResponse.json({
    name: "dokkanek-mcp",
    protocol: "Model Context Protocol (Streamable HTTP)",
    endpoint: "POST /api/mcp",
    auth: "ترويسة x-api-key (نفس مفتاح API العام)",
    tools: TOOLS.map((t) => t.name),
    docs: "/api/v1/docs",
  });
}
