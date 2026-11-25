"use server";

import { revalidatePath } from "next/cache";
import { getCtx } from "@/lib/ctx";
import { audit, back, dbError, n, needWrite, s } from "@/lib/forms";

const P = "/dashboard/events";

export async function saveEvent(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const id = s(fd, "id"), title = s(fd, "title"), when = s(fd, "starts_at");
  if (title.length < 2) back(P, { error: "Enter an event title." });
  if (!when || Number.isNaN(Date.parse(when))) back(P, { error: "Choose a valid date and time." });
  const row = {
    title, event_type: s(fd, "event_type") === "in_person" ? "in_person" : "virtual", starts_at: new Date(when).toISOString(),
    location: s(fd, "location") || null, description: s(fd, "description") || null, capacity: n(fd, "capacity"),
  };
  if (id) {
    const { error } = await ctx.supabase.from("oa_hiring_events").update(row).eq("id", id);
    if (error) dbError(P, "update the event", error);
  } else {
    const { data, error } = await ctx.supabase.from("oa_hiring_events").insert({ ...row, organization_id: ctx.orgId }).select("id").single();
    if (error) dbError(P, "create the event", error);
    await audit(ctx, "event.created", "event", data.id, title);
  }
  revalidatePath(P);
  back(P, { notice: id ? "Event updated." : "Event created." });
}

export async function setEventStatus(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const status = s(fd, "status");
  if (!["scheduled", "completed", "cancelled"].includes(status)) back(P, { error: "Unknown status." });
  const { error } = await ctx.supabase.from("oa_hiring_events").update({ status }).eq("id", s(fd, "id"));
  if (error) dbError(P, "update the event", error);
  revalidatePath(P);
  back(P, { notice: "Event updated." });
}

export async function deleteEvent(fd: FormData) {
  const ctx = await getCtx();
  needWrite(ctx, P);
  const { error } = await ctx.supabase.from("oa_hiring_events").delete().eq("id", s(fd, "id"));
  if (error) dbError(P, "delete the event", error);
  revalidatePath(P);
  back(P, { notice: "Event deleted." });
}
