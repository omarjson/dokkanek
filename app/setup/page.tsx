import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SetupClient } from "./SetupClient";

export default async function SetupPage() {
  const admins = await prisma.user.count({ where: { role: "ADMIN", active: true } }).catch(() => 1);
  if (admins > 0) redirect("/");
  return <SetupClient />;
}
