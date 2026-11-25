"use server";

import { revalidatePath } from "next/cache";
import { getCtx } from "@/lib/ctx";
import { audit, back, dbError, needWrite, s } from "@/lib/forms";

const P = "/dashboard/conversations";

export async function startConversation(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const subject = s(fd, "subject");
  if (subject.length < 2) back(P, { error: "Enter a subject." });
  const { data, error } = await ctx.supabase.from("oa_conversations").insert({
    organization_id: ctx.orgId, candidate_id: s(fd, "candidate_id") || null, channel: "internal", subject, assigned_to: ctx.user.id,
  }).select("id").single();
  if (error) dbError(P, "start the conversation", error);
  await audit(ctx, "conversation.created", "conversation", data.id, subject);
  revalidatePath(P);
  back(`${P}?c=${data.id}`, { notice: "Conversation started." });
}

export async function addMessage(fd: FormData) {
  const ctx = await getCtx();
  const id = s(fd, "id"), path = `${P}?c=${id}`;
  needWrite(ctx, path);
  const body = s(fd, "body");
  if (!body) back(path, { error: "Write a message first." });
  const { error } = await ctx.supabase.from("oa_messages").insert({ organization_id: ctx.orgId, conversation_id: id, direction: "internal", body: body.slice(0, 4000), sender_id: ctx.user.id });
  if (error) dbError(path, "save the note", error);
  await ctx.supabase.from("oa_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(P);
  back(path, { notice: "Internal note saved." });
}

export async function setConversation(fd: FormData) {
  const ctx = await getCtx();
  const id = s(fd, "id"), path = `${P}?c=${id}`;
  needWrite(ctx, path);
  const patch: Record<string, unknown> = {};
  const status = s(fd, "status");
  if (status) {
    if (!["open", "closed", "handoff"].includes(status)) back(path, { error: "Unknown status." });
    patch.status = status;
  }
  if (s(fd, "assign") === "me") patch.assigned_to = ctx.user.id;
  const { error } = await ctx.supabase.from("oa_conversations").update(patch).eq("id", id);
  if (error) dbError(path, "update the conversation", error);
  await audit(ctx, "conversation.updated", "conversation", id, status || "assigned");
  revalidatePath(P);
  back(path, { notice: "Conversation updated." });
}
