export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { PageTitle } from "@/components/ui";
import { DeliveryClient } from "./DeliveryClient";

export default async function DeliveryPage() {
  const tasks = await prisma.courierTask.findMany({
    orderBy: { date: "desc" },
    take: 200,
    include: { sale: { include: { customer: true } } },
  });
  const shaped = tasks.map((t) => ({
    id: t.id, courierName: t.courierName, status: t.status,
    codAmount: t.codAmount, collected: t.collected, date: t.date.toISOString(),
    sale: { id: t.sale.id, no: t.sale.no, total: t.sale.total, paid: t.sale.paid, customer: t.sale.customer ? { name: t.sale.customer.name } : null },
  }));
  return (
    <div>
      <PageTitle title="إدارة التوصيل" sub="مهام المناديب والتحصيل عند التسليم" />
      <DeliveryClient tasks={shaped} />
    </div>
  );
}
