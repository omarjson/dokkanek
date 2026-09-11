import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { cookies } from "next/headers";

async function who() {
  const id = cookies().get("dk_session")?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

// kind=return: إرجاع للزبون → يزيد المخزون | kind=damage: تالف → ينقص المخزون
export async function POST(req: Request) {
  const me = await who();
  const b = await req.json();
  const qty = Number(b.qty || 0);
  if (!b.productId || qty <= 0) return NextResponse.json({ error: "الصنف والكمية مطلوبان" }, { status: 400 });
  const p = await prisma.product.findUnique({ where: { id: b.productId } });
  if (!p) return NextResponse.json({ error: "الصنف غير موجود" }, { status: 404 });

  if (b.kind === "damage") {
    if (p.quantity < qty) return NextResponse.json({ error: `المتاح فقط ${p.quantity}` }, { status: 400 });
    await prisma.product.update({ where: { id: p.id }, data: { quantity: { decrement: qty } } });
    await prisma.damage.create({ data: { productId: p.id, qty, reason: String(b.reason || "") } });
    await prisma.stockMove.create({ data: { productId: p.id, qty: -qty, type: "DAMAGE", note: String(b.reason || "تالف"), userId: me?.id } });
    await audit("CREATE", "Damage", p.id, `تالف ${p.name} × ${qty}`, me?.name, me?.id);
  } else {
    await prisma.product.update({ where: { id: p.id }, data: { quantity: { increment: qty } } });
    await prisma.return.create({
      data: { productId: p.id, saleId: b.saleId || null, qty, reason: String(b.reason || "") },
    });
    await prisma.stockMove.create({ data: { productId: p.id, qty, type: "RETURN", note: String(b.reason || "راجع"), userId: me?.id } });
    await audit("CREATE", "Return", p.id, `راجع ${p.name} × ${qty}`, me?.name, me?.id);
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const [returns, damages] = await Promise.all([
    prisma.return.findMany({ orderBy: { date: "desc" }, take: 100, include: { product: true, sale: true } }),
    prisma.damage.findMany({ orderBy: { date: "desc" }, take: 100, include: { product: true } }),
  ]);
  return NextResponse.json({ returns, damages });
}
