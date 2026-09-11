export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { StickersClient } from "./StickersClient";

export default async function StickersPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    take: 500,
  });
  return <StickersClient products={products} />;
}
