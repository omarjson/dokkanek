export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { PageTitle, Card } from "@/components/ui";

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div>
      <PageTitle title="سجل الأمن" sub="كل حركة في المنظومة مسجلة باسم المستخدم والوقت" />
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="p-2 text-right">الوقت</th>
              <th className="p-2 text-right">المستخدم</th>
              <th className="p-2 text-right">الحركة</th>
              <th className="p-2 text-right">التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-2 text-xs text-gray-500">{fmtDate(l.createdAt)}</td>
                <td className="p-2">{l.username || "—"}</td>
                <td className="p-2"><b>{l.action}</b> <span className="text-gray-500">{l.entity}</span></td>
                <td className="p-2 text-xs">{l.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-center text-gray-400 py-6">لا سجلات بعد</p>}
      </Card>
    </div>
  );
}
