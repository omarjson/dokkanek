import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { cookies } from "next/headers";

async function who() {
  const id = cookies().get("dk_session")?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function GET() {
  return NextResponse.json(await prisma.customer.findMany({ orderBy: { name: "asc" } }));
}

export async function POST(req: Request) {
  const me = await who();
  const b = await req.json();
  if (!b.name) return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
  const c = await prisma.customer.create({
    data: {
      name: String(b.name),
      phone: String(b.phone || ""),
      address: String(b.address || ""),
      creditLimit: Number(b.creditLimit || 0),
    },
  });
  await audit("CREATE", "Customer", c.id, `إضافة زبون ${c.name}`, me?.name, me?.id);
  return NextResponse.json(c);
}
