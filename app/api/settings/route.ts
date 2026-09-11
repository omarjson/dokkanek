import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireRoles } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/format";

export async function GET() {
  const rows = await prisma.setting.findMany();
  return NextResponse.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}

export async function PUT(req: Request) {
  return saveSettings(req);
}

// POST بديل لـ PUT (بعض بيئات ويندوز ترفض PUT على مستوى السيرفر)
export async function POST(req: Request) {
  return saveSettings(req);
}

async function saveSettings(req: Request) {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const b = await req.json();
  for (const [key, value] of Object.entries(b)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: String(value ?? "") },
      create: { key, value: String(value ?? "") },
    });
  }
  await audit("UPDATE", "Setting", "", "تحديث الإعدادات", me?.name, me?.id);
  return NextResponse.json({ ok: true });
}
