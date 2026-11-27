import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = { title: "Sign up | Onboard AI" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account" subtitle="Set up your recruitment workspace in minutes."
      footer={<>Already have an account? <Link href="/login" className="font-medium text-brand hover:underline">Sign in</Link></>}
    >
      <SignupForm />
    </AuthShell>
  );
}
