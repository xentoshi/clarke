export const HOW_TO_TITLE = "How to use Clarke";

export type HowToPiece =
  | { type: "text"; text: string }
  | { type: "link"; href: string; text: string };

/**
 * Four steps on /docs. The registry homepage links here from the footer.
 * Each step is one sentence and names a control that exists in the UI.
 */
export const HOW_TO_STEPS: HowToPiece[][] = [
  [
    { type: "text", text: "Open the registry at " },
    { type: "link", href: "/orbital", text: "/orbital" },
    {
      type: "text",
      text: " and filter by a longitude window on the belt, an operator chip under More, or a country in the search box.",
    },
  ],
  [
    { type: "text", text: "Click the " },
    { type: "link", href: "/orbital/101w", text: "101°W" },
    {
      type: "text",
      text: " slot label to open the Slot Terminal and see the registry operator, the FCC rows, and Position disagreement.",
    },
  ],
  [
    { type: "text", text: "Click Download CSV to export the current registry view, or click FCC licensed to keep licensed rows, or open " },
    { type: "link", href: "/orbital/map", text: "Belt" },
    { type: "text", text: " and click an operator chip." },
  ],
  [
    { type: "text", text: "Point an MCP client at " },
    {
      type: "link",
      href: "https://www.clarkebelt.finance/api/v1/mcp",
      text: "https://www.clarkebelt.finance/api/v1/mcp",
    },
    { type: "text", text: ", where reads are open, and use " },
    { type: "link", href: "/llms.txt", text: "/llms.txt" },
    { type: "text", text: " for discovery." },
  ],
];

export function howToStepText(step: HowToPiece[]): string {
  return step.map((piece) => piece.text).join("");
}
