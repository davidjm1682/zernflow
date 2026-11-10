#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { loadConfig } from "./config";
import { registerTools } from "./register";
import { SupabaseFlowStore } from "./store";
import { createTools } from "./tools";

/**
 * ZernFlow MCP server (stdio). Lets an assistant create and edit flows as
 * DRAFTS. There is no tool to publish, delete, or touch `triggers`.
 *
 * stdout is the MCP channel: nothing may be printed there except protocol
 * messages, and the service key is never logged anywhere.
 */

async function main() {
  const config = loadConfig();
  const client = createClient(config.supabaseUrl, config.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const tools = createTools(new SupabaseFlowStore(client, config.workspaceId));
  const redact = (text: string) => text.split(config.serviceKey).join("[redactado]");

  const server = new McpServer({ name: "zernflow", version: "0.1.0" });
  registerTools(server, tools, redact);

  await server.connect(new StdioServerTransport());
}

main().catch((err) => {
  // Config errors only: they name variables, never values.
  console.error(`zernflow-mcp: ${err instanceof Error ? err.message : "error al iniciar"}`);
  process.exit(1);
});
