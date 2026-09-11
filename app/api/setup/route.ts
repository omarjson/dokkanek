import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { PRESETS } from "@/lib/modules";

// معالج التثبيت الأول: يعمل فقط عندما لا يوجد أي مدير في القاعدة
// { store_name, phone, address, currency, store_type, primary_color, admin_name, admin_username, admin_password, clean }
export async function POST(req: Request) {
  const admins = await prisma.user.count({ where: { role: "ADMIN", active: true } });
  if (admins > 0) {
    return NextResponse.json({ error: "المنظومة مثبتة already — سجل الدخول كمدير" }, { status: 403 });
  }
  const b = await req.json().catch(() => ({}));
  const storeName = String(b.store_name || "").trim();
  const username = String(b.admin_username || "").trim();
  const password = String(b.admin_password || "");
  if (!storeName || !username || password.length < 4) {
    return NextResponse.json({ error: "اسم المتجر وبيانات المدير (كلمة 4+ أحرف) مطلوبة" }, { status: 400 });
  }

  if (b.clean) {
    // بداية نظيفة: مسح كل البيانات التشغيلية بالترتيب الصحيح
    await prisma.notification.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.stocktakeItem.deleteMany({});
    await prisma.stocktake.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.courierTask.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.saleItem.deleteMany({});
    await prisma.sale.deleteMany({});
    await prisma.purchaseItem.deleteMany({});
    await prisma.purchase.deleteMany({});
    await prisma.return.deleteMany({});
    await prisma.damage.deleteMany({});
    await prisma.stockMove.deleteMany({});
    await prisma.ticketPart.deleteMany({});
    await prisma.maintenanceTicket.deleteMany({});
    await prisma.expense.deleteMany({});
    await prisma.cashShift.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.supplier.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.warehouse.deleteMany({});
    await prisma.branch.deleteMany({});
    await prisma.user.deleteMany({});
  }

  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({ data: { name: "الفرع الرئيسي", city: "", phone: String(b.phone || "") } });
  }
  let warehouse = await prisma.warehouse.findFirst();
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({ data: { name: "المخزن الرئيسي", branchId: branch.id } });
  }

  const settings: Record<string, string> = {
    store_name: storeName,
    logo_text: storeName,
    primary_color: String(b.primary_color || "#0d6efd"),
    phone: String(b.phone || ""),
    address: String(b.address || ""),
    currency: String(b.currency || "د.ل"),
    footer_note: "شكرا لتسوقكم معنا",
    store_type: String(b.store_type || "general"),
  };
  const off = new Set(PRESETS[settings.store_type]?.off || []);
  for (const m of ["maintenance", "delivery", "suppliers", "employees", "expenses", "returns", "shifts", "reports", "developers", "notifications", "import", "stocktake"]) {
    settings[`mod_${m}`] = off.has(m) ? "0" : "1";
  }
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  const admin = await prisma.user.create({
    data: {
      name: String(b.admin_name || "مدير النظام"),
      username,
      passwordHash: hashPassword(password),
      role: "ADMIN",
      branchId: branch.id,
    },
  });
  await audit("CREATE", "User", admin.id, `تثبيت المنظومة وإنشاء المدير ${username}`, admin.name, admin.id);

  const res = NextResponse.json({ ok: true, name: admin.name });
  res.cookies.set("dk_session", admin.id, { httpOnly: true, path: "/", maxAge: 60 * 60 * 12, sameSite: "lax" });
  return res;
}

export async function GET() {
  const admins = await prisma.user.count({ where: { role: "ADMIN", active: true } });
  return NextResponse.json({ installed: admins > 0 });
}
