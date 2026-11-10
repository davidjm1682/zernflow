import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createClient } from "@supabase/supabase-js";
import { bearerMatches, isUsableToken, isUuid } from "@/mcp/src/auth";
import { registerTools } from "@/mcp/src/register";
import { SupabaseFlowStore } from "@/mcp/src/store";
import { createTools } from "@/mcp/src/tools";

/**
 * Remote MCP endpoint (Streamable HTTP, stateless).
 *
 * Exposes the same draft-only tools as the local stdio server: it can create and
 * edit flows as drafts, and cannot publish, delete, or touch `triggers`.
 *
 * Env:
 *  - MCP_API_TOKEN               shared secret, min 32 chars (clients send `Authorization: Bearer <token>`)
 *  - ZERNFLOW_MCP_WORKSPACE_ID   the single workspace this endpoint may touch
 *  - NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY   already configured for the app
 *
 * Fails closed: if the token or workspace is not configured, the endpoint is disabled.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });
}

async function handle(request: Request): Promise<Response> {
  const token = process.env.MCP_API_TOKEN;
  const workspaceId = process.env.ZERNFLOW_MCP_WORKSPACE_ID;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isUsableToken(token) || !isUuid(workspaceId) || !supabaseUrl || !serviceKey) {
    return json(503, { error: "El MCP remoto está deshabilitado." });
  }

  if (!bearerMatches(request.headers.get("authorization"), token)) {
    return json(401, { error: "No autorizado." }, { "www-authenticate": 'Bearer realm="zernflow-mcp"' });
  }

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const tools = createTools(new SupabaseFlowStore(client, workspaceId));
  const redact = (text: string) => text.split(serviceKey).join("[redactado]");

  const server = new McpServer({ name: "zernflow", version: "0.1.0" });
  registerTools(server, tools, redact);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless: one server per request
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
}

export { handle as GET, handle as POST, handle as DELETE };
