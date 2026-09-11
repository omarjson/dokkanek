import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles, hashPassword } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/format";
import { audit } from "@/lib/audit";

// تفعيل/تعطيل، تغيير الدور، تصفير كلمة المرور — للإدارة فقط (لا حذف لحفظ السجلات)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const u = await prisma.user.findUnique({ where: { id: params.id } });
  if (!u) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (u.id === me.id && b.active === false) {
    return NextResponse.json({ error: "لا يمكنك تعطيل حسابك" }, { status: 400 });
  }
  const data: Record<string, unknown> = {};
  if (typeof b.active === "boolean") data.active = b.active;
  if (b.role && ["ADMIN", "MANAGER", "CASHIER", "COURIER", "TECHNICIAN"].includes(b.role)) data.role = b.role;
  if (b.branchId !== undefined) data.branchId = b.branchId || null;
  if (b.password && String(b.password).length >= 4) data.passwordHash = hashPassword(String(b.password));
  await prisma.user.update({ where: { id: u.id }, data });
  await audit("UPDATE", "User", u.id, `تعديل مستخدم ${u.username}`, me.name, me.id);
  return NextResponse.json({ ok: true });
}
