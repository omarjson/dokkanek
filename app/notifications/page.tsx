export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRoles, ADMIN_ROLES } from "@/lib/auth";
import { PageTitle } from "@/components/ui";
import { NotificationsClient } from "./NotificationsClient";

export default async function NotificationsPage() {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) redirect("/");
  const [items, rows] = await Promise.all([
    prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.setting.findMany({ where: { key: "wa_enabled" } }),
  ]);
  const shaped = items.map((n) => ({
    id: n.id, to: n.to, template: n.template, body: n.body, status: n.status,
    error: n.error, createdAt: n.createdAt.toISOString(), sentAt: n.sentAt ? n.sentAt.toISOString() : null,
  }));
  return (
    <div>
      <PageTitle title="التنبيهات" sub="طابور رسائل الزبائن (صيانة/فواتير) — تُرسل عبر المزود عند تفعيله" />
      <NotificationsClient items={shaped} enabled={rows[0]?.value === "1"} />
    </div>
  );
}
