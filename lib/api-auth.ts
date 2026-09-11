import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// مصادقة الـ API العام بمفتاح يُولَّد من صفحة المطورين (يُرسل في ترويسة x-api-key)
export async function checkApiKey(req: Request) {
  const key = req.headers.get("x-api-key") || "";
  if (!key) return null;
  const row = await prisma.setting.findUnique({ where: { key: "api_key" } });
  if (!row || !row.value || row.value !== key) return null;
  const branch = await prisma.branch.findFirst();
  // بلا مستخدم حقيقي: cashierId يبقى null (مفتاح تكامل وليس موظفا)
  return { id: undefined, name: "API", branchId: branch?.id || null };
}

export function unauthorized() {
  return NextResponse.json({ error: "مفتاح API غير صالح — أضف الترويسة x-api-key" }, { status: 401 });
}
