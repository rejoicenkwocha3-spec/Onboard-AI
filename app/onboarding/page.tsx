import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Set up your organization | Onboard AI" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  const { data: org } = await supabase
    .from("organizations").select("name").limit(1).maybeSingle();

  return (
    <AuthShell title="Your account is ready" subtitle="The guided organization setup is the next milestone.">
      <p className="text-sm text-ink-muted">
        {org ? <>Workspace created: <strong className="text-ink">{org.name}</strong>.</> : "Your workspace is being prepared."}
      </p>
      <Link href="/dashboard" className="mt-6 block rounded-lg bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white">
        Continue to dashboard
      </Link>
    </AuthShell>
  );
}
