export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isModuleEnabled } from "@/lib/modules";
import { PageTitle } from "@/components/ui";
import { MaintenanceClient } from "./MaintenanceClient";

export default async function MaintenancePage() {
  const modOk = await isModuleEnabled("maintenance");
  if (!modOk) redirect("/");
  const tickets = await prisma.maintenanceTicket.findMany({
    orderBy: { receivedAt: "desc" },
    take: 200,
    include: { parts: true },
  });
  const shaped = tickets.map((t) => ({
    id: t.id, no: t.no, customerName: t.customerName, customerPhone: t.customerPhone,
    device: t.device, issue: t.issue, status: t.status, technician: t.technician,
    cost: t.cost, paid: t.paid, receivedAt: t.receivedAt.toISOString(),
    parts: t.parts.map((p) => ({ id: p.id, name: p.name, price: p.price })),
  }));
  return (
    <div>
      <PageTitle title="إدارة الصيانة" sub="استلام → فحص → انتظار قطع → جاهز → تسليم" />
      <MaintenanceClient tickets={shaped} />
    </div>
  );
}
