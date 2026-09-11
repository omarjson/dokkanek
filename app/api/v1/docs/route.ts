import { NextResponse } from "next/server";

// وثيقة الـ API العام — عامة للاطلاع (المفتاح يُطلب عند الاستدعاء الفعلي)
export async function GET() {
  return NextResponse.json({
    name: "Dokkanek API v1",
    auth: "ترويسة x-api-key بمفتاح يُولَّد من صفحة المطورين",
    base: "/api/v1",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/products?q=",
        desc: "قائمة الأصناف النشطة (بحث اختياري بالاسم/SKU/باركود)",
      },
      {
        method: "POST",
        path: "/api/v1/sales",
        desc: "إنشاء فاتورة — نفس منطق نقطة البيع (مخزون/ديون/توصيل)",
        body: {
          items: [{ productId: "…", qty: 1, price: 100 }],
          payMethod: "CASH|CARD|TRANSFER|CREDIT",
          status: "COMPLETED|PENDING|HELD|COURIER",
          discount: 0,
          customerId: "…|null",
          courierName: "…",
        },
      },
      { method: "GET", path: "/api/track/[no]", desc: "حالة تذكرة صيانة (عام، بدون مفتاح)" },
    ],
  });
}
