import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { requireRoles, ADMIN_ROLES } from "@/lib/auth";
import { audit } from "@/lib/audit";

// توليد/عرض مفتاح الـ API (للإدارة فقط) — يُحفظ في الإعدادات
export async function GET() {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const row = await prisma.setting.findUnique({ where: { key: "api_key" } });
  return NextResponse.json({ key: row?.value || "" });
}

export async function POST() {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const key = `dk_${randomBytes(24).toString("hex")}`;
  await prisma.setting.upsert({
    where: { key: "api_key" },
    update: { value: key },
    create: { key: "api_key", value: key },
  });
  await audit("CREATE", "ApiKey", "", "توليد مفتاح API جديد", me.name, me.id);
  return NextResponse.json({ key });
}
