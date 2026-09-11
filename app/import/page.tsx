export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { requireRoles, ADMIN_ROLES } from "@/lib/auth";
import { PageTitle } from "@/components/ui";
import { ImportClient } from "./ImportClient";

export default async function ImportPage() {
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) redirect("/");
  return (
    <div>
      <PageTitle title="استيراد الأصناف" sub="من Excel عبر CSV — مجاني وبدون حدود" />
      <ImportClient />
    </div>
  );
}
