"use server";

import { revalidatePath } from "next/cache";
import { getCtx } from "@/lib/ctx";
import { audit, back, dbError, n, needWrite, s } from "@/lib/forms";

const P = "/dashboard/interviews";

export async function scheduleInterview(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const when = s(fd, "scheduled_at"), candidate = s(fd, "candidate_id");
  if (!candidate) back(P, { error: "Choose a candidate." });
  if (!when || Number.isNaN(Date.parse(when))) back(P, { error: "Choose a valid date and time." });
  const { data: c } = await ctx.supabase.from("oa_candidates").select("job_id, full_name").eq("id", candidate).maybeSingle();
  const { data, error } = await ctx.supabase.from("oa_interviews").insert({
    organization_id: ctx.orgId, candidate_id: candidate, job_id: c?.job_id ?? null, scheduled_at: new Date(when).toISOString(),
    duration_minutes: Math.min(Math.max(n(fd, "duration_minutes") ?? 30, 5), 480), interviewer: s(fd, "interviewer") || null,
    location: s(fd, "location") || null, created_by: ctx.user.id,
  }).select("id").single();
  if (error) dbError(P, "schedule the interview", error);
  await ctx.supabase.from("oa_candidate_events").insert({ organization_id: ctx.orgId, candidate_id: candidate, actor_id: ctx.user.id, type: "interview", detail: "Interview scheduled" });
  await audit(ctx, "interview.scheduled", "interview", data.id, c?.full_name);
  revalidatePath(P);
  back(P, { notice: "Interview scheduled." });
}

export async function updateInterview(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const id = s(fd, "id"), status = s(fd, "status"), when = s(fd, "scheduled_at");
  const patch: Record<string, unknown> = {};
  if (status) {
    if (!["scheduled", "completed", "cancelled", "no_show"].includes(status)) back(P, { error: "Unknown status." });
    patch.status = status;
  }
  if (when) {
    if (Number.isNaN(Date.parse(when))) back(P, { error: "Choose a valid date and time." });
    patch.scheduled_at = new Date(when).toISOString();
    patch.status = "scheduled";
  }
  const { error } = await ctx.supabase.from("oa_interviews").update(patch).eq("id", id);
  if (error) dbError(P, "update the interview", error);
  await audit(ctx, when ? "interview.rescheduled" : `interview.${status}`, "interview", id);
  revalidatePath(P);
  back(P, { notice: when ? "Interview rescheduled." : "Interview updated." });
}
