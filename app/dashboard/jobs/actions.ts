"use server";

import { revalidatePath } from "next/cache";
import { getCtx } from "@/lib/ctx";
import { audit, back, dbError, n, needWrite, s } from "@/lib/forms";

const P = "/dashboard/jobs";

export async function saveJob(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const id = s(fd, "id");
  const title = s(fd, "title");
  if (title.length < 2) back(P, { error: "Enter a job title." });
  const min = n(fd, "salary_min"), max = n(fd, "salary_max");
  if (min !== null && max !== null && min > max) back(P, { error: "Minimum salary cannot exceed maximum salary." });
  const row = {
    title, department: s(fd, "department") || null, location: s(fd, "location") || null,
    employment_type: s(fd, "employment_type") || "full_time", salary_min: min, salary_max: max,
    salary_currency: (s(fd, "salary_currency") || "USD").toUpperCase().slice(0, 3),
    description: s(fd, "description") || null, requirements: s(fd, "requirements") || null,
    qualifications: s(fd, "qualifications") || null,
  };
  if (id) {
    const { error } = await ctx.supabase.from("oa_jobs").update(row).eq("id", id);
    if (error) dbError(P, "update the job", error);
    await audit(ctx, "job.updated", "job", id, title);
  } else {
    const { data, error } = await ctx.supabase.from("oa_jobs")
      .insert({ ...row, organization_id: ctx.orgId, created_by: ctx.user.id }).select("id").single();
    if (error) dbError(P, "create the job", error);
    await audit(ctx, "job.created", "job", data.id, title);
  }
  revalidatePath(P);
  back(P, { notice: id ? "Job updated." : "Job created as a draft. Publish it when it is ready." });
}

export async function setJobStatus(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const id = s(fd, "id"), status = s(fd, "status");
  if (!["draft", "published", "paused", "archived"].includes(status)) back(P, { error: "Unknown status." });
  const { error } = await ctx.supabase.from("oa_jobs").update({ status }).eq("id", id);
  if (error) dbError(P, "change the job status", error);
  await audit(ctx, `job.${status}`, "job", id);
  revalidatePath(P);
  back(P, { notice: `Job ${status === "published" ? "published" : status}.` });
}
