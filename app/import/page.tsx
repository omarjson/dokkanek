export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { requireRoles } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/format";
import { isModuleEnabled } from "@/lib/modules";
import { PageTitle } from "@/components/ui";
import { ImportClient } from "./ImportClient";

export default async function ImportPage() {
  const modOk = await isModuleEnabled("import");
  if (!modOk) redirect("/");
  const me = await requireRoles(ADMIN_ROLES);
  if (!me) redirect("/");
  return (
    <div>
      <PageTitle title="استيراد الأصناف" sub="من Excel عبر CSV — مجاني وبدون حدود" />
      <ImportClient />
    </div>
  );
}
