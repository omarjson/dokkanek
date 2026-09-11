export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/format";
import { PageTitle, Card, SectionTitle } from "@/components/ui";
import { IconBox } from "@/components/icons";
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
      <Card>
        <SectionTitle icon={IconBox} title="النسخ الاحتياطي" />
        <p className="text-sm text-slate-500 mb-2 leading-6">نزّل نسخة من قاعدة البيانات واحتفظ بها في مكان آمن. يُنصح بنسخة أسبوعية.</p>
        <a href="/api/backup" className="inline-flex items-center justify-center gap-1.5 border border-slate-300 bg-white rounded-xl px-4 py-2.5 shadow-sm transition hover:bg-slate-50 text-sm font-bold">
          تحميل نسخة احتياطية
        </a>
      </Card>
    </div>
  );
}
