import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}));
  const user = await prisma.user.findUnique({ where: { username: String(username || "") } });
  if (!user || !user.active || user.passwordHash !== hashPassword(String(password || ""))) {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }
  await audit("LOGIN", "User", user.id, `دخول ${user.name}`, user.name, user.id);
  const res = NextResponse.json({ ok: true, name: user.name, role: user.role });
  res.cookies.set("dk_session", user.id, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 12,
    sameSite: "lax",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("dk_session", "", { path: "/", maxAge: 0 });
  return res;
}
