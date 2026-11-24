"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SETUP_MESSAGE } from "@/lib/supabase/env";
import { safeNext } from "./redirect";
import {
  forgotSchema,
  loginSchema,
  resetSchema,
  signupSchema,
  toFieldErrors,
  type FieldErrors,
} from "./schemas";

export type AuthState = {
  errors?: FieldErrors;
  error?: string;
  success?: string;
  values?: Record<string, string>;
};

async function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Server-side only: the user sees a friendly message, the logs keep the real cause.
function logAuthError(action: string, error: { message: string; status?: number; code?: string }) {
  console.error(`[auth:${action}] status=${error.status ?? "n/a"} code=${error.code ?? "n/a"} message=${error.message}`);
}

const str = (fd: FormData, k: string) => (typeof fd.get(k) === "string" ? (fd.get(k) as string) : "");

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = { email: str(formData, "email"), password: str(formData, "password") };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), values: { email: raw.email } };

  const supabase = await createClient();
  if (!supabase) return { error: SETUP_MESSAGE, values: { email: raw.email } };

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    logAuthError("signIn", error);
    const msg = error.message.toLowerCase();
    let text = "We could not sign you in. Please try again.";
    if (msg.includes("invalid login credentials")) text = "Incorrect email or password.";
    else if (msg.includes("email not confirmed"))
      text = "Please verify your email first. Check your inbox for the confirmation link.";
    else if (error.status === 429 || msg.includes("rate limit"))
      text = "Too many attempts. Please wait a moment and try again.";
    return { error: text, values: { email: raw.email } };
  }

  redirect(safeNext(str(formData, "next")));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    fullName: str(formData, "fullName"),
    email: str(formData, "email"),
    password: str(formData, "password"),
    confirmPassword: str(formData, "confirmPassword"),
    terms: str(formData, "terms") || undefined,
  };
  const keep = { fullName: raw.fullName, email: raw.email, terms: raw.terms ?? "" };
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), values: keep };

  const supabase = await createClient();
  if (!supabase) return { error: SETUP_MESSAGE, values: keep };

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${await siteUrl()}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    logAuthError("signUp", error);
    const msg = error.message.toLowerCase();
    let text = "We could not create your account. Please try again.";
    if (msg.includes("already registered") || msg.includes("already been registered"))
      text = "An account with this email already exists. Try signing in instead.";
    else if (error.code === "email_address_invalid" || msg.includes("is invalid"))
      text = "That email address cannot be used. Enter a valid work email address.";
    else if (error.status === 429 || msg.includes("rate limit"))
      text = "Too many attempts. Please wait a moment and try again.";
    else if (msg.includes("password")) text = error.message;
    else if (msg.includes("database error"))
      text = "Account setup failed on the server. Please contact support if this continues.";
    return { error: text, values: keep };
  }

  // With email confirmation on, an existing address returns a user with no identities.
  if (data.user && data.user.identities?.length === 0) {
    return {
      error: "An account with this email already exists. Try signing in instead.",
      values: keep,
    };
  }

  // Confirmation disabled: a session exists immediately.
  if (data.session) redirect("/onboarding");

  return {
    success: `We sent a confirmation link to ${parsed.data.email}. Open it to verify your email and continue to setup.`,
    values: keep,
  };
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = { email: str(formData, "email") };
  const parsed = forgotSchema.safeParse(raw);
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), values: raw };

  const supabase = await createClient();
  if (!supabase) return { error: SETUP_MESSAGE, values: raw };

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteUrl()}/auth/callback?next=/reset-password`,
  });
  if (error) logAuthError("requestPasswordReset", error);
  if (error && (error.status === 429 || error.message.toLowerCase().includes("rate limit")))
    return { error: "Too many attempts. Please wait a moment and try again.", values: raw };

  // Same response whether or not the account exists, to avoid revealing registered emails.
  return { success: "If an account exists for that email, a reset link is on its way.", values: raw };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetSchema.safeParse({
    password: str(formData, "password"),
    confirmPassword: str(formData, "confirmPassword"),
  });
  if (!parsed.success) return { errors: toFieldErrors(parsed.error) };

  const supabase = await createClient();
  if (!supabase) return { error: SETUP_MESSAGE };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your reset link has expired. Request a new one." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    logAuthError("updatePassword", error);
    return {
      error: error.message.toLowerCase().includes("different")
        ? "Choose a password you have not used before."
        : "We could not update your password. Please try again.",
    };
  }
  redirect("/dashboard");
}
