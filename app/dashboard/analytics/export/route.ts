import { NextResponse, type NextRequest } from "next/server";
import { getAnalytics, RANGES } from "@/lib/analytics";
import { getCtx } from "@/lib/ctx";

const cell = (v: string | number | null) => {
  const t = v === null ? "" : String(v);
  // Neutralise spreadsheet formula injection in text cells.
  const safe = /^[=+\-@\t\r]/.test(t) && Number.isNaN(Number(t)) ? `'${t}` : t;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function GET(request: NextRequest) {
  const r = request.nextUrl.searchParams.get("range") ?? "30";
  const range = RANGES.some(([k]) => k === r) ? r : "30";
  const ctx = await getCtx();
  const a = await getAnalytics(ctx, range);
  const rows: (string | number | null)[][] = [
    ["Metric", "Value"], ["Period", RANGES.find(([k]) => k === range)![1]],
    ["Total applicants", a.totalApplicants], ["Active job openings", a.activeJobs], ["Candidate conversion rate (%)", a.conversionRate],
    ["Screening completion rate (%)", a.screeningRate], ["Interviews scheduled", a.interviewsScheduled],
    ["Interview attendance rate (%)", a.attendanceRate], ["Offers made", a.offersMade], ["Hires completed", a.hired],
    ["Average time to hire (days)", a.avgTimeToHire], ["Onboarding completion (%)", a.onboardingCompletion], [],
    ["Stage", "Candidates"], ...a.stages.map((s) => [s.label, s.count]), [],
    ["Job", "Applications"], ...a.perJob.map((j) => [j.job, j.applications]),
  ];
  const csv = rows.map((row) => row.map(cell).join(",")).join("\n");
  return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="onboard-ai-report-${range}.csv"`, "cache-control": "no-store" } });
}
