import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { requireRoles } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/format";

// تنزيل نسخة احتياطية من قاعدة البيانات (SQLite) — للإدارة فقط
export async function GET() {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  try {
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    const buf = await readFile(dbPath);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/x-sqlite3",
        "Content-Disposition": `attachment; filename="dokkanek-backup-${stamp}.db"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "تعذر قراءة القاعدة (PostgreSQL؟ استخدم أدواتها)" }, { status: 400 });
  }
}
