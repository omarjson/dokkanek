import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles, ADMIN_ROLES } from "@/lib/auth";
import { sendPending } from "@/lib/notify";

export async function GET() {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const list = await prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (b.action === "retry") {
    const count = await sendPending();
    return NextResponse.json({ ok: true, count });
  }
  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}
