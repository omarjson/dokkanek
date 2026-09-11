export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/format";
import { PageTitle } from "@/components/ui";
import { BranchesClient } from "./BranchesClient";

export default async function BranchesPage() {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) redirect("/");
  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
    include: { warehouses: true, _count: { select: { users: true } } },
  });
  return (
    <div>
      <PageTitle title="الفروع والمخازن" sub="أضف فروعا ومخازن جديدة — المستخدمون يُسندون للفروع من صفحة المستخدمين" />
      <BranchesClient branches={branches} />
    </div>
  );
}
