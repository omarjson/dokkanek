export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { PageTitle } from "@/components/ui";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const rows = await prisma.setting.findMany();
  const initial = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return (
    <div>
      <PageTitle title="الإعدادات" sub="اسم المتجر والشعار والألوان — تظهر فورا في كل المنظومة والفواتير" />
      <SettingsForm initial={initial} />
    </div>
  );
}
