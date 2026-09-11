export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/format";
import { PageTitle } from "@/components/ui";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) redirect("/");
  const rows = await prisma.setting.findMany();
  const initial = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return (
    <div>
      <PageTitle title="الإعدادات" sub="اسم المتجر والشعار والألوان — تظهر فورا في كل المنظومة والفواتير" />
      <SettingsForm initial={initial} />
    </div>
  );
}
