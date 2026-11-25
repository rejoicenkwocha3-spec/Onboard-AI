"use server";

import { getCtx } from "@/lib/ctx";
import { audit, back, s } from "@/lib/forms";

const P = "/onboarding";

export async function completeSetup(fd: FormData) {
  const ctx = await getCtx();
  if (!ctx.isAdmin) back(P, { error: "Only the organization owner or an admin can complete setup." });
  const name = s(fd, "name");
  if (name.length < 2) back(P, { error: "Enter your company name." });
  let website = s(fd, "website");
  if (website && !/^https?:\/\//i.test(website)) website = "https://" + website;
  if (website) { try { new URL(website); } catch { back(P, { error: "Enter a valid website address." }); } }
  const { error } = await ctx.supabase.from("oa_organizations").update({
    name, website: website || null, industry: s(fd, "industry") || null, company_size: s(fd, "company_size") || null,
    hiring_volume: s(fd, "hiring_volume") || null, recruitment_team_size: s(fd, "recruitment_team_size") || null,
    challenges: fd.getAll("challenges").map(String), preferred_channels: fd.getAll("channels").map(String),
    onboarding_completed_at: new Date().toISOString(),
  }).eq("id", ctx.orgId);
  if (error) { console.error("[setup]", error.code, error.message); back(P, { error: "Could not save your company details. Please try again." }); }

  const first = s(fd, "first"), label = s(fd, "first_name");
  if (first === "job" && label.length >= 2) {
    const { error: e } = await ctx.supabase.from("oa_jobs").insert({ organization_id: ctx.orgId, title: label, created_by: ctx.user.id });
    if (e) console.error("[setup:job]", e.code, e.message);
  } else if (first === "assistant" && label.length >= 2) {
    const { error: e } = await ctx.supabase.from("oa_agents").insert({ organization_id: ctx.orgId, name: label });
    if (e) console.error("[setup:agent]", e.code, e.message);
  }
  await audit(ctx, "organization.setup_completed", "organization", ctx.orgId, name);
  back(first === "job" && label ? "/dashboard/jobs" : first === "assistant" && label ? "/dashboard/assistant" : "/dashboard", { notice: "Setup complete. Welcome to Onboard AI." });
}
