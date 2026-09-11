import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { cookies } from "next/headers";

// سداد دين مورد (ينقص المستحق عليه) — يُقبل من أي دور مسجل دخول
export async function POST(req: Request) {
  const me = cookies().get("dk_session")?.value
    ? await prisma.user.findUnique({ where: { id: cookies().get("dk_session")!.value } })
    : null;
  if (!me) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const amount = Number(b.amount || 0);
  if (!b.supplierId || amount <= 0) {
    return NextResponse.json({ error: "المورد والمبلغ مطلوبان" }, { status: 400 });
  }
  const s = await prisma.supplier.findUnique({ where: { id: b.supplierId } });
  if (!s) return NextResponse.json({ error: "المورد غير موجود" }, { status: 404 });
  if (amount > s.balance + 0.001) {
    return NextResponse.json({ error: `المبلغ أكبر من المستحق (${s.balance})` }, { status: 400 });
  }
  await prisma.supplier.update({ where: { id: s.id }, data: { balance: { decrement: amount } } });
  const p = await prisma.payment.create({
    data: { supplierId: s.id, amount, method: b.method || "CASH", note: String(b.note || "سداد مورد") },
  });
  await audit("CREATE", "Payment", p.id, `سداد مورد ${s.name}: ${amount}`, me.name, me.id);
  return NextResponse.json({ ok: true });
}
