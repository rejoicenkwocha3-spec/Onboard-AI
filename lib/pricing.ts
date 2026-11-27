// Pricing facts come from the three Selar checkout pages (price, monthly billing, cancel anytime).
// The pages show no plan names or benefits, so those are left for the owner to fill in.
// Edit `name`, `description` and `features` below. Leave `features` empty until the benefits are confirmed.
export type Plan = { name: string; price: string; billing: string; description: string; features: string[]; href: string };

export const PLANS: Plan[] = [
  { name: "Plan 1", price: "$47", billing: "per month", description: "", features: [], href: "https://selar.com/47plan?currency=USD" },
  { name: "Plan 2", price: "$57", billing: "per month", description: "", features: [], href: "https://selar.com/57plan?currency=USD" },
  { name: "Plan 3", price: "$97", billing: "per month", description: "", features: [], href: "https://selar.com/97plan?currency=USD" },
];

export const PLAN_FACTS = [
  "Recurring monthly payment",
  "Email notice before every charge",
  "Cancel at any time",
  "Secure checkout hosted by Selar",
];
