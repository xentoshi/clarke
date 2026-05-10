import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = (searchParams.get("title") ?? "Clarke").slice(0, 80);
  const sub = (searchParams.get("sub") ?? "").slice(0, 200);
  const tag = (searchParams.get("tag") ?? "").slice(0, 40);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px",
          background: "#060608",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", marginBottom: "auto", paddingTop: "60px" }}>
          <span style={{ color: "#ffffff", fontSize: 28, fontWeight: 700, letterSpacing: 4 }}>
            CLARKE
          </span>
        </div>
        {tag && (
          <div
            style={{
              color: "#52525b",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: 4,
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            {tag}
          </div>
        )}
        <div style={{ color: "#ffffff", fontSize: 52, fontWeight: 700, lineHeight: 1.1, marginBottom: 20 }}>
          {title}
        </div>
        {sub && (
          <div style={{ color: "#71717a", fontSize: 22, lineHeight: 1.5, maxWidth: 860 }}>
            {sub}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
