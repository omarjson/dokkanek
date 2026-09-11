export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRoles, ADMIN_ROLES } from "@/lib/auth";
import { PageTitle } from "@/components/ui";
import { DevelopersClient } from "./DevelopersClient";

export default async function DevelopersPage() {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) redirect("/");
  const row = await prisma.setting.findUnique({ where: { key: "api_key" } });
  return (
    <div>
      <PageTitle title="المطورون والربط" sub="مفتاح API لربط متجر إلكتروني أو أي نظام خارجي" />
      <DevelopersClient initialKey={row?.value || ""} />
    </div>
  );
}
