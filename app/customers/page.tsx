export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { PageTitle } from "@/components/ui";
import { CustomersClient } from "./CustomersClient";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: { sales: { where: { paid: undefined }, orderBy: { date: "desc" }, take: 50 } },
  });
  const shaped = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    creditLimit: c.creditLimit,
    balance: c.balance,
    sales: c.sales.map((s) => ({ id: s.id, no: s.no, total: s.total, paid: s.paid })),
  }));
  return (
    <div>
      <PageTitle title="الزبائن والديون" sub="الآجل والسداد والمستحقات" />
      <CustomersClient customers={shaped} />
    </div>
  );
}
