import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard | Onboard AI" };

export default async function DashboardPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  await supabase.rpc("oa_ensure_my_account");
  const { data: profile } = await supabase.from("oa_profiles").select("full_name").eq("id", user.id).maybeSingle();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-navy">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <form action="/auth/signout" method="post">
          <button className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-surface">
            Log out
          </button>
        </form>
      </div>
      <p className="mt-2 text-sm text-ink-muted">Signed in as {user.email}.</p>
    </main>
  );
}
