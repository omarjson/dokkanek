export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isModuleEnabled } from "@/lib/modules";
import { requireRoles } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/format";
import { PageTitle } from "@/components/ui";
import { EmployeesClient } from "./EmployeesClient";

export default async function EmployeesPage() {
  const modOk = await isModuleEnabled("employees");
  if (!modOk) redirect("/");
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) redirect("/");
  const employees = await prisma.employee.findMany({
    orderBy: { name: "asc" },
    include: { attendances: { orderBy: { date: "desc" }, take: 30 } },
  });
  const shaped = employees.map((e) => ({
    id: e.id, name: e.name, phone: e.phone, title: e.title,
    salary: e.salary, commissionRate: e.commissionRate,
    attendances: e.attendances.map((a) => ({
      id: a.id, date: a.date.toISOString(),
      checkIn: a.checkIn?.toISOString() ?? null,
      checkOut: a.checkOut?.toISOString() ?? null,
      minutes: a.minutes,
    })),
  }));
  return (
    <div>
      <PageTitle title="الموظفون وتتبع الوقت" sub="حضور وانصراف بزر واحد — المستحق يحسب تلقائيا من الدقائق" />
      <EmployeesClient employees={shaped} />
    </div>
  );
}
