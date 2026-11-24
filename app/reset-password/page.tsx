import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetForm } from "@/components/auth/ResetForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Choose a new password | Onboard AI" };

export default async function ResetPage() {
  const supabase = await createClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user) redirect("/login?error=" + encodeURIComponent("Your reset link has expired. Request a new one."));
  return (
    <AuthShell title="Choose a new password">
      <ResetForm />
    </AuthShell>
  );
}
