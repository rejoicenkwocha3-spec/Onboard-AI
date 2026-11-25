import { Shell } from "@/components/dashboard/Shell";
import { getCtx } from "@/lib/ctx";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCtx();
  return (
    <Shell orgName={ctx.orgName} userName={ctx.fullName} email={ctx.user.email ?? ""}>
      {children}
    </Shell>
  );
}
