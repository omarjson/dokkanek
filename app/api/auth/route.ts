import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";

// حد بسيط ضد التخمين: 5 محاولات فاشلة لكل مستخدم خلال 5 دقائق
const attempts = new Map<string, { count: number; until: number }>();

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}));
  const key = String(username || "").toLowerCase();
  const now = Date.now();
  const cur = attempts.get(key);
  if (cur && cur.until > now && cur.count >= 5) {
    return NextResponse.json({ error: "محاولات كثيرة — انتظر 5 دقائق" }, { status: 429 });
  }
  const user = await prisma.user.findUnique({ where: { username: String(username || "") } });
  if (!user || !user.active || user.passwordHash !== hashPassword(String(password || ""))) {
    const next = { count: (cur && cur.until > now ? cur.count : 0) + 1, until: now + 5 * 60 * 1000 };
    attempts.set(key, next);
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }
  attempts.delete(key);
  await audit("LOGIN", "User", user.id, `دخول ${user.name}`, user.name, user.id);
  const res = NextResponse.json({ ok: true, name: user.name, role: user.role });
  res.cookies.set("dk_session", user.id, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 12,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("dk_session", "", { path: "/", maxAge: 0 });
  return res;
}
