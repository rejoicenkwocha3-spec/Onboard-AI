import type { SupabaseClient, User } from "@supabase/supabase-js";

export type Account = {
  fullName: string;
  orgName: string | null;
  /** Set when the workspace could not be created or read; shown to the user and logged. */
  problem: string | null;
};

/** Ensures the signed in user has an Onboard AI profile, organization and workspace, then loads them. */
export async function loadAccount(supabase: SupabaseClient, user: User): Promise<Account> {
  const metaName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";

  const ensure = await supabase.rpc("oa_ensure_my_account");
  if (ensure.error) console.error("[account] oa_ensure_my_account failed:", ensure.error.code, ensure.error.message);

  const [profile, org] = await Promise.all([
    supabase.from("oa_profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("oa_organizations").select("name").limit(1).maybeSingle(),
  ]);
  if (profile.error) console.error("[account] profile read failed:", profile.error.code, profile.error.message);
  if (org.error) console.error("[account] organization read failed:", org.error.code, org.error.message);

  const problem = ensure.error
    ? `Workspace setup failed (${ensure.error.code ?? "error"}: ${ensure.error.message}).`
    : !profile.data
      ? "Your workspace profile was not found. Check that the database migration has been run."
      : null;

  return {
    fullName: profile.data?.full_name || metaName,
    orgName: org.data?.name ?? null,
    problem,
  };
}
