export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/format";
import { PageTitle } from "@/components/ui";
import { SettingsForm } from "./SettingsForm";
import { ModulesForm } from "./ModulesForm";
import { getModuleState } from "@/lib/modules";

export default async function SettingsPage() {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) redirect("/");
  const rows = await prisma.setting.findMany();
  const initial = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const { enabled, preset } = await getModuleState();
  return (
    <div>
      <PageTitle title="الإعدادات" sub="الهوية والوحدات — تظهر فورا في كل المنظومة والفواتير" />
      <ModulesForm initial={enabled} preset={preset} />
      <SettingsForm initial={initial} />
    </div>
  );
}
