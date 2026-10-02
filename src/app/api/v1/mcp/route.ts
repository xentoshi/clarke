import type { NextRequest } from "next/server";
import { handleMcpHttp } from "@/lib/mcp-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function handle(req: NextRequest) {
  return handleMcpHttp(req);
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
export const OPTIONS = handle;
