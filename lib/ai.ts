// Server-side AI provider layer. Keys come from server environment variables only.
export type Provider = "anthropic" | "openai";

export function configuredProvider(): Provider | null {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

export const GUARDRAILS = [
  "You assist a recruitment team. You never make or announce hiring decisions: a human recruiter decides.",
  "Never use or infer protected characteristics (age, gender, race, religion, disability, nationality, marital status, pregnancy) to rank, filter or judge any candidate.",
  "Only share information the organization has given you. If you do not know, say so and offer to connect the candidate with a recruiter.",
  "If a candidate raises a complaint, a legal issue, harassment, or asks for a human, reply with [HANDOFF] at the start and explain that a team member will follow up.",
  "Keep replies short, polite and in plain text.",
].join("\n");

export async function generate(system: string, userMessage: string): Promise<string> {
  const provider = configuredProvider();
  if (!provider) throw new Error("NO_PROVIDER");
  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal: AbortSignal.timeout(25000),
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5", max_tokens: 600, system, messages: [{ role: "user", content: userMessage }] }),
    });
    if (!res.ok) throw new Error(`PROVIDER_${res.status}`);
    const j = await res.json();
    return String(j?.content?.[0]?.text ?? "");
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST", signal: AbortSignal.timeout(25000),
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", max_tokens: 600, messages: [{ role: "system", content: system }, { role: "user", content: userMessage }] }),
  });
  if (!res.ok) throw new Error(`PROVIDER_${res.status}`);
  const j = await res.json();
  return String(j?.choices?.[0]?.message?.content ?? "");
}
