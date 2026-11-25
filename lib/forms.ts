import { redirect } from "next/navigation";
import type { Ctx } from "./ctx";

export const s = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
};
export const n = (fd: FormData, k: string): number | null => {
  const v = s(fd, k);
  if (!v) return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
};
export const lines = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);

/** Redirects back to a page with a message the page shows in a banner. */
export function back(path: string, msg: { notice?: string; error?: string }): never {
  const q = new URLSearchParams();
  if (msg.notice) q.set("notice", msg.notice);
  if (msg.error) q.set("error", msg.error);
  redirect(`${path}${path.includes("?") ? "&" : "?"}${q.toString()}`);
}

export function needWrite(ctx: Ctx, path: string) {
  if (!ctx.canWrite) back(path, { error: "Your role has read only access to this area." });
}
export function needAdmin(ctx: Ctx, path: string) {
  if (!ctx.isAdmin) back(path, { error: "Only owners and admins can do that." });
}

/** Records an entry in the organization activity log. Never throws. */
export async function audit(ctx: Ctx, action: string, entity: string, entityId: string | null, detail?: string) {
  const { error } = await ctx.supabase.from("oa_audit_logs").insert({
    organization_id: ctx.orgId, actor_id: ctx.user.id, action, entity, entity_id: entityId, detail: detail ?? null,
  });
  if (error) console.error("[audit]", error.code, error.message);
}

export function dbError(path: string, what: string, error: { code?: string; message: string }): never {
  console.error(`[${what}]`, error.code, error.message);
  return back(path, { error: `Could not ${what}. ${error.code === "42501" ? "You do not have permission." : "Please try again."}` });
}
