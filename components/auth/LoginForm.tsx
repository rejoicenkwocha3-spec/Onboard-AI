"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type AuthState } from "@/lib/auth/actions";
import { Banner, Field, PasswordField, SubmitButton } from "./fields";

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signIn, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <Banner error={state.error ?? initialError} />
      {next && <input type="hidden" name="next" value={next} />}
      <Field id="email" label="Work email" type="email" autoComplete="email" required
        defaultValue={state.values?.email} error={state.errors?.email} />
      <PasswordField id="password" label="Password" autoComplete="current-password" required
        error={state.errors?.password} />
      <div className="text-right">
        <Link href="/forgot-password" className="text-sm font-medium text-brand hover:underline">Forgot password?</Link>
      </div>
      <SubmitButton>Sign in</SubmitButton>
    </form>
  );
}
