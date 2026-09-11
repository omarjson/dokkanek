export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { PageTitle } from "@/components/ui";
import { MyWorkClient } from "./MyWorkClient";

// مساحة العمل الخاصة: المندوب يرى مهامه فقط، والفني أجهزته فقط
export default async function MyWorkPage() {
  const me = await currentUser();
  if (!me) redirect("/login");
  if (me.role !== "COURIER" && me.role !== "TECHNICIAN") redirect("/");

  if (me.role === "COURIER") {
    const tasks = await prisma.courierTask.findMany({
      where: { OR: [{ courierName: me.name }, { courierName: "" }], status: { in: ["PENDING", "WITH_COURIER"] } },
      orderBy: { date: "desc" },
      take: 100,
      include: { sale: { include: { customer: true } } },
    });
    return (
      <div>
        <PageTitle title="مهامي — التوصيل" sub={`مرحبا ${me.name} — مهامك ومهام بانتظار مندوب`} />
        <MyWorkClient
          role="COURIER"
          name={me.name}
          tasks={tasks.map((t) => ({
            id: t.id, courierName: t.courierName, status: t.status, collected: t.collected,
            date: t.date.toISOString(),
            sale: { id: t.sale.id, no: t.sale.no, total: t.sale.total, paid: t.sale.paid, customerName: t.sale.customer?.name ?? "بدون زبون" },
          }))}
          tickets={[]}
        />
      </div>
    );
  }

  const tickets = await prisma.maintenanceTicket.findMany({
    where: { OR: [{ technician: me.name }, { technician: "" }], status: { not: "DELIVERED" } },
    orderBy: { receivedAt: "desc" },
    take: 100,
    include: { parts: true },
  });
  return (
    <div>
      <PageTitle title="مهامي — الصيانة" sub={`مرحبا ${me.name} — أجهزتك والأجهزة بانتظار فني`} />
      <MyWorkClient
        role="TECHNICIAN"
        name={me.name}
        tasks={[]}
        tickets={tickets.map((t) => ({
          id: t.id, no: t.no, customerName: t.customerName, customerPhone: t.customerPhone,
          device: t.device, issue: t.issue, status: t.status, cost: t.cost, paid: t.paid, technician: t.technician,
        }))}
      />
    </div>
  );
}
