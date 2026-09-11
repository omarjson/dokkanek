import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { queueNotification } from "@/lib/notify";
import { cookies } from "next/headers";

// تذكير زبون مدين عبر طابور التنبيهات (يُرسل عند تفعيل المزود)
export async function POST(req: Request) {
  const me = cookies().get("dk_session")?.value
    ? await prisma.user.findUnique({ where: { id: cookies().get("dk_session")!.value } })
    : null;
  if (!me) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const c = b.customerId ? await prisma.customer.findUnique({ where: { id: b.customerId } }) : null;
  if (!c) return NextResponse.json({ error: "الزبون غير موجود" }, { status: 404 });
  if (c.balance <= 0) return NextResponse.json({ error: "لا مستحقات على هذا الزبون" }, { status: 400 });
  if (!c.phone) return NextResponse.json({ error: "الزبون بلا رقم هاتف" }, { status: 400 });
  const st = Object.fromEntries((await prisma.setting.findMany()).map((r) => [r.key, r.value]));
  const n = await queueNotification({
    to: c.phone,
    template: "debt_reminder",
    body: `${st.store_name || "دكّانك"}: عزيزي ${c.name} — نذكرك بمستحق ${c.balance.toFixed(2)} د.ل. شكرا لتعاملك`,
    relatedType: "Customer",
    relatedId: c.id,
  });
  await audit("CREATE", "Notification", n?.id || "", `تذكير دين لـ ${c.name}`, me.name, me.id);
  return NextResponse.json({ ok: true });
}
