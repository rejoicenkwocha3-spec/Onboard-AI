"use server";

import { revalidatePath } from "next/cache";
import { getCtx } from "@/lib/ctx";
import { audit, back, dbError, needWrite, s } from "@/lib/forms";

const P = "/dashboard/career-pages";

export async function saveCareerPage(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const slug = s(fd, "slug").toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,48}$/.test(slug)) back(P, { error: "The web address must be 2 to 49 characters: lowercase letters, numbers and hyphens." });
  const color = s(fd, "brand_color") || "#2563EB";
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) back(P, { error: "Choose a valid brand color." });
  const { error } = await ctx.supabase.from("oa_career_pages").upsert({
    organization_id: ctx.orgId, slug, headline: s(fd, "headline"), description: s(fd, "description"),
    brand_color: color, published: fd.get("published") === "on",
  }, { onConflict: "organization_id" });
  if (error) {
    if (error.code === "23505") back(P, { error: "That web address is already taken. Choose another." });
    dbError(P, "save the career page", error);
  }
  await audit(ctx, "careerpage.saved", "career_page", null, slug);
  revalidatePath(P);
  back(P, { notice: "Career page saved." });
}
