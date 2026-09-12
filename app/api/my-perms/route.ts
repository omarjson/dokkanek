import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRolePerms } from "@/lib/permissions";
import { cookies } from "next/headers";

// صلاحيات المستخدم الحالي — تستعملها القائمة الجانبية لإخفاء ما لا يملكه
export async function GET() {
  const id = cookies().get("dk_session")?.value;
  if (!id) return NextResponse.json({ perms: [] });
  const me = await prisma.user.findUnique({ where: { id } });
  if (!me) return NextResponse.json({ perms: [] });
  if (me.role === "ADMIN") return NextResponse.json({ perms: ["*"] });
  return NextResponse.json({ perms: Array.from(await getRolePerms(me.role)) });
}
