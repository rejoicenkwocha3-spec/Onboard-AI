export const STAGES = [
  ["new_applicant", "New Applicant"], ["screening", "Screening"], ["shortlisted", "Shortlisted"],
  ["interview", "Interview"], ["assessment", "Assessment"], ["offer", "Offer"],
  ["hired", "Hired"], ["not_selected", "Not Selected"], ["withdrawn", "Withdrawn"],
] as const;
export const stageLabel = (v: string) => STAGES.find(([k]) => k === v)?.[1] ?? v;

export const EMPLOYMENT_TYPES = [
  ["full_time", "Full time"], ["part_time", "Part time"], ["contract", "Contract"],
  ["temporary", "Temporary"], ["internship", "Internship"],
] as const;
export const employmentLabel = (v: string) => EMPLOYMENT_TYPES.find(([k]) => k === v)?.[1] ?? v;

export const ROLES = [
  ["admin", "Admin"], ["hr_manager", "HR Manager"], ["hiring_manager", "Hiring Manager"],
  ["recruiter", "Recruiter"], ["employee", "Employee"],
] as const;
export const roleLabel = (v: string) => (v === "owner" ? "Owner" : ROLES.find(([k]) => k === v)?.[1] ?? v);

export const DOC_CATEGORIES = [
  ["resume", "Resume"], ["offer_letter", "Offer letter"], ["employee_document", "Employee document"],
  ["policy", "Company policy"], ["onboarding", "Onboarding document"], ["training", "Training material"],
  ["job_description", "Job description"], ["other", "Other"],
] as const;
export const docLabel = (v: string) => DOC_CATEGORIES.find(([k]) => k === v)?.[1] ?? v;

export const CHANNELS = [
  ["website_chat", "Website chat"], ["email", "Email"], ["sms", "SMS"], ["whatsapp", "WhatsApp"], ["internal", "Internal"],
] as const;
export const channelLabel = (v: string) => CHANNELS.find(([k]) => k === v)?.[1] ?? v;

export const AGENT_ACTIONS = [
  "Answer candidate questions", "Share job descriptions", "Collect candidate information",
  "Ask screening questions", "Collect availability", "Offer interview slots", "Provide application updates",
] as const;
