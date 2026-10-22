import Link from "next/link";

export default function PricingClient() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <p className="text-muted text-[14px] mb-3">Access</p>
      <h1 className="text-4xl sm:text-5xl font-semibold text-ink tracking-tight mb-4">Registry access is free</h1>
      <p className="text-muted text-base mb-10 leading-relaxed max-w-2xl">
        The public GEO registry, slot pages, agents API, and remote MCP are free.
        For the paid seat, message{" "}
        <a href="https://x.com/ClarkeBeltFi" className="text-ink underline" target="_blank" rel="noopener noreferrer">@ClarkeBeltFi</a> on X.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="border border-line bg-surface p-6">
          <div className="text-faint text-sm mb-2">Free</div>
          <div className="text-ink text-2xl font-semibold mb-4">$0</div>
          <ul className="text-muted text-sm space-y-2 mb-6">
            <li>Public GEO registry</li>
            <li>Slot pages with occupancy, FCC filings, freshness, and disputes</li>
            <li>CSV of the current registry view</li>
            <li>Public agents API and remote MCP. <Link href="/docs/agent-api" className="text-ink underline">Field list</Link></li>
          </ul>
          <Link href="/orbital" className="text-sm text-ink hover:text-muted">Open registry →</Link>
        </div>
        <div className="border border-ink/20 bg-surface p-6">
          <div className="text-faint text-sm mb-2">Paid seat</div>
          <div className="text-ink text-2xl font-semibold mb-4">@ClarkeBeltFi</div>
          <ul className="text-muted text-sm space-y-2 mb-6">
            <li>Valuation driver breakdown</li>
            <li>Longer model path</li>
            <li>Compare and export with driver columns</li>
            <li>Terminal API key</li>
          </ul>
          <a href="https://x.com/ClarkeBeltFi" className="text-sm text-ink underline" target="_blank" rel="noopener noreferrer">
            Message @ClarkeBeltFi on X
          </a>
        </div>
      </div>
    </div>
  );
}
