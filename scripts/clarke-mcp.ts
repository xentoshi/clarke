/**
 * Clarke MCP server entry point.
 *
 * Run locally with:
 *   npm run mcp
 *
 * Or wire into Claude Code / Cursor by adding the following to your MCP config
 * (path must be absolute, cwd ensures the SQLite DB is found):
 *
 *   {
 *     "mcpServers": {
 *       "clarke": {
 *         "command": "npx",
 *         "args": [
 *           "ts-node",
 *           "--project",
 *           "tsconfig.scripts.json",
 *           "scripts/clarke-mcp.ts"
 *         ],
 *         "cwd": "/absolute/path/to/clarke"
 *       }
 *     }
 *   }
 */

import * as path from "path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "../src/mcp/server";

// Anchor cwd to the package root so getDb() finds data/clarke.db regardless
// of how the MCP host invokes us.
process.chdir(path.resolve(__dirname, ".."));

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Keep the process alive until stdin closes.
  process.stdin.on("close", () => process.exit(0));
}

main().catch((err) => {
  console.error("Clarke MCP server failed to start:", err);
  process.exit(1);
});
