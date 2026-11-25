import Link from "next/link";
import { BarCard, LineCard } from "@/components/dashboard/Charts";
import { btnGhost, Card, Empty, PageHeader, Stat } from "@/components/dashboard/ui";
import { getAnalytics, RANGES } from "@/lib/analytics";
import { getCtx } from "@/lib/ctx";

export const metadata = { title: "Analytics | Onboard AI" };
const fmt = (v: number | null, suffix = "") => (v === null ? "No data" : `${v}${suffix}`);

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const sp = await searchParams;
  const range = RANGES.some(([k]) => k === sp.range) ? sp.range! : "30";
  const ctx = await getCtx();
  const a = await getAnalytics(ctx, range);
  return (
    <>
      <PageHeader title="Analytics" subtitle="Live figures from your own recruitment data. Where there is not enough data, you will see No data instead of an estimate."
        action={<Link href={`/dashboard/analytics/export?range=${range}`} className={btnGhost}>Download CSV report</Link>} />
      <div className="mb-5 flex flex-wrap gap-2">
        {RANGES.map(([k, t]) => (
          <Link key={k} href={`/dashboard/analytics?range=${k}`} className={`rounded-full border px-3 py-1 text-sm font-medium ${k === range ? "border-brand bg-brand-soft text-brand" : "border-line bg-white text-ink-muted"}`}>{t}</Link>
        ))}
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total applicants" value={a.totalApplicants} />
        <Stat label="Active job openings" value={a.activeJobs} hint="Published jobs right now" />
        <Stat label="Candidate conversion" value={fmt(a.conversionRate, "%")} hint="Hired of applicants" />
        <Stat label="Screening completion" value={fmt(a.screeningRate, "%")} hint="All required questions answered" />
        <Stat label="Interviews scheduled" value={a.interviewsScheduled} />
        <Stat label="Interview attendance" value={fmt(a.attendanceRate, "%")} hint="Attended of attended plus no show" />
        <Stat label="Offers made" value={a.offersMade} />
        <Stat label="Hires completed" value={a.hired} />
        <Stat label="Time to hire" value={a.avgTimeToHire === null ? "No data" : `${a.avgTimeToHire} days`} hint="Applied to hired, average" />
        <Stat label="Onboarding completion" value={fmt(a.onboardingCompletion, "%")} hint="Tasks completed, all time" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><h2 className="mb-2 font-heading text-base font-bold text-navy">Candidates by stage</h2>
          {a.totalApplicants === 0 ? <Empty title="No candidates in this period" /> : <BarCard data={a.stages} x="label" y="count" />}</Card>
        <Card><h2 className="mb-2 font-heading text-base font-bold text-navy">Applications per job</h2>
          {a.perJob.length === 0 ? <Empty title="No applications in this period" /> : <BarCard data={a.perJob} x="job" y="applications" color="#14B8A6" />}</Card>
        <Card className="lg:col-span-2"><h2 className="mb-2 font-heading text-base font-bold text-navy">Recruitment activity</h2>
          {a.activity.length === 0 ? <Empty title="No activity recorded in this period" /> : <LineCard data={a.activity} x="day" y="events" />}</Card>
      </div>
    </>
  );
}
