import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles, ADMIN_ROLES } from "@/lib/auth";
import { audit } from "@/lib/audit";

type Row = {
  sku?: string; name?: string; salePrice?: string | number; costPrice?: string | number;
  quantity?: string | number; barcode?: string; minQuantity?: string | number;
  category?: string; legacyNo?: string;
};

// استيراد أصناف من CSV (Excel يحفظ CSV UTF-8): إنشاء الجديد وتحديث الموجود حسب SKU
export async function POST(req: Request) {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) return NextResponse.json({ error: "غير مصرح — الاستيراد للإدارة فقط" }, { status: 403 });
  const { rows } = (await req.json().catch(() => ({}))) as { rows?: Row[] };
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 2000) {
    return NextResponse.json({ error: "الملف فارغ أو كبير جدا (الحد 2000 سطر)" }, { status: 400 });
  }
  let created = 0;
  let updated = 0;
  const errors: { line: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || {};
    const line = i + 1;
    try {
      const name = String(r.name || "").trim();
      const salePrice = Number(r.salePrice);
      if (!name || isNaN(salePrice) || salePrice < 0) {
        errors.push({ line, error: "الاسم وسعر البيع مطلوبان" });
        continue;
      }
      let categoryId: string | null = null;
      const cat = String(r.category || "").trim();
      if (cat) {
        const c = await prisma.category.upsert({ where: { name: cat }, update: {}, create: { name: cat } });
        categoryId = c.id;
      }
      const qty = Number(r.quantity || 0);
      const base = {
        name,
        salePrice,
        costPrice: Number(r.costPrice || 0),
        barcode: String(r.barcode || ""),
        minQuantity: Number(r.minQuantity ?? 5),
        legacyNo: String(r.legacyNo || ""),
        categoryId,
        active: true,
      };
      const sku = String(r.sku || "").trim();
      if (sku) {
        const old = await prisma.product.findUnique({ where: { sku } });
        if (old) {
          await prisma.product.update({ where: { sku }, data: { ...base, quantity: qty } });
          if (qty !== old.quantity) {
            await prisma.stockMove.create({
              data: { productId: old.id, qty: qty - old.quantity, type: "ADJUST", note: "استيراد ملف", userId: me.id },
            });
          }
          updated++;
          continue;
        }
        const p = await prisma.product.create({ data: { ...base, sku, quantity: qty } });
        await prisma.stockMove.create({ data: { productId: p.id, qty, type: "IN", note: "استيراد ملف", userId: me.id } });
        created++;
      } else {
        const gen = `IMP-${Date.now().toString(36).toUpperCase()}-${line}`;
        const p = await prisma.product.create({ data: { ...base, sku: gen, quantity: qty } });
        await prisma.stockMove.create({ data: { productId: p.id, qty, type: "IN", note: "استيراد ملف", userId: me.id } });
        created++;
      }
    } catch {
      errors.push({ line, error: "تعذر حفظ السطر" });
    }
  }
  await audit("IMPORT", "Product", "", `استيراد ملف: جديد ${created} / محدث ${updated} / أخطاء ${errors.length}`, me.name, me.id);
  return NextResponse.json({ ok: true, created, updated, errors });
}

// قالب CSV جاهز بالعربية (Excel يفتحه مباشرة)
export async function GET() {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const csv =
    "sku,name,salePrice,costPrice,quantity,barcode,minQuantity,category,legacyNo\n" +
    ",سماعات بلوتوث,95,55,20,200001,5,إكسسوارات,\n" +
    "AC-002,شاحن سريع 25W,55,28,60,200002,15,إكسسوارات,قديم-12\n";
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=dokkanek-template.csv",
    },
  });
}
