import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { hasPerm } from "@/lib/permissions";
import { ADMIN_ROLES } from "@/lib/format";
import { audit } from "@/lib/audit";
import { cookies } from "next/headers";

async function who() {
  const id = cookies().get("dk_session")?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

async function needUsersManage() {
  const me = await who();
  if (!me || !(await hasPerm(me.role, "users.manage"))) return null;
  return me;
}

export async function GET() {
  const me = await needUsersManage();
  if (!me) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { branch: true },
  });
  return NextResponse.json(users.map(({ passwordHash, ...u }) => u));
}

export async function POST(req: Request) {
  const me = await needUsersManage();
  if (!me) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const username = String(b.username || "").trim();
  const password = String(b.password || "");
  if (username.length < 3 || password.length < 4) {
    return NextResponse.json({ error: "اسم المستخدم 3+ وكلمة المرور 4+ أحرف" }, { status: 400 });
  }
  if (!["ADMIN", "MANAGER", "CASHIER", "COURIER", "TECHNICIAN"].includes(b.role)) {
    return NextResponse.json({ error: "الدور غير صالح" }, { status: 400 });
  }
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return NextResponse.json({ error: "اسم المستخدم موجود already" }, { status: 400 });
  const u = await prisma.user.create({
    data: {
      name: String(b.name || username),
      username,
      passwordHash: hashPassword(password),
      role: b.role,
      branchId: b.branchId || null,
    },
  });
  await audit("CREATE", "User", u.id, `إنشاء مستخدم ${username} بدور ${b.role}`, me.name, me.id);
  return NextResponse.json({ ok: true, id: u.id });
}
