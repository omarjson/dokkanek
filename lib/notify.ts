import { prisma } from "./db";

export async function getNotifySettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["wa_enabled", "wa_endpoint", "wa_token", "wa_sender", "notify_sale", "store_name"] } },
  });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function queueNotification(input: {
  to: string;
  template: string;
  body: string;
  relatedType?: string;
  relatedId?: string;
}) {
  if (!input.to || !input.to.trim()) return null;
  const n = await prisma.notification.create({
    data: {
      to: input.to.trim(),
      template: input.template,
      body: input.body,
      relatedType: input.relatedType || "",
      relatedId: input.relatedId || "",
      status: "PENDING",
    },
  });
  await trySend(n.id).catch(() => {});
  return n;
}

export async function trySend(id: string) {
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n || n.status === "SENT") return n;
  const s = await getNotifySettings();
  // بدون تفعيل ومزود: تبقى في قائمة الانتظار (لا ندعي الإرسال)
  if (s.wa_enabled !== "1" || !s.wa_endpoint) return n;
  try {
    const res = await fetch(s.wa_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(s.wa_token ? { Authorization: `Bearer ${s.wa_token}` } : {}),
      },
      body: JSON.stringify({ to: n.to, body: n.body, sender: s.wa_sender || undefined }),
    });
    if (!res.ok) throw new Error(`provider-${res.status}`);
    return await prisma.notification.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date(), error: "" },
    });
  } catch (e) {
    return await prisma.notification.update({
      where: { id },
      data: { status: "FAILED", error: String((e as Error)?.message || e).slice(0, 300) },
    });
  }
}

export async function sendPending() {
  const list = await prisma.notification.findMany({
    where: { status: { in: ["PENDING", "FAILED"] } },
    take: 50,
  });
  for (const n of list) await trySend(n.id);
  return list.length;
}
