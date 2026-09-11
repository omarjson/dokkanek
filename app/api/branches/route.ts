import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/format";
import { audit } from "@/lib/audit";

export async function GET() {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
    include: { warehouses: true, _count: { select: { users: true } } },
  });
  return NextResponse.json(branches);
}

export async function POST(req: Request) {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (b.kind === "warehouse") {
    if (!b.name || !b.branchId) return NextResponse.json({ error: "الاسم والفرع مطلوبان" }, { status: 400 });
    const w = await prisma.warehouse.create({ data: { name: String(b.name), branchId: b.branchId } });
    await audit("CREATE", "Warehouse", w.id, `مخزن جديد ${w.name}`, me.name, me.id);
    return NextResponse.json(w);
  }
  if (!b.name) return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
  const branch = await prisma.branch.create({
    data: { name: String(b.name), city: String(b.city || ""), phone: String(b.phone || "") },
  });
  await prisma.warehouse.create({ data: { name: "المخزن الرئيسي", branchId: branch.id } });
  await audit("CREATE", "Branch", branch.id, `فرع جديد ${branch.name}`, me.name, me.id);
  return NextResponse.json(branch);
}
