"use client";

import { useActionState } from "react";
import { requestPasswordReset, type AuthState } from "@/lib/auth/actions";
import { Banner, Field, SubmitButton } from "./fields";

export function ForgotForm() {
  const [state, action] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  if (state.success) return <Banner success={state.success} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <Banner error={state.error} />
      <Field id="email" label="Work email" type="email" autoComplete="email" required
        defaultValue={state.values?.email} error={state.errors?.email} />
      <SubmitButton>Send reset link</SubmitButton>
    </form>
  );
}
