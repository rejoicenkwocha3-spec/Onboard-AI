"use server";

import { revalidatePath } from "next/cache";
import { getCtx } from "@/lib/ctx";
import { STAGES, stageLabel } from "@/lib/constants";
import { audit, back, dbError, needWrite, s } from "@/lib/forms";

const P = "/dashboard/candidates";

export async function createCandidate(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const name = s(fd, "full_name"), email = s(fd, "email").toLowerCase();
  if (name.length < 2) back(P, { error: "Enter the candidate's full name." });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) back(P, { error: "Enter a valid email address." });
  const { data, error } = await ctx.supabase.from("oa_candidates").insert({
    organization_id: ctx.orgId, full_name: name, email, phone: s(fd, "phone") || null,
    job_id: s(fd, "job_id") || null, skills: s(fd, "skills").split(",").map((x) => x.trim()).filter(Boolean),
    experience: s(fd, "experience") || null, qualifications: s(fd, "qualifications") || null, source: "manual", owner_id: ctx.user.id,
  }).select("id").single();
  if (error) {
    if (error.code === "23505") back(P, { error: "This person has already applied for that job." });
    dbError(P, "add the candidate", error);
  }
  await ctx.supabase.from("oa_candidate_events").insert({ organization_id: ctx.orgId, candidate_id: data.id, actor_id: ctx.user.id, type: "created", detail: "Added manually" });
  await audit(ctx, "candidate.created", "candidate", data.id, name);
  revalidatePath(P);
  back(`${P}/${data.id}`, { notice: "Candidate added." });
}

export async function updateCandidate(fd: FormData) {
  const ctx = await getCtx();
  const id = s(fd, "id"), path = `${P}/${id}`;
  needWrite(ctx, path);
  const { error } = await ctx.supabase.from("oa_candidates").update({
    full_name: s(fd, "full_name"), phone: s(fd, "phone") || null,
    skills: s(fd, "skills").split(",").map((x) => x.trim()).filter(Boolean),
    experience: s(fd, "experience") || null, qualifications: s(fd, "qualifications") || null,
  }).eq("id", id);
  if (error) dbError(path, "save the profile", error);
  await ctx.supabase.from("oa_candidate_events").insert({ organization_id: ctx.orgId, candidate_id: id, actor_id: ctx.user.id, type: "profile", detail: "Profile updated" });
  revalidatePath(path);
  back(path, { notice: "Profile saved." });
}

export async function moveStage(fd: FormData) {
  const ctx = await getCtx();
  const id = s(fd, "id"), stage = s(fd, "stage"), path = s(fd, "return") || `${P}/${id}`;
  needWrite(ctx, path);
  if (!STAGES.some(([k]) => k === stage)) back(path, { error: "Unknown stage." });
  const { data: before } = await ctx.supabase.from("oa_candidates").select("stage, full_name").eq("id", id).maybeSingle();
  const { error } = await ctx.supabase.from("oa_candidates").update({ stage }).eq("id", id);
  if (error) dbError(path, "move the candidate", error);
  const detail = `${stageLabel(before?.stage ?? "")} to ${stageLabel(stage)}`;
  await ctx.supabase.from("oa_candidate_events").insert({ organization_id: ctx.orgId, candidate_id: id, actor_id: ctx.user.id, type: "stage", detail });
  await audit(ctx, "candidate.stage", "candidate", id, `${before?.full_name ?? ""}: ${detail}`);
  revalidatePath(P);
  back(path, { notice: `Moved to ${stageLabel(stage)}.` });
}

export async function addNote(fd: FormData) {
  const ctx = await getCtx();
  const id = s(fd, "id"), path = `${P}/${id}`, note = s(fd, "note");
  needWrite(ctx, path);
  if (!note) back(path, { error: "Write a note first." });
  const { error } = await ctx.supabase.from("oa_candidate_events").insert({ organization_id: ctx.orgId, candidate_id: id, actor_id: ctx.user.id, type: "note", detail: note.slice(0, 4000) });
  if (error) dbError(path, "save the note", error);
  revalidatePath(path);
  back(path, { notice: "Note added." });
}

export async function assignToMe(fd: FormData) {
  const ctx = await getCtx();
  const id = s(fd, "id"), path = `${P}/${id}`;
  needWrite(ctx, path);
  const { error } = await ctx.supabase.from("oa_candidates").update({ owner_id: ctx.user.id }).eq("id", id);
  if (error) dbError(path, "assign the candidate", error);
  await ctx.supabase.from("oa_candidate_events").insert({ organization_id: ctx.orgId, candidate_id: id, actor_id: ctx.user.id, type: "owner", detail: `Assigned to ${ctx.fullName}` });
  revalidatePath(path);
  back(path, { notice: "You now own this candidate." });
}
