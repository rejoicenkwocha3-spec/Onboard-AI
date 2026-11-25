"use server";

import { revalidatePath } from "next/cache";
import { getCtx } from "@/lib/ctx";
import { audit, back, dbError, lines, needWrite, s } from "@/lib/forms";

const P = "/dashboard/workflows";

export async function saveWorkflow(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const id = s(fd, "id"), name = s(fd, "name"), steps = lines(String(fd.get("steps") ?? ""));
  if (name.length < 2) back(P, { error: "Name the workflow." });
  if (steps.length === 0) back(P, { error: "Add at least one step, one per line." });
  const row = { name, trigger: s(fd, "trigger"), steps };
  if (id) {
    const { error } = await ctx.supabase.from("oa_workflows").update(row).eq("id", id);
    if (error) dbError(P, "save the workflow", error);
  } else {
    const { data, error } = await ctx.supabase.from("oa_workflows").insert({ ...row, organization_id: ctx.orgId }).select("id").single();
    if (error) dbError(P, "create the workflow", error);
    await audit(ctx, "workflow.created", "workflow", data.id, name);
  }
  revalidatePath(P);
  back(P, { notice: "Workflow saved." });
}

export async function deleteWorkflow(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const { error } = await ctx.supabase.from("oa_workflows").delete().eq("id", s(fd, "id"));
  if (error) dbError(P, "delete the workflow", error);
  revalidatePath(P);
  back(P, { notice: "Workflow deleted." });
}
