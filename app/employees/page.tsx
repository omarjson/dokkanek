export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isModuleEnabled } from "@/lib/modules";
import { currentUser } from "@/lib/auth";
import { hasPerm } from "@/lib/permissions";
import { PageTitle } from "@/components/ui";
import { EmployeesClient } from "./EmployeesClient";

export default async function EmployeesPage() {
  const modOk = await isModuleEnabled("employees");
  if (!modOk) redirect("/");
  const me = await currentUser();
  if (!me || !(await hasPerm(me.role, "hr.view"))) redirect("/");
  const employees = await prisma.employee.findMany({
    orderBy: { name: "asc" },
    include: {
      attendances: { orderBy: { date: "desc" }, take: 30 },
      advances: { orderBy: { date: "desc" }, take: 20 },
    },
  });
  const canAdvance = await hasPerm(me.role, "hr.advance");
  const shaped = employees.map((e) => ({
    id: e.id, name: e.name, phone: e.phone, title: e.title,
    salary: e.salary, commissionRate: e.commissionRate,
    attendances: e.attendances.map((a) => ({
      id: a.id, date: a.date.toISOString(),
      checkIn: a.checkIn?.toISOString() ?? null,
      checkOut: a.checkOut?.toISOString() ?? null,
      minutes: a.minutes,
    })),
    advances: e.advances.map((a) => ({
      id: a.id, amount: a.amount, note: a.note, settled: a.settled, date: a.date.toISOString(),
    })),
  }));
  return (
    <div>
      <PageTitle title="الموظفون وتتبع الوقت" sub="حضور وانصراف — رواتب وسلف بصلاحيات" />
      <EmployeesClient employees={shaped} canAdvance={canAdvance} />
    </div>
  );
}
