import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type Role = "owner" | "admin" | "hr_manager" | "hiring_manager" | "recruiter" | "employee";

export type Ctx = {
  supabase: SupabaseClient;
  user: User;
  orgId: string;
  orgName: string;
  role: Role;
  fullName: string;
  /** owner, admin, hr_manager, recruiter: matches the database write policy */
  canWrite: boolean;
  isAdmin: boolean;
};

/** Authenticated request context for dashboard pages and actions. Redirects when signed out. */
export const getCtx = cache(async (): Promise<Ctx> => {
  const supabase = await createClient();
  if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const load = () =>
    supabase.from("oa_organization_members").select("organization_id, role")
      .eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();

  let { data: m } = await load();
  if (!m) {
    const r = await supabase.rpc("oa_ensure_my_account");
    if (r.error) console.error("[ctx] oa_ensure_my_account failed:", r.error.code, r.error.message);
    ({ data: m } = await load());
  }
  if (!m) redirect("/login?error=" + encodeURIComponent("Your workspace could not be loaded. Check the database migrations."));

  const [{ data: org }, { data: profile }] = await Promise.all([
    supabase.from("oa_organizations").select("name").eq("id", m.organization_id).maybeSingle(),
    supabase.from("oa_profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);
  const role = m.role as Role;
  return {
    supabase, user, orgId: m.organization_id, orgName: org?.name ?? "Your organization", role,
    fullName: profile?.full_name || (user.user_metadata?.full_name as string) || user.email || "",
    canWrite: ["owner", "admin", "hr_manager", "recruiter"].includes(role),
    isAdmin: ["owner", "admin"].includes(role),
  };
});
