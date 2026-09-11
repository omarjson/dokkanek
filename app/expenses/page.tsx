export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isModuleEnabled } from "@/lib/modules";
import { PageTitle } from "@/components/ui";
import { ExpensesClient } from "./ExpensesClient";

export default async function ExpensesPage() {
  const modOk = await isModuleEnabled("expenses");
  if (!modOk) redirect("/");
  const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" }, take: 200 });
  const total = expenses.reduce((s, x) => s + x.amount, 0);
  const shaped = expenses.map((x) => ({ id: x.id, title: x.title, amount: x.amount, date: x.date.toISOString(), note: x.note }));
  return (
    <div>
      <PageTitle title="إدارة المصروفات" sub="كل مصروف يسجل باسم المستخدم في سجل الأمن" />
      <ExpensesClient expenses={shaped} total={total} />
    </div>
  );
}
