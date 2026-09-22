import type { RightsLink } from "./rights-chain";

// Default Slot Terminal is a public-registry dossier, not a market screen.
// Stubs and simulations stay in the model (API / Experimental disclosure)
// but must not appear as filled primary panels.

export const TERMINAL_DEFAULT = {
  showSimulatedBook: false,
  showRightsStubs: false,
  showValuationSparkline: false,
} as const;

export type TrustClass = "V" | "M" | "S";

export const TRUST_CLASS_LABEL: Record<TrustClass, string> = {
  V: "Verified from a named public source in this product",
  M: "Modeled / heuristic / hand estimate — labeled, not a tape",
  S: "Stub or simulated — not recorded public data",
};

const STUB_LAYERS = new Set<RightsLink["layer"]>(["itu", "sublease"]);

export function isRightsStub(link: RightsLink): boolean {
  return link.status === "stub" || STUB_LAYERS.has(link.layer);
}

/** FCC / administration layers that belong on the default Terminal. */
export function recordedRightsLayers(links: RightsLink[]): RightsLink[] {
  return links.filter((link) => !isRightsStub(link));
}

/** ITU filing + sub-lease stubs. Experimental only. Not a filled default panel. */
export function stubRightsLayers(links: RightsLink[]): RightsLink[] {
  return links.filter((link) => isRightsStub(link));
}

export interface DefaultTerminalSignals {
  occupancy: string;
  fccCount: number;
  modelPoint: string;
  modelRange: string;
  curatedEstimate?: string;
  rights: RightsLink[];
  includeSimulatedBook?: boolean;
  includeSparkline?: boolean;
}

/**
 * Markup for the *primary* Terminal region used by tests. Must not contain
 * the simulated book, ITU stub copy, or a trade-like sparkline. Curated
 * overlays appear only as a secondary hand-estimate line.
 */
export function defaultTerminalPrimaryMarkup(signals: DefaultTerminalSignals): string {
  const recorded = recordedRightsLayers(signals.rights);
  const rightsHtml = recorded
    .map(
      (l) =>
        `<div data-rights-layer="${l.layer}" data-rights-status="${l.status}">` +
        `<span>${escapeHtml(l.title)}</span> ${escapeHtml(l.holder)}</div>`,
    )
    .join("");

  const curated =
    signals.curatedEstimate
      ? `<p data-curated-overlay="hand-estimate">` +
        `<span data-trust-class="M">M</span> Hand estimate / curated opinion: ${escapeHtml(signals.curatedEstimate)}. ` +
        `Secondary to the model range — not a competing headline, not a trade.</p>`
      : "";

  const sim =
    signals.includeSimulatedBook
      ? `<section data-sim-book>Simulated capacity book Bids Asks</section>`
      : "";
  const spark =
    signals.includeSparkline
      ? `<section data-sparkline>30-day history</section>`
      : "";

  return (
    `<div data-terminal-primary>` +
    `<section data-occupancy>Occupancy ${escapeHtml(signals.occupancy)}</section>` +
    `<section data-fcc>FCC ×${signals.fccCount} recorded license rows</section>` +
    `<section data-model>` +
    `<span data-trust-class="M">M</span> Fair value (v0) ${escapeHtml(signals.modelPoint)} ` +
    `${escapeHtml(signals.modelRange)} CI — labeled model, not a live market price` +
    curated +
    `</section>` +
    `<section data-recorded-rights>${rightsHtml}</section>` +
    `</div>` +
    sim +
    spark
  );
}

export function primaryTerminalRegion(html: string): string {
  const match = html.match(/data-terminal-primary[\s\S]*?(?=<[^>]+data-terminal-experimental|$)/i);
  if (match) return match[0];
  const end = html.indexOf("data-terminal-experimental");
  return end >= 0 ? html.slice(0, end) : html;
}

export function defaultTerminalRendersSimBookAsPrimary(html: string): boolean {
  const primary = primaryTerminalRegion(html);
  return /simulated capacity book/i.test(primary) || /data-sim-book/i.test(primary);
}

export function defaultTerminalRendersItuStubAsPrimary(html: string): boolean {
  const primary = primaryTerminalRegion(html);
  // Thin Unrecorded chip is allowed. A filled ITU rights row is not.
  return /data-rights-layer="itu"/i.test(primary);
}

export function defaultTerminalRendersSubleaseStubAsPrimary(html: string): boolean {
  const primary = primaryTerminalRegion(html);
  return /Sub-lease/i.test(primary) || /data-rights-layer="sublease"/i.test(primary);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
