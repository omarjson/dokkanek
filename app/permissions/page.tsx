export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { requireRoles } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/format";
import { PERMISSIONS, getRolePerms, ROLES_LIST } from "@/lib/permissions";
import { PageTitle } from "@/components/ui";
import { PermissionsClient } from "./PermissionsClient";

export default async function PermissionsPage() {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) redirect("/");
  const initial: Record<string, Record<string, boolean>> = {};
  for (const role of ROLES_LIST) {
    const set = await getRolePerms(role);
    initial[role] = {};
    for (const p of PERMISSIONS) initial[role][p.key] = set.has(p.key);
  }
  return (
    <div>
      <PageTitle title="الصلاحيات" sub="من يرى التكلفة والرواتب ومن يخصم ويلغي — تحكم المالك الكامل" />
      <PermissionsClient initial={initial} />
    </div>
  );
}
