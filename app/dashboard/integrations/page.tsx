import { Badge, Card, PageHeader } from "@/components/dashboard/ui";
import { getCtx } from "@/lib/ctx";

export const metadata = { title: "Integrations | Onboard AI" };
const GROUPS = [
  ["Calendars", ["Google Calendar", "Microsoft Outlook"]],
  ["Messaging", ["WhatsApp Business", "Twilio SMS", "Email provider"]],
  ["Applicant tracking and HR systems", ["Greenhouse", "Lever", "Workday", "SAP SuccessFactors"]],
] as const;

export default async function IntegrationsPage() {
  await getCtx();
  const ai = [["Anthropic", Boolean(process.env.ANTHROPIC_API_KEY)], ["OpenAI", Boolean(process.env.OPENAI_API_KEY)]] as const;
  return (
    <>
      <PageHeader title="Integrations" subtitle="An integration is only shown as connected after it has been authorized and tested. None of the external services below are connected yet." />
      <Card className="mb-5">
        <h2 className="mb-3 font-heading text-base font-bold text-navy">AI providers</h2>
        <ul className="space-y-2 text-sm">{ai.map(([name, on]) => (
          <li key={name} className="flex items-center justify-between"><span>{name}</span><Badge tone={on ? "green" : "gray"}>{on ? "API key configured on the server" : "Not configured"}</Badge></li>
        ))}</ul>
        <p className="mt-3 text-xs text-ink-muted">Set ANTHROPIC_API_KEY or OPENAI_API_KEY as a server environment variable in your hosting settings. Keys are never sent to the browser.</p>
      </Card>
      <div className="space-y-5">{GROUPS.map(([title, items]) => (
        <Card key={title}><h2 className="mb-3 font-heading text-base font-bold text-navy">{title}</h2>
          <ul className="divide-y divide-line text-sm">{items.map((n) => (
            <li key={n} className="flex items-center justify-between py-2.5"><span>{n}</span><Badge>Not connected</Badge></li>
          ))}</ul></Card>
      ))}</div>
      <p className="mt-5 text-sm text-ink-muted">Connection flows for these services are planned. They will appear here as buttons once they are built and tested.</p>
    </>
  );
}
