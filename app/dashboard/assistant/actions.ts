"use server";

import { revalidatePath } from "next/cache";
import { generate, GUARDRAILS, configuredProvider } from "@/lib/ai";
import { getCtx } from "@/lib/ctx";
import { audit, back, dbError, needWrite, s } from "@/lib/forms";

const P = "/dashboard/assistant";
export type ChatState = { reply?: string; handoff?: boolean; error?: string };

export async function saveAgent(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const id = s(fd, "id"), name = s(fd, "name");
  if (name.length < 2) back(P, { error: "Give the assistant a name." });
  const row = {
    name, personality: s(fd, "personality") || null, tone: s(fd, "tone") || null, language: s(fd, "language") || "English",
    instructions: s(fd, "instructions") || null, escalation_rules: s(fd, "escalation_rules") || null,
    channels: fd.getAll("channels").map(String), approved_actions: fd.getAll("approved_actions").map(String),
  };
  if (id) {
    const { error } = await ctx.supabase.from("oa_agents").update(row).eq("id", id);
    if (error) dbError(P, "save the assistant", error);
  } else {
    const { data, error } = await ctx.supabase.from("oa_agents").insert({ ...row, organization_id: ctx.orgId }).select("id").single();
    if (error) dbError(P, "create the assistant", error);
    await audit(ctx, "assistant.created", "agent", data.id, name);
  }
  revalidatePath(P);
  back(P, { notice: "Assistant saved." });
}

export async function setAgentStatus(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const status = s(fd, "status") === "paused" ? "paused" : "active";
  const { error } = await ctx.supabase.from("oa_agents").update({ status }).eq("id", s(fd, "id"));
  if (error) dbError(P, "update the assistant", error);
  revalidatePath(P);
  back(P, { notice: `Assistant ${status === "paused" ? "paused" : "activated"}.` });
}

export async function deleteAgent(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const { error } = await ctx.supabase.from("oa_agents").delete().eq("id", s(fd, "id"));
  if (error) dbError(P, "delete the assistant", error);
  revalidatePath(P);
  back(P, { notice: "Assistant deleted." });
}

export async function testAgent(_prev: ChatState, fd: FormData): Promise<ChatState> {
  const ctx = await getCtx();
  if (!ctx.canWrite) return { error: "Your role cannot use the assistant." };
  if (!configuredProvider()) return { error: "No AI provider is configured. Add ANTHROPIC_API_KEY or OPENAI_API_KEY to the server environment." };
  const message = s(fd, "message").slice(0, 1000);
  if (!message) return { error: "Type a message to test." };

  // Rate limit: 30 test messages per organization per hour.
  const hourAgo = new Date(Date.now() - 3600000).toISOString();
  const { count } = await ctx.supabase.from("oa_usage_events").select("id", { count: "exact", head: true }).eq("kind", "ai_test").gte("created_at", hourAgo);
  if ((count ?? 0) >= 30) return { error: "Test limit reached for this hour. Try again later." };

  const { data: a } = await ctx.supabase.from("oa_agents").select("*").eq("id", s(fd, "id")).maybeSingle();
  if (!a) return { error: "Assistant not found." };
  const system = [
    `You are ${a.name}, a recruitment assistant for ${ctx.orgName}.`,
    a.personality && `Personality: ${a.personality}`, a.tone && `Tone: ${a.tone}`, `Reply in ${a.language}.`,
    a.instructions && `Organization instructions:\n${a.instructions}`, a.escalation_rules && `Escalate to a human when:\n${a.escalation_rules}`,
    a.approved_actions?.length && `You may only help with: ${a.approved_actions.join(", ")}.`, GUARDRAILS,
  ].filter(Boolean).join("\n\n");
  try {
    const raw = (await generate(system, message)).trim().slice(0, 2000);
    await ctx.supabase.from("oa_usage_events").insert({ organization_id: ctx.orgId, user_id: ctx.user.id, kind: "ai_test", provider: configuredProvider() });
    if (!raw) return { error: "The assistant returned an empty reply. Try again." };
    return { reply: raw.replace(/^\[HANDOFF\]\s*/, ""), handoff: raw.startsWith("[HANDOFF]") };
  } catch (e) {
    console.error("[assistant]", e instanceof Error ? e.message : e);
    return { error: "The AI provider did not respond. Check the API key and try again." };
  }
}
