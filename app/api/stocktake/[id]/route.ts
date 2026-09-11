import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { cookies } from "next/headers";

async function who() {
  const id = cookies().get("dk_session")?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

// action=add: تسجيل عد صنف | action=close: إقفال وتسوية الفروقات في المخزون
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await who();
  const b = await req.json().catch(() => ({}));
  const st = await prisma.stocktake.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!st) return NextResponse.json({ error: "الجرد غير موجود" }, { status: 404 });
  if (st.status !== "OPEN") return NextResponse.json({ error: "الجرد مقفل already" }, { status: 400 });

  if (b.action === "add") {
    const p = await prisma.product.findUnique({ where: { id: b.productId } });
    if (!p) return NextResponse.json({ error: "الصنف غير موجود" }, { status: 404 });
    await prisma.stocktakeItem.upsert({
      where: { stocktakeId_productId: { stocktakeId: st.id, productId: p.id } },
      update: { countedQty: Number(b.countedQty || 0) },
      create: { stocktakeId: st.id, productId: p.id, systemQty: p.quantity, countedQty: Number(b.countedQty || 0) },
    });
    return NextResponse.json({ ok: true });
  }

  if (b.action === "close") {
    let adjusted = 0;
    for (const it of st.items) {
      const diff = it.countedQty - it.systemQty;
      if (Math.abs(diff) > 0.0001) {
        await prisma.product.update({ where: { id: it.productId }, data: { quantity: { increment: diff } } });
        await prisma.stockMove.create({
          data: { productId: it.productId, qty: diff, type: "ADJUST", note: `تسوية جرد ${st.no}`, userId: me?.id },
        });
        adjusted++;
      }
    }
    await prisma.stocktake.update({ where: { id: st.id }, data: { status: "CLOSED", closedAt: new Date() } });
    await audit("UPDATE", "Stocktake", st.id, `إقفال جرد ${st.no} — سوّي ${adjusted} صنف`, me?.name, me?.id);
    return NextResponse.json({ ok: true, adjusted });
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}
