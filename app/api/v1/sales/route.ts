import { NextResponse } from "next/server";
import { createSale } from "@/lib/sales";
import { checkApiKey, unauthorized } from "@/lib/api-auth";

// POST /api/v1/sales — إنشاء فاتورة من نظام خارجي (متجر إلكتروني مثلا)
// { items:[{productId,qty,price}], payMethod, status, discount, customerId, courierName }
export async function POST(req: Request) {
  const me = await checkApiKey(req);
  if (!me) return unauthorized();
  const b = await req.json().catch(() => ({}));
  try {
    const r = await createSale(b, me);
    return NextResponse.json({ ok: true, id: r.id, no: r.no, total: r.total });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error)?.message || e) }, { status: 400 });
  }
}
