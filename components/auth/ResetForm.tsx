"use client";

import { useActionState } from "react";
import { updatePassword, type AuthState } from "@/lib/auth/actions";
import { Banner, PasswordField, SubmitButton } from "./fields";

export function ResetForm() {
  const [state, action] = useActionState<AuthState, FormData>(updatePassword, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <Banner error={state.error} />
      <PasswordField id="password" label="New password" autoComplete="new-password" required error={state.errors?.password} />
      <PasswordField id="confirmPassword" label="Confirm new password" autoComplete="new-password" required error={state.errors?.confirmPassword} />
      <SubmitButton>Update password</SubmitButton>
    </form>
  );
}
