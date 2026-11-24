import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email address")
  .email("Enter a valid email address");

export const passwordRules = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use 72 characters or fewer")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(100),
    email: emailSchema,
    password: passwordRules,
    confirmPassword: z.string().min(1, "Confirm your password"),
    terms: z.literal("on", { errorMap: () => ({ message: "Accept the terms to continue" }) }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z
  .object({ password: passwordRules, confirmPassword: z.string().min(1, "Confirm your password") })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type FieldErrors = Record<string, string | undefined>;

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
