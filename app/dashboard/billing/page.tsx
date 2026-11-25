import { Badge, Card, PageHeader } from "@/components/dashboard/ui";
import { LocalTime } from "@/components/dashboard/client";
import { getCtx } from "@/lib/ctx";

export const metadata = { title: "Billing | Onboard AI" };
const PLANS = [
  ["Plan 1", "https://selar.com/47plan?currency=USD"],
  ["Plan 2", "https://selar.com/57plan?currency=USD"],
  ["Plan 3", "https://selar.com/97plan?currency=USD"],
] as const;

export default async function BillingPage() {
  const ctx = await getCtx();
  const { data: sub } = await ctx.supabase.from("oa_subscriptions").select("plan_ref, status, current_period_end").order("created_at", { ascending: false }).limit(1).maybeSingle();
  const active = sub?.status === "active";
  return (
    <>
      <PageHeader title="Billing" subtitle="Your subscription status and plan checkout." />
      <Card className="mb-5">
        <h2 className="mb-2 font-heading text-base font-bold text-navy">Subscription</h2>
        {active ? (
          <p className="text-sm">Status: <Badge tone="green">Active</Badge>{sub?.plan_ref ? ` · ${sub.plan_ref}` : ""}{sub?.current_period_end && <> · renews <LocalTime iso={sub.current_period_end} dateOnly /></>}</p>
        ) : <p className="text-sm text-ink-muted">No active subscription is recorded for this organization.</p>}
        <p className="mt-3 text-xs text-ink-muted">A subscription is activated only when a payment is confirmed by Selar, never because a checkout button was clicked. Automatic confirmation is not connected yet, so a new payment is recorded on your account by the Onboard AI team after verification.</p>
      </Card>
      <Card>
        <h2 className="mb-3 font-heading text-base font-bold text-navy">Checkout</h2>
        <p className="mb-3 text-sm text-ink-muted">Each button opens the plan's secure Selar checkout page in a new tab, where its price and benefits are shown.</p>
        <div className="flex flex-wrap gap-3">{PLANS.map(([name, href]) => (
          <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-light">{name} checkout</a>
        ))}</div>
      </Card>
    </>
  );
}
