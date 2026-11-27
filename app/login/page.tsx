import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeNext } from "@/lib/auth/redirect";

export const metadata = { title: "Sign in | Onboard AI" };

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <AuthShell
      title="Welcome back" subtitle="Sign in to your Onboard AI workspace."
      footer={<>New to Onboard AI? <Link href="/signup" className="font-medium text-brand hover:underline">Create an account</Link></>}
    >
      <LoginForm next={next ? safeNext(next) : undefined} initialError={error} />
    </AuthShell>
  );
}
