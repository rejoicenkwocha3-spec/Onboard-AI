"use client";

import { useActionState } from "react";
import { signUp, type AuthState } from "@/lib/auth/actions";
import { Banner, Field, PasswordField, SubmitButton } from "./fields";

export function SignupForm() {
  const [state, action] = useActionState<AuthState, FormData>(signUp, {});
  if (state.success) return <Banner success={state.success} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <Banner error={state.error} />
      <Field id="fullName" label="Full name" autoComplete="name" required
        defaultValue={state.values?.fullName} error={state.errors?.fullName} />
      <Field id="email" label="Work email" type="email" autoComplete="email" required
        defaultValue={state.values?.email} error={state.errors?.email} />
      <PasswordField id="password" label="Password" autoComplete="new-password" required
        error={state.errors?.password} />
      <p className="-mt-2 text-xs text-ink-muted">At least 8 characters with upper case, lower case and a number.</p>
      <PasswordField id="confirmPassword" label="Confirm password" autoComplete="new-password" required
        error={state.errors?.confirmPassword} />
      <div>
        <label className="flex items-start gap-2 text-sm text-ink">
          <input type="checkbox" name="terms" id="terms" defaultChecked={state.values?.terms === "on"} className="mt-0.5 h-4 w-4 rounded border-line accent-brand" />
          <span>I agree to the Terms of Service and Privacy Policy.</span>
        </label>
        {state.errors?.terms && <p className="mt-1 text-xs text-red-600">{state.errors.terms}</p>}
      </div>
      <SubmitButton>Create account</SubmitButton>
    </form>
  );
}
