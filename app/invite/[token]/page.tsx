import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SubmitButton } from "@/components/auth/fields";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite } from "./actions";

export const metadata = { title: "Join your team | Onboard AI" };

export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!user) redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  return (
    <AuthShell title="Join your team" subtitle={`You are signed in as ${user.email}.`}>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
      <form action={acceptInvite}><input type="hidden" name="token" value={token} /><SubmitButton>Accept invitation</SubmitButton></form>
      <p className="mt-4 text-xs text-ink-muted">The invitation must have been sent to {user.email}. If not, log out and sign in with the invited address.</p>
    </AuthShell>
  );
}
