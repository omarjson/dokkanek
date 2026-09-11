export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { PageTitle } from "@/components/ui";
import { ShiftsClient } from "./ShiftsClient";

export default async function ShiftsPage() {
  const [open, history] = await Promise.all([
    prisma.cashShift.findFirst({ where: { status: "OPEN" }, orderBy: { openedAt: "desc" } }),
    prisma.cashShift.findMany({ orderBy: { openedAt: "desc" }, take: 30 }),
  ]);
  let expected = 0;
  if (open) {
    const agg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { method: "CASH", date: { gte: open.openedAt } },
    });
    expected = open.opening + (agg._sum.amount ?? 0);
  }
  const shape = (s: { id: string; opening: number; closing: number | null; openedAt: Date | string; closedAt: Date | string | null; status: string }) => ({
    ...s,
    openedAt: new Date(s.openedAt).toISOString(),
    closedAt: s.closedAt ? new Date(s.closedAt).toISOString() : null,
  });
  return (
    <div>
      <PageTitle title="ورديات الخزينة" sub="فتح بعهدة — إقفال بجرد فعلي مع حساب الفرق تلقائيا" />
      <ShiftsClient
        open={open ? shape(open) : null}
        history={history.map(shape)}
        expected={expected}
      />
    </div>
  );
}
