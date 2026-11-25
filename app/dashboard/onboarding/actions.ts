"use server";

import { revalidatePath } from "next/cache";
import { getCtx } from "@/lib/ctx";
import { audit, back, dbError, lines, n, needWrite, s } from "@/lib/forms";

const P = "/dashboard/onboarding";

export async function createTemplate(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const name = s(fd, "name"), tasks = lines(String(fd.get("tasks") ?? ""));
  if (name.length < 2) back(P, { error: "Name the template." });
  if (tasks.length === 0) back(P, { error: "Add at least one task, one per line." });
  const { error } = await ctx.supabase.from("oa_onboarding_templates").insert({ organization_id: ctx.orgId, name, department: s(fd, "department") || null, tasks });
  if (error) dbError(P, "create the template", error);
  revalidatePath(P);
  back(P, { notice: "Template created." });
}

export async function deleteTemplate(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const { error } = await ctx.supabase.from("oa_onboarding_templates").delete().eq("id", s(fd, "id"));
  if (error) dbError(P, "delete the template", error);
  revalidatePath(P);
  back(P, { notice: "Template deleted." });
}

export async function startProcess(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const name = s(fd, "employee_name"), email = s(fd, "employee_email").toLowerCase(), templateId = s(fd, "template_id");
  if (name.length < 2) back(P, { error: "Enter the employee's name." });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) back(P, { error: "Enter a valid employee email." });
  if (!templateId) back(P, { error: "Choose a template. Create one first if none exist." });
  const { data: tpl } = await ctx.supabase.from("oa_onboarding_templates").select("tasks").eq("id", templateId).maybeSingle();
  if (!tpl) back(P, { error: "That template was not found." });
  const start = s(fd, "start_date") || new Date().toISOString().slice(0, 10);
  const days = Math.min(Math.max(n(fd, "days") ?? 7, 0), 365);
  const due = new Date(Date.parse(start) + days * 86400000).toISOString().slice(0, 10);
  const { data: proc, error } = await ctx.supabase.from("oa_onboarding_processes").insert({
    organization_id: ctx.orgId, candidate_id: s(fd, "candidate_id") || null, template_id: templateId,
    employee_name: name, employee_email: email, start_date: start,
  }).select("id").single();
  if (error) dbError(P, "start onboarding", error);
  const { error: tErr } = await ctx.supabase.from("oa_onboarding_tasks").insert(
    (tpl!.tasks as string[]).map((title, i) => ({ organization_id: ctx.orgId, process_id: proc.id, title, due_date: due, position: i })));
  if (tErr) {
    await ctx.supabase.from("oa_onboarding_processes").delete().eq("id", proc.id);
    dbError(P, "create the onboarding tasks", tErr);
  }
  await audit(ctx, "onboarding.started", "onboarding", proc.id, name);
  revalidatePath(P);
  back(P, { notice: `Onboarding started for ${name}. They can sign in with ${email} and open Employee Portal.` });
}

export async function setTask(fd: FormData) {
  const ctx = await getCtx();
  const back_to = s(fd, "return") || P;
  const done = s(fd, "done") === "1";
  const { error } = await ctx.supabase.from("oa_onboarding_tasks")
    .update({ status: done ? "completed" : "pending", completed_at: done ? new Date().toISOString() : null }).eq("id", s(fd, "id"));
  if (error) dbError(back_to, "update the task", error);
  revalidatePath(P);
  revalidatePath("/dashboard/employee-portal");
  back(back_to, { notice: done ? "Task completed." : "Task reopened." });
}
