import { createHash } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";

export function hashPassword(password: string): string {
  return createHash("sha256").update(`dokkanek:${password}`).digest("hex");
}

export async function currentUser() {
  const id = cookies().get("dk_session")?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id }, include: { branch: true } });
}

export const ROLES: Record<string, string> = {
  ADMIN: "مدير النظام",
  MANAGER: "مدير فرع",
  CASHIER: "كاشير",
  COURIER: "مندوب توصيل",
  TECHNICIAN: "فني صيانة",
};
