import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { cookies } from "next/headers";

async function who() {
  const id = cookies().get("dk_session")?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

// سجل تحويل بضاعة بين مخزنين: حركتا OUT/IN بنفس المرجع + نقل تبعية الصنف للمخزن المستلم
export async function POST(req: Request) {
  const me = await who();
  if (!me) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const qty = Number(b.qty || 0);
  if (!b.productId || !b.fromId || !b.toId || qty <= 0) {
    return NextResponse.json({ error: "الصنف والمخزنان والكمية مطلوبة" }, { status: 400 });
  }
  if (b.fromId === b.toId) return NextResponse.json({ error: "المخزنان متطابقان" }, { status: 400 });
  const [p, from, to] = await Promise.all([
    prisma.product.findUnique({ where: { id: b.productId } }),
    prisma.warehouse.findUnique({ where: { id: b.fromId } }),
    prisma.warehouse.findUnique({ where: { id: b.toId } }),
  ]);
  if (!p || !from || !to) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  if (p.quantity < qty) return NextResponse.json({ error: `المتاح فقط ${p.quantity}` }, { status: 400 });

  const ref = `TRF-${Date.now().toString(36).toUpperCase()}`;
  await prisma.stockMove.create({
    data: { productId: p.id, qty: -qty, type: "TRANSFER", note: `${ref}: من ${from.name} إلى ${to.name}`, userId: me.id },
  });
  await prisma.stockMove.create({
    data: { productId: p.id, qty, type: "TRANSFER", note: `${ref}: استلام في ${to.name}`, userId: me.id },
  });
  await prisma.product.update({ where: { id: p.id }, data: { warehouseId: to.id } });
  await audit("CREATE", "Transfer", ref, `تحويل ${p.name} × ${qty} من ${from.name} إلى ${to.name}`, me.name, me.id);
  return NextResponse.json({ ok: true, ref });
}

export async function GET() {
  const moves = await prisma.stockMove.findMany({
    where: { type: "TRANSFER" },
    orderBy: { date: "desc" },
    take: 100,
    include: { product: true },
  });
  return NextResponse.json(moves);
}
