import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotForm } from "@/components/auth/ForgotForm";

export const metadata = { title: "Reset password | Onboard AI" };

export default function ForgotPage() {
  return (
    <AuthShell
      title="Reset your password" subtitle="Enter your email and we will send you a reset link."
      footer={<Link href="/login" className="font-medium text-brand hover:underline">Back to log in</Link>}
    >
      <ForgotForm />
    </AuthShell>
  );
}
