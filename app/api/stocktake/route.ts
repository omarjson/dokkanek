import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { cookies } from "next/headers";

async function who() {
  const id = cookies().get("dk_session")?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

// إنشاء جلسة جرد: نسخة من الأرصدة الحالية + إضافة أصناف للعد
export async function GET() {
  const list = await prisma.stocktake.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { items: { include: { product: true } } },
  });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const me = await who();
  const b = await req.json().catch(() => ({}));
  const no = `ST-${Date.now().toString(36).toUpperCase()}`;
  const st = await prisma.stocktake.create({
    data: {
      no,
      branchId: me?.branchId || (await prisma.branch.findFirst())?.id,
      note: String(b.note || ""),
      status: "OPEN",
    },
  });
  await audit("CREATE", "Stocktake", st.id, `فتح جرد ${no}`, me?.name, me?.id);
  return NextResponse.json({ ok: true, id: st.id, no });
}
