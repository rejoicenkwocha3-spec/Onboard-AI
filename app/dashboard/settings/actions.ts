"use server";

import { revalidatePath } from "next/cache";
import { getCtx } from "@/lib/ctx";
import { audit, back, dbError, needAdmin, s } from "@/lib/forms";

const P = "/dashboard/settings";

export async function saveOrganization(fd: FormData) {
  const ctx = await getCtx();
  needAdmin(ctx, P);
  const name = s(fd, "name");
  if (name.length < 2) back(P, { error: "Enter your company name." });
  let website = s(fd, "website");
  if (website && !/^https?:\/\//i.test(website)) website = "https://" + website;
  if (website) { try { new URL(website); } catch { back(P, { error: "Enter a valid website address." }); } }
  const { error } = await ctx.supabase.from("oa_organizations").update({
    name, website: website || null, industry: s(fd, "industry") || null, company_size: s(fd, "company_size") || null,
    hiring_volume: s(fd, "hiring_volume") || null, recruitment_team_size: s(fd, "recruitment_team_size") || null,
  }).eq("id", ctx.orgId);
  if (error) dbError(P, "save the organization", error);
  await audit(ctx, "organization.updated", "organization", ctx.orgId, name);
  revalidatePath("/dashboard", "layout");
  back(P, { notice: "Organization saved." });
}

export async function saveProfile(fd: FormData) {
  const ctx = await getCtx();
  const name = s(fd, "full_name");
  if (name.length < 2) back(P, { error: "Enter your name." });
  const { error } = await ctx.supabase.from("oa_profiles").update({ full_name: name }).eq("id", ctx.user.id);
  if (error) dbError(P, "save your profile", error);
  revalidatePath("/dashboard", "layout");
  back(P, { notice: "Profile saved." });
}
