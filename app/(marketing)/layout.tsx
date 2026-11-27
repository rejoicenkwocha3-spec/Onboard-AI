import { MarketingHeader } from "@/components/marketing/Header";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingHeader />
      <main>{children}</main>
      <footer className="border-t border-line bg-white py-8 text-center text-sm text-ink-muted">© 2026 Onboard AI</footer>
    </>
  );
}
