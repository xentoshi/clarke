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
          background: "#0b0c0e",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", marginBottom: "auto", paddingTop: "60px" }}>
          <span style={{ color: "#f3f1eb", fontSize: 28, fontWeight: 600 }}>
            Clarke
          </span>
        </div>
        {tag && (
          <div
            style={{
              color: "#6e6c66",
              fontSize: 16,
              fontWeight: 500,
              marginBottom: 16,
            }}
          >
            {tag}
          </div>
        )}
        <div style={{ color: "#f3f1eb", fontSize: 52, fontWeight: 600, lineHeight: 1.1, marginBottom: 20 }}>
          {title}
        </div>
        {sub && (
          <div style={{ color: "#a8a59c", fontSize: 22, lineHeight: 1.5, maxWidth: 860 }}>
            {sub}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
