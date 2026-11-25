"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function acceptInvite(fd: FormData) {
  const token = String(fd.get("token") ?? "");
  const supabase = await createClient();
  if (!supabase) redirect("/login");
  const { error } = await supabase.rpc("oa_accept_invitation", { p_token: token });
  if (error) {
    console.error("[invite]", error.code, error.message);
    const known = ["invalid or has already", "different email"].some((k) => error.message.includes(k));
    redirect(`/invite/${encodeURIComponent(token)}?error=${encodeURIComponent(known ? error.message.replace(/^.*?: /, "") : "We could not accept this invitation.")}`);
  }
  redirect("/dashboard");
}
