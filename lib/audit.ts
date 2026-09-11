import { prisma } from "./db";

export async function audit(
  action: string,
  entity: string,
  entityId = "",
  details = "",
  username = "",
  userId?: string
) {
  try {
    await prisma.auditLog.create({
      data: { action, entity, entityId, details, username, userId },
    });
  } catch {
    // لا نكسر العملية الأساسية لو فشل السجل
  }
}
