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

export async function requireRoles(roles: string[]) {
  const user = await currentUser();
  if (!user || !user.active) return null;
  if (!roles.includes(user.role)) return null;
  return user;
}
