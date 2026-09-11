export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/format";
import { fmtDate } from "@/lib/format";
import { PageTitle, Card, THead } from "@/components/ui";

export default async function AuditPage() {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) redirect("/");
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div>
      <PageTitle title="سجل الأمن" sub="كل حركة في المنظومة مسجلة باسم المستخدم والوقت" />
      <Card>
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <THead>
              <th className="p-2 text-start">الوقت</th>
              <th className="p-2 text-start">المستخدم</th>
              <th className="p-2 text-start">الحركة</th>
              <th className="p-2 text-start">التفاصيل</th>
          </THead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-2 text-xs text-slate-500">{fmtDate(l.createdAt)}</td>
                <td className="p-2">{l.username || "—"}</td>
                <td className="p-2"><b>{l.action}</b> <span className="text-slate-500">{l.entity}</span></td>
                <td className="p-2 text-xs">{l.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {logs.length === 0 && <p className="text-center text-slate-400 py-6">لا سجلات بعد</p>}
      </Card>
    </div>
  );
}
