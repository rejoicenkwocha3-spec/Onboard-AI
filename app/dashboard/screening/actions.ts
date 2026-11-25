"use server";

import { revalidatePath } from "next/cache";
import { getCtx } from "@/lib/ctx";
import { back, dbError, needWrite, s } from "@/lib/forms";

export async function addQuestion(fd: FormData) {
  const ctx = await getCtx();
  const job = s(fd, "job_id"), path = `/dashboard/screening?job=${job}`;
  needWrite(ctx, path);
  const question = s(fd, "question");
  if (question.length < 3) back(path, { error: "Write the screening question." });
  const { count } = await ctx.supabase.from("oa_screening_questions").select("id", { count: "exact", head: true }).eq("job_id", job);
  const { error } = await ctx.supabase.from("oa_screening_questions").insert({
    organization_id: ctx.orgId, job_id: job, question, required: fd.get("required") === "on",
    min_answer: s(fd, "min_answer") || null, position: count ?? 0,
  });
  if (error) dbError(path, "add the question", error);
  revalidatePath("/dashboard/screening");
  back(path, { notice: "Question added." });
}

export async function deleteQuestion(fd: FormData) {
  const ctx = await getCtx();
  const job = s(fd, "job_id"), path = `/dashboard/screening?job=${job}`;
  needWrite(ctx, path);
  const { error } = await ctx.supabase.from("oa_screening_questions").delete().eq("id", s(fd, "id"));
  if (error) dbError(path, "remove the question", error);
  revalidatePath("/dashboard/screening");
  back(path, { notice: "Question removed." });
}
