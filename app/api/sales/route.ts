import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSale } from "@/lib/sales";
import { cookies } from "next/headers";

export async function GET() {
  const sales = await prisma.sale.findMany({
    orderBy: { date: "desc" },
    take: 100,
    include: { customer: true, cashier: true, items: true },
  });
  return NextResponse.json(sales);
}

export async function POST(req: Request) {
  const me = cookies().get("dk_session")?.value
    ? await prisma.user.findUnique({ where: { id: cookies().get("dk_session")!.value } })
    : null;
  const b = await req.json();
  try {
    const r = await createSale(b, me);
    return NextResponse.json({ ok: true, id: r.id, no: r.no });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error)?.message || e) }, { status: 400 });
  }
}
