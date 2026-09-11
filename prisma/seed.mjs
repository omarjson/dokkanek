import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();
const H = (p) => createHash("sha256").update(`dokkanek:${p}`).digest("hex");
const daysAgo = (n) => new Date(Date.now() - n * 86400000);

async function main() {
  // الإعدادات
  const settings = {
    store_name: "دكّانك",
    logo_text: "دكّانك",
    primary_color: "#0d6efd",
    phone: "0910000000",
    address: "طرابلس — ليبيا",
    footer_note: "شكرا لتسوقكم معنا",
    currency: "د.ل",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  // الفروع والمخازن
  const b1 = await prisma.branch.upsert({
    where: { id: "seed-branch-tripoli" },
    update: {},
    create: { id: "seed-branch-tripoli", name: "الفرع الرئيسي", city: "طرابلس", phone: "0910000001" },
  });
  const b2 = await prisma.branch.upsert({
    where: { id: "seed-branch-benghazi" },
    update: {},
    create: { id: "seed-branch-benghazi", name: "فرع بنغازي", city: "بنغازي", phone: "0920000002" },
  });
  const w1 = await prisma.warehouse.upsert({
    where: { id: "seed-wh-main" },
    update: {},
    create: { id: "seed-wh-main", name: "المخزن الرئيسي", branchId: b1.id },
  });

  // المستخدمون (كلمات المرور للتجربة فقط)
  const users = [
    { username: "admin", name: "مدير النظام", role: "ADMIN", password: "admin123", branchId: b1.id },
    { username: "cashier", name: "أحمد الكاشير", role: "CASHIER", password: "1234", branchId: b1.id },
    { username: "courier", name: "سالم المندوب", role: "COURIER", password: "1234", branchId: b1.id },
    { username: "tech", name: "مفتاح الفني", role: "TECHNICIAN", password: "1234", branchId: b1.id },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { passwordHash: H(u.password), role: u.role, name: u.name, active: true },
      create: { username: u.username, name: u.name, role: u.role, passwordHash: H(u.password), branchId: u.branchId },
    });
  }

  // التصنيفات
  const catNames = ["هواتف", "إكسسوارات", "قطع غيار صيانة", "أجهزة لوحية"];
  const cats = {};
  for (const n of catNames) {
    const c = await prisma.category.upsert({ where: { name: n }, update: {}, create: { name: n } });
    cats[n] = c.id;
  }

  // أصناف وهمية (أسماء عامة بدون علامات تجارية)
  const products = [
    { sku: "PH-001", name: "هاتف ذكي فئة اقتصادية 128GB", cat: "هواتف", cost: 780, price: 950, qty: 12, fav: true, min: 3, barcode: "100001" },
    { sku: "PH-002", name: "هاتف ذكي فئة متوسطة 256GB", cat: "هواتف", cost: 1450, price: 1720, qty: 7, fav: true, min: 2, barcode: "100002" },
    { sku: "PH-003", name: "هاتف مستعمل مجدد — حالة ممتازة", cat: "هواتف", cost: 420, price: 550, qty: 4, fav: false, min: 2, barcode: "100003" },
    { sku: "TB-001", name: "جهاز لوحي 10 بوصة 64GB", cat: "أجهزة لوحية", cost: 620, price: 790, qty: 6, fav: false, min: 2, barcode: "100004" },
    { sku: "AC-001", name: "سماعات بلوتوث لاسلكية", cat: "إكسسوارات", cost: 55, price: 95, qty: 40, fav: true, min: 10, barcode: "100005" },
    { sku: "AC-002", name: "شاحن سريع 25W مع كابل", cat: "إكسسوارات", cost: 28, price: 55, qty: 60, fav: true, min: 15, barcode: "100006" },
    { sku: "AC-003", name: "جراب حماية شفاف", cat: "إكسسوارات", cost: 6, price: 20, qty: 120, fav: false, min: 30, barcode: "100007" },
    { sku: "AC-004", name: "لاصق حماية شاشة مقوى", cat: "إكسسوارات", cost: 4, price: 15, qty: 200, fav: false, min: 50, barcode: "100008" },
    { sku: "AC-005", name: "باور بانك 20000mAh", cat: "إكسسوارات", cost: 85, price: 140, qty: 18, fav: true, min: 5, barcode: "100009" },
    { sku: "AC-006", name: "ساعة ذكية رياضية", cat: "إكسسوارات", cost: 130, price: 210, qty: 9, fav: false, min: 3, barcode: "100010" },
    { sku: "AC-007", name: "كابل شحن سريع Type-C متر ونص", cat: "إكسسوارات", cost: 9, price: 25, qty: 3, fav: false, min: 10, barcode: "100011" },
    { sku: "SP-001", name: "شاشة بديلة أصلية — فئة متوسطة", cat: "قطع غيار صيانة", cost: 160, price: 230, qty: 8, fav: false, min: 3, barcode: "100012" },
    { sku: "SP-002", name: "بطارية بديلة عالية السعة", cat: "قطع غيار صيانة", cost: 45, price: 80, qty: 15, fav: false, min: 5, barcode: "100013" },
    { sku: "SP-003", name: "قاعدة شحن وكاوية صيانة", cat: "قطع غيار صيانة", cost: 90, price: 150, qty: 2, fav: false, min: 2, barcode: "100014" },
  ];
  const prodIds = {};
  for (const p of products) {
    const r = await prisma.product.upsert({
      where: { sku: p.sku },
      update: { name: p.name, costPrice: p.cost, salePrice: p.price, quantity: p.qty, isFavorite: p.fav, minQuantity: p.min, barcode: p.barcode, categoryId: cats[p.cat], warehouseId: w1.id, active: true },
      create: { sku: p.sku, name: p.name, costPrice: p.cost, salePrice: p.price, quantity: p.qty, isFavorite: p.fav, minQuantity: p.min, barcode: p.barcode, categoryId: cats[p.cat], warehouseId: w1.id },
    });
    prodIds[p.sku] = r.id;
  }

  // زبائن وموردون
  const custNames = [
    { name: "محمد الفيتوري", phone: "0911111111", limit: 2000 },
    { name: "عائشة بن عامر", phone: "0922222222", limit: 1000 },
    { name: "خالد المصراتي", phone: "0933333333", limit: 5000 },
    { name: "فاطمة الزهراء", phone: "0944444444", limit: 500 },
    { name: "زبون نقدي", phone: "", limit: 0 },
  ];
  const custIds = [];
  for (const c of custNames) {
    const r = await prisma.customer.upsert({
      where: { id: `seed-cust-${c.phone || "cash"}` },
      update: {},
      create: { id: `seed-cust-${c.phone || "cash"}`, name: c.name, phone: c.phone, creditLimit: c.limit },
    });
    custIds.push(r.id);
  }
  const supNames = ["شركة النور للتوريدات", "مؤسسة الأفق للإلكترونيات", "مخازن الاتحاد"];
  const supIds = [];
  for (let i = 0; i < supNames.length; i++) {
    const r = await prisma.supplier.upsert({
      where: { id: `seed-sup-${i}` },
      update: {},
      create: { id: `seed-sup-${i}`, name: supNames[i], phone: `095000000${i}` },
    });
    supIds.push(r.id);
  }

  // فواتير بيع وهمية
  const cashier = await prisma.user.findUnique({ where: { username: "cashier" } });
  const saleSeeds = [
    { no: "S-DEMO-001", ago: 0, status: "COMPLETED", pay: "CASH", items: [["AC-001", 2], ["AC-003", 3]], cust: 4 },
    { no: "S-DEMO-002", ago: 0, status: "PENDING", pay: "CASH", items: [["PH-001", 1]], cust: 0 },
    { no: "S-DEMO-003", ago: 1, status: "COMPLETED", pay: "CARD", items: [["AC-005", 1], ["AC-002", 2]], cust: 4 },
    { no: "S-DEMO-004", ago: 1, status: "COURIER", pay: "CASH", items: [["AC-006", 1]], cust: 1 },
    { no: "S-DEMO-005", ago: 2, status: "COMPLETED", pay: "CREDIT", items: [["PH-002", 1]], cust: 2 },
    { no: "S-DEMO-006", ago: 3, status: "COMPLETED", pay: "CASH", items: [["AC-004", 5], ["AC-007", 2]], cust: 4 },
  ];
  for (const s of saleSeeds) {
    const exists = await prisma.sale.findUnique({ where: { no: s.no } });
    if (exists) continue;
    let subtotal = 0;
    for (const [sku, qty] of s.items) {
      const p = await prisma.product.findUnique({ where: { sku } });
      if (p) subtotal += p.salePrice * qty;
    }
    const paid = s.pay === "CREDIT" ? 0 : subtotal;
    const sale = await prisma.sale.create({
      data: {
        no: s.no, branchId: b1.id, customerId: custIds[s.cust], cashierId: cashier?.id,
        status: s.status, payMethod: s.pay, subtotal, discount: 0, total: subtotal, paid,
        date: daysAgo(s.ago),
      },
    });
    for (const [sku, qty] of s.items) {
      const p = await prisma.product.findUnique({ where: { sku } });
      if (!p) continue;
      await prisma.saleItem.create({ data: { saleId: sale.id, productId: p.id, qty, price: p.salePrice } });
      if (s.status === "COMPLETED" || s.status === "COURIER") {
        await prisma.product.update({ where: { id: p.id }, data: { quantity: Math.max(0, p.quantity - qty) } });
        await prisma.stockMove.create({ data: { productId: p.id, qty: -qty, type: "OUT", note: `فاتورة ${s.no}` } });
      }
    }
    if (s.pay !== "CREDIT") {
      await prisma.payment.create({ data: { saleId: sale.id, customerId: custIds[s.cust], amount: paid, method: s.pay } });
    } else {
      await prisma.customer.update({ where: { id: custIds[s.cust] }, data: { balance: { increment: subtotal } } });
    }
    if (s.status === "COURIER") {
      await prisma.courierTask.create({ data: { saleId: sale.id, courierName: "سالم المندوب", status: "WITH_COURIER", codAmount: subtotal } });
    }
  }

  // مصروفات وتذاكر صيانة وموظفون
  await prisma.expense.deleteMany({});
  await prisma.expense.createMany({
    data: [
      { branchId: b1.id, title: "إيجار المحل", amount: 2500, date: daysAgo(2) },
      { branchId: b1.id, title: "كهرباء وإنترنت", amount: 320, date: daysAgo(1) },
      { branchId: b1.id, title: "مواصلات المندوب", amount: 150, date: daysAgo(0) },
    ],
  });

  const tickets = [
    { no: "T-001", name: "عبد الله الحاسي", phone: "0915555555", device: "هاتف — كسر شاشة", status: "DIAGNOSIS", tech: "مفتاح الفني", cost: 180 },
    { no: "T-002", name: "مريم القذافي", phone: "0926666666", device: "هاتف — بطارية", status: "READY", tech: "مفتاح الفني", cost: 90 },
    { no: "T-003", name: "يوسف الديب", phone: "0937777777", device: "جهاز لوحي — سوكت شحن", status: "RECEIVED", tech: "", cost: 0 },
  ];
  for (const t of tickets) {
    await prisma.maintenanceTicket.upsert({
      where: { no: t.no },
      update: {},
      create: { no: t.no, customerName: t.name, customerPhone: t.phone, device: t.device, status: t.status, technician: t.tech, cost: t.cost, receivedAt: daysAgo(1) },
    });
  }

  for (const e of [
    { id: "seed-emp-1", name: "أحمد الكاشير", title: "كاشير", salary: 1500 },
    { id: "seed-emp-2", name: "سالم المندوب", title: "مندوب توصيل", salary: 1200 },
  ]) {
    await prisma.employee.upsert({ where: { id: e.id }, update: {}, create: e });
  }

  await prisma.auditLog.create({
    data: { username: "النظام", action: "SEED", entity: "Database", details: "تحميل بيانات تجريبية" },
  });

  console.log("Seed OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
