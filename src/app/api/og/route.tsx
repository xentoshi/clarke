import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "Frontier";
  const sub = searchParams.get("sub") ?? "Multiplanetary Infrastructure Directory";
  const tag = searchParams.get("tag") ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 50%), linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "100% 100%, 40px 40px, 40px 40px",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "#ffffff", fontSize: "22px", fontWeight: "bold", letterSpacing: "4px" }}>
            FRONTIER
          </span>
          <span style={{ color: "#3f3f46", fontSize: "12px", letterSpacing: "3px", textTransform: "uppercase" }}>
            Multiplanetary Infrastructure
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {tag && (
            <span style={{ color: "#a1a1aa", fontSize: "13px", letterSpacing: "3px", textTransform: "uppercase", border: "1px solid #3f3f46", padding: "4px 12px", borderRadius: "6px", width: "fit-content" }}>
              {tag}
            </span>
          )}
          <div style={{ color: "#ffffff", fontSize: "52px", fontWeight: "bold", lineHeight: 1.1, maxWidth: "900px" }}>
            {title}
          </div>
          <div style={{ color: "#71717a", fontSize: "22px", maxWidth: "800px", lineHeight: 1.4 }}>
            {sub}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#3f3f46", fontSize: "13px" }}>frontier.space</span>
          <span style={{ color: "#3f3f46", fontSize: "13px" }}>84 companies · 13 verticals</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
