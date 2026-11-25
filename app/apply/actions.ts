"use server";

import { createClient } from "@/lib/supabase/server";

export type ApplyResult = { ok: true } | { ok: false; error: string };

export async function submitApplication(input: {
  jobId: string; name: string; email: string; phone: string; experience: string;
  answers: { question_id: string; answer: string }[];
}): Promise<ApplyResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Applications are temporarily unavailable." };
  const { error } = await supabase.rpc("oa_submit_application", {
    p_job: input.jobId, p_name: input.name, p_email: input.email, p_phone: input.phone,
    p_experience: input.experience, p_answers: input.answers,
  });
  if (error) {
    console.error("[apply]", error.code, error.message);
    const friendly = ["already applied", "full name", "valid email", "too long", "not accepting"].some((k) => error.message.includes(k));
    return { ok: false, error: friendly ? error.message.replace(/^.*?: /, "") : "We could not submit your application. Please try again." };
  }
  return { ok: true };
}
