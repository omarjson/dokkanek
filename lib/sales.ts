import { prisma } from "./db";
import { audit } from "./audit";
import { queueNotification } from "./notify";

export type SaleInput = {
  items: { productId: string; qty: number; price: number }[];
  status?: string;
  payMethod?: string;
  discount?: number | string;
  customerId?: string | null;
  courierName?: string;
};

export type Actor = { id?: string; name?: string; branchId?: string | null } | null;

// منطق إنشاء الفاتورة المشترك بين الواجهة والـ API العام — أي تعديل هنا ينعكس على الاثنين
export async function createSale(b: SaleInput, me: Actor) {
  const items = b.items || [];
  if (items.length === 0) throw new Error("السلة فارغة");

  const status = ["COMPLETED", "PENDING", "HELD", "COURIER"].includes(b.status || "")
    ? (b.status as string)
    : "COMPLETED";
  const payMethod = ["CASH", "CARD", "TRANSFER", "CREDIT"].includes(b.payMethod || "")
    ? (b.payMethod as string)
    : "CASH";
  const discount = Number(b.discount || 0);

  let subtotal = 0;
  for (const it of items) {
    const p = await prisma.product.findUnique({ where: { id: it.productId } });
    if (!p || !p.active) throw new Error("صنف غير صالح");
    if ((status === "COMPLETED" || status === "COURIER") && p.quantity < Number(it.qty)) {
      throw new Error(`الكمية غير كافية: ${p.name}`);
    }
    subtotal += Number(it.price) * Number(it.qty);
  }
  const total = Math.max(0, subtotal - discount);
  const paid = payMethod === "CREDIT" || status === "PENDING" || status === "HELD" ? 0 : total;
  const no = `S-${Date.now().toString(36).toUpperCase()}`;

  const sale = await prisma.sale.create({
    data: {
      no,
      branchId: me?.branchId || (await prisma.branch.findFirst())?.id,
      customerId: b.customerId || null,
      cashierId: me?.id,
      status,
      payMethod,
      subtotal,
      discount,
      total,
      paid,
    },
  });

  for (const it of items) {
    await prisma.saleItem.create({
      data: { saleId: sale.id, productId: it.productId, qty: Number(it.qty), price: Number(it.price) },
    });
    if (status === "COMPLETED" || status === "COURIER") {
      await prisma.product.update({
        where: { id: it.productId },
        data: { quantity: { decrement: Number(it.qty) } },
      });
      await prisma.stockMove.create({
        data: { productId: it.productId, qty: -Number(it.qty), type: "OUT", note: `فاتورة ${no}`, userId: me?.id },
      });
    }
  }

  if (paid > 0) {
    await prisma.payment.create({
      data: { saleId: sale.id, customerId: b.customerId || null, amount: paid, method: payMethod },
    });
  }
  if (b.customerId && total - paid > 0) {
    await prisma.customer.update({
      where: { id: b.customerId },
      data: { balance: { increment: total - paid } },
    });
  }
  if (status === "COURIER") {
    await prisma.courierTask.create({
      data: { saleId: sale.id, courierName: String(b.courierName || ""), status: "PENDING", codAmount: total - paid },
    });
  }
  await audit("CREATE", "Sale", sale.id, `فاتورة ${no} بقيمة ${total}`, me?.name, me?.id);
  try {
    const st = Object.fromEntries((await prisma.setting.findMany()).map((r) => [r.key, r.value]));
    if (st.notify_sale === "1" && b.customerId) {
      const cust = await prisma.customer.findUnique({ where: { id: b.customerId } });
      if (cust?.phone) {
        await queueNotification({
          to: cust.phone,
          template: "invoice",
          body: `${st.store_name || "دكّانك"}: فاتورتك ${no} بقيمة ${total} — شكرا لك`,
          relatedType: "Sale",
          relatedId: sale.id,
        });
      }
    }
  } catch {}
  return { id: sale.id, no, total };
}
