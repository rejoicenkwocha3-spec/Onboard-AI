"use client";

import { useActionState } from "react";
import { testAgent, type ChatState } from "@/app/dashboard/assistant/actions";
import { SubmitButton } from "@/components/auth/fields";
import { inputCls } from "./ui";

export function AgentTester({ id }: { id: string }) {
  const [state, action] = useActionState<ChatState, FormData>(testAgent, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <label className="block"><span className="mb-1 block text-sm font-medium">Message as a candidate</span>
        <input name="message" required maxLength={1000} placeholder="What are the working hours for this role?" className={inputCls} /></label>
      <SubmitButton>Send test message</SubmitButton>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {state.reply && (
        <div className="rounded-lg bg-surface p-3 text-sm">
          {state.handoff && <p className="mb-1 text-xs font-semibold text-amber-700">Flagged for human handoff</p>}
          <p className="whitespace-pre-wrap">{state.reply}</p>
        </div>
      )}
    </form>
  );
}
