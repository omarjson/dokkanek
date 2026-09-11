import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCSV(header: string[], rows: unknown[][]): string {
  const lines = [header.join(","), ...rows.map((r) => r.map(csvCell).join(","))];
  return "﻿" + lines.join("\n");
}

// تصدير CSV (يفتح في Excel مباشرة): sales | products | customers | stock
export async function GET(req: Request) {
  const id = cookies().get("dk_session")?.value;
  if (!id) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "sales";
  const stamp = new Date().toISOString().slice(0, 10);
  let csv = "";
  let name = "";

  if (type === "products") {
    const list = await prisma.product.findMany({ include: { category: true, warehouse: true }, orderBy: { name: "asc" } });
    csv = toCSV(
      ["SKU", "الاسم", "التصنيف", "التكلفة", "البيع", "الكمية", "الباركود", "الحد"],
      list.map((p) => [p.sku, p.name, p.category?.name || "", p.costPrice, p.salePrice, p.quantity, p.barcode, p.minQuantity])
    );
    name = `products-${stamp}.csv`;
  } else if (type === "customers") {
    const list = await prisma.customer.findMany({ orderBy: { name: "asc" } });
    csv = toCSV(
      ["الاسم", "الهاتف", "العنوان", "السقف", "المستحق"],
      list.map((c) => [c.name, c.phone, c.address, c.creditLimit, c.balance])
    );
    name = `customers-${stamp}.csv`;
  } else if (type === "stock") {
    const list = await prisma.stockMove.findMany({
      orderBy: { date: "desc" },
      take: 2000,
      include: { product: true },
    });
    csv = toCSV(
      ["التاريخ", "الصنف", "SKU", "النوع", "الكمية", "ملاحظة"],
      list.map((m) => [m.date.toISOString().slice(0, 16).replace("T", " "), m.product?.name || "", m.product?.sku || "", m.type, m.qty, m.note])
    );
    name = `stock-${stamp}.csv`;
  } else {
    const list = await prisma.sale.findMany({
      orderBy: { date: "desc" },
      take: 2000,
      include: { customer: true, items: true },
    });
    csv = toCSV(
      ["الرقم", "التاريخ", "الزبون", "الحالة", "الدفع", "الفرعي", "الخصم", "الإجمالي", "المدفوع", "الأصناف"],
      list.map((s) => [
        s.no, s.date.toISOString().slice(0, 16).replace("T", " "), s.customer?.name || "",
        s.status, s.payMethod, s.subtotal, s.discount, s.total, s.paid,
        s.items.reduce((n, it) => n + it.qty, 0),
      ])
    );
    name = `sales-${stamp}.csv`;
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
