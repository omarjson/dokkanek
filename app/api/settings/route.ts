import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { cookies } from "next/headers";

export async function GET() {
  const rows = await prisma.setting.findMany();
  return NextResponse.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}

export async function PUT(req: Request) {
  const me = cookies().get("dk_session")?.value
    ? await prisma.user.findUnique({ where: { id: cookies().get("dk_session")!.value } })
    : null;
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
