"use server";

import { revalidatePath } from "next/cache";
import { getCtx } from "@/lib/ctx";
import { ROLES } from "@/lib/constants";
import { audit, back, dbError, needAdmin, s } from "@/lib/forms";

const P = "/dashboard/team";
const validRole = (r: string) => ROLES.some(([k]) => k === r);

export async function invite(fd: FormData) {
  const ctx = await getCtx();
  needAdmin(ctx, P);
  const email = s(fd, "email").toLowerCase(), role = s(fd, "role");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) back(P, { error: "Enter a valid email address." });
  if (!validRole(role)) back(P, { error: "Choose a role." });
  const { error } = await ctx.supabase.from("oa_invitations").insert({ organization_id: ctx.orgId, email, role, invited_by: ctx.user.id });
  if (error) dbError(P, "create the invitation", error);
  await audit(ctx, "team.invited", "invitation", null, `${email} as ${role}`);
  revalidatePath(P);
  back(P, { notice: `Invitation created for ${email}. Copy the link below and send it to them: email delivery is not set up yet.` });
}

export async function revokeInvite(fd: FormData) {
  const ctx = await getCtx();
  needAdmin(ctx, P);
  const { error } = await ctx.supabase.from("oa_invitations").update({ status: "revoked" }).eq("id", s(fd, "id"));
  if (error) dbError(P, "revoke the invitation", error);
  revalidatePath(P);
  back(P, { notice: "Invitation revoked." });
}

export async function changeRole(fd: FormData) {
  const ctx = await getCtx();
  needAdmin(ctx, P);
  const id = s(fd, "id"), role = s(fd, "role");
  if (!validRole(role)) back(P, { error: "Choose a role." });
  const { data: m } = await ctx.supabase.from("oa_organization_members").select("user_id, role").eq("id", id).maybeSingle();
  if (!m) back(P, { error: "Member not found." });
  if (m!.role === "owner") back(P, { error: "The owner's role cannot be changed." });
  if (m!.user_id === ctx.user.id) back(P, { error: "You cannot change your own role." });
  const { error } = await ctx.supabase.from("oa_organization_members").update({ role }).eq("id", id);
  if (error) dbError(P, "change the role", error);
  await audit(ctx, "team.role_changed", "member", id, role);
  revalidatePath(P);
  back(P, { notice: "Role updated." });
}

export async function removeMember(fd: FormData) {
  const ctx = await getCtx();
  needAdmin(ctx, P);
  const id = s(fd, "id");
  const { data: m } = await ctx.supabase.from("oa_organization_members").select("user_id, role").eq("id", id).maybeSingle();
  if (!m) back(P, { error: "Member not found." });
  if (m!.role === "owner") back(P, { error: "The owner cannot be removed." });
  if (m!.user_id === ctx.user.id) back(P, { error: "You cannot remove yourself." });
  const { error } = await ctx.supabase.from("oa_organization_members").delete().eq("id", id);
  if (error) dbError(P, "remove the member", error);
  await audit(ctx, "team.removed", "member", id);
  revalidatePath(P);
  back(P, { notice: "Member removed." });
}
