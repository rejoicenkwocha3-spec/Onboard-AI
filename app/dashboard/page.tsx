import { redirect } from "next/navigation";
import { Logo } from "@/components/auth/AuthShell";
import { loadAccount } from "@/lib/account";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard | Onboard AI" };

export default async function DashboardPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const account = await loadAccount(supabase, user);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8"><Logo /></div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-navy">
          Welcome{account.fullName ? `, ${account.fullName}` : ""}
        </h1>
        <form action="/auth/signout" method="post">
          <button className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-surface">
            Log out
          </button>
        </form>
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        Signed in as {user.email}.{account.orgName ? ` Workspace: ${account.orgName}.` : ""}
      </p>
      {account.problem && (
        <div role="alert" className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {account.problem}
        </div>
      )}
    </main>
  );
}
