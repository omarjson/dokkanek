export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/format";
import { PageTitle } from "@/components/ui";
import { UsersClient } from "./UsersClient";

export default async function UsersPage() {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) redirect("/");
  const [users, branches] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" }, include: { branch: true } }),
    prisma.branch.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div>
      <PageTitle title="إدارة المستخدمين" sub="إنشاء حسابات الموظفين والأدوار والإيقاف وتصفير كلمات المرور" />
      <UsersClient
        users={users.map((u) => ({ id: u.id, name: u.name, username: u.username, role: u.role, active: u.active, branch: u.branch ? { name: u.branch.name } : null }))}
        branches={branches}
      />
    </div>
  );
}
