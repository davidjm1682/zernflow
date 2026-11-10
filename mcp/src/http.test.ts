import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bearerMatches, isUsableToken, isUuid } from "./auth";

const TOKEN = "t".repeat(40);
const WORKSPACE = "11111111-1111-4111-8111-111111111111";

describe("auth del MCP remoto", () => {
  it("acepta solo el token exacto en formato Bearer", () => {
    expect(bearerMatches(`Bearer ${TOKEN}`, TOKEN)).toBe(true);
    expect(bearerMatches(`bearer ${TOKEN}`, TOKEN)).toBe(true);
    expect(bearerMatches(`Bearer ${TOKEN}x`, TOKEN)).toBe(false);
    expect(bearerMatches(TOKEN, TOKEN)).toBe(false);
    expect(bearerMatches("", TOKEN)).toBe(false);
    expect(bearerMatches(null, TOKEN)).toBe(false);
  });

  it("exige un token de al menos 32 caracteres", () => {
    expect(isUsableToken("corto")).toBe(false);
    expect(isUsableToken(undefined)).toBe(false);
    expect(isUsableToken(TOKEN)).toBe(true);
  });

  it("valida el UUID del workspace", () => {
    expect(isUuid(WORKSPACE)).toBe(true);
    expect(isUuid("abc")).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });
});

describe("POST /api/mcp", () => {
  const env = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-key";
    process.env.MCP_API_TOKEN = TOKEN;
    process.env.ZERNFLOW_MCP_WORKSPACE_ID = WORKSPACE;
  });
  afterEach(() => {
    process.env = { ...env };
  });

  const call = async (headers: Record<string, string>, body: unknown) => {
    const { POST } = await import("../../app/api/mcp/route");
    return POST(
      new Request("http://localhost/api/mcp", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json, text/event-stream", ...headers },
        body: JSON.stringify(body),
      }),
    );
  };

  const listTools = { jsonrpc: "2.0", id: 1, method: "tools/list" };

  it("responde 401 sin token y con token incorrecto", async () => {
    expect((await call({}, listTools)).status).toBe(401);
    expect((await call({ authorization: "Bearer incorrecto" }, listTools)).status).toBe(401);
  });

  it("falla cerrado (503) si el token no está configurado o es débil", async () => {
    delete process.env.MCP_API_TOKEN;
    expect((await call({ authorization: `Bearer ${TOKEN}` }, listTools)).status).toBe(503);
    process.env.MCP_API_TOKEN = "corto";
    expect((await call({ authorization: "Bearer corto" }, listTools)).status).toBe(503);
  });

  it("falla cerrado (503) si falta el workspace", async () => {
    delete process.env.ZERNFLOW_MCP_WORKSPACE_ID;
    expect((await call({ authorization: `Bearer ${TOKEN}` }, listTools)).status).toBe(503);
  });

  it("con token válido lista exactamente las 6 herramientas de borrador", async () => {
    const res = await call({ authorization: `Bearer ${TOKEN}` }, listTools);
    expect(res.status).toBe(200);
    const body = await res.json();
    const names = body.result.tools.map((t: { name: string }) => t.name).sort();
    expect(names).toEqual(
      ["build_comment_to_dm_flow", "create_flow_draft", "get_flow", "list_channels", "list_flows", "update_flow_draft"],
    );
    expect(JSON.stringify(body)).not.toContain("fake-service-key");
  });
});
