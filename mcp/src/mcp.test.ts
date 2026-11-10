import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildDesiredTriggers } from "../../lib/flow-triggers";
import { loadConfig } from "./config";
import { buildCommentToDmFlow } from "./flow-builders";
import { validateGraph } from "./schemas";
import { SupabaseFlowStore, type FlowRow, type FlowStore } from "./store";
import { createTools } from "./tools";

const WORKSPACE = "11111111-1111-4111-8111-111111111111";
const FLOW_ID = "22222222-2222-4222-8222-222222222222";

// ---------- helpers ----------

/** Chainable Supabase stub that records every table, operation and filter. */
function recordingClient(rows: unknown = []) {
  const calls: Array<{ table: string; ops: Array<[string, unknown[]]> }> = [];
  const client = {
    from(table: string) {
      const entry = { table, ops: [] as Array<[string, unknown[]]> };
      calls.push(entry);
      const builder: Record<string, unknown> = {};
      for (const op of ["select", "insert", "update", "delete", "upsert", "eq", "order", "single", "maybeSingle"]) {
        builder[op] = (...args: unknown[]) => {
          entry.ops.push([op, args]);
          return builder;
        };
      }
      builder.then = (resolve: (v: unknown) => unknown) => resolve({ data: rows, error: null });
      return builder;
    },
  };
  return { client: client as unknown as SupabaseClient, calls };
}

function fakeStore(flow: Partial<FlowRow> | null): FlowStore & { updateDraft: ReturnType<typeof vi.fn>; insertDraft: ReturnType<typeof vi.fn> } {
  return {
    listChannels: vi.fn(async () => []),
    listFlows: vi.fn(async () => []),
    getFlow: vi.fn(async () =>
      flow ? ({ id: FLOW_ID, name: "f", status: "draft", version: 1, updated_at: "", description: null, nodes: [], edges: [], viewport: null, ...flow } as FlowRow) : null,
    ),
    insertDraft: vi.fn(async (i) => ({ id: FLOW_ID, name: i.name, status: "draft", version: 1, updated_at: "", description: null, nodes: i.nodes, edges: i.edges, viewport: null })),
    updateDraft: vi.fn(async () => true),
  };
}

const sampleFlow = buildCommentToDmFlow({
  name: "Comentario a DM",
  keyword: "focus",
  matchType: "contains",
  publicReply: "Te lo envié por DM",
  dmText: "Hola, aquí tienes la guía",
  dmButton: { label: "Descargar", url: "https://example.com/guia" },
  tag: "lead-focus",
});

// ---------- update guard ----------

describe("update_flow_draft", () => {
  it.each(["published", "archived"])("rechaza flujos en estado %s sin escribir nada", async (status) => {
    const store = fakeStore({ status });
    const tools = createTools(store);

    await expect(tools.updateFlowDraft({ flowId: FLOW_ID, name: "nuevo" })).rejects.toThrow(/solo se pueden editar flujos en borrador/i);
    expect(store.updateDraft).not.toHaveBeenCalled();
  });

  it("actualiza un borrador", async () => {
    const store = fakeStore({ status: "draft" });
    const tools = createTools(store);

    await tools.updateFlowDraft({ flowId: FLOW_ID, name: "nuevo", nodes: sampleFlow.nodes, edges: sampleFlow.edges });
    expect(store.updateDraft).toHaveBeenCalledTimes(1);
  });

  it("el UPDATE exige status=draft y el workspace en la consulta", async () => {
    const { client, calls } = recordingClient([{ id: FLOW_ID }]);
    const store = new SupabaseFlowStore(client, WORKSPACE);

    await store.updateDraft(FLOW_ID, { name: "x" });

    const ops = calls[0].ops;
    expect(ops).toContainEqual(["eq", ["status", "draft"]]);
    expect(ops).toContainEqual(["eq", ["workspace_id", WORKSPACE]]);
  });

  it("no pisa un flujo que se publicó entre la lectura y la escritura", async () => {
    const { client } = recordingClient([]); // 0 filas coincidieron con status=draft
    const store = new SupabaseFlowStore(client, WORKSPACE);
    expect(await store.updateDraft(FLOW_ID, { name: "x" })).toBe(false);
  });

  it("valida el grafo combinado: edges que apuntan a nodos inexistentes se rechazan", async () => {
    const store = fakeStore({ status: "draft", nodes: sampleFlow.nodes, edges: sampleFlow.edges });
    const tools = createTools(store);
    await expect(
      tools.updateFlowDraft({ flowId: FLOW_ID, edges: [{ id: "e", source: "trigger_1", target: "no-existe" }] }),
    ).rejects.toThrow(/destino inexistente/);
    expect(store.updateDraft).not.toHaveBeenCalled();
  });
});

// ---------- no writes to triggers ----------

describe("seguridad: nunca tocar triggers", () => {
  it("el store solo usa las tablas channels y flows, y solo escribe en flows", async () => {
    const { client, calls } = recordingClient([{ id: FLOW_ID }]);
    const store = new SupabaseFlowStore(client, WORKSPACE);

    await store.listChannels();
    await store.listFlows();
    await store.getFlow(FLOW_ID);
    await store.insertDraft({ name: "x", nodes: [], edges: [] });
    await store.updateDraft(FLOW_ID, { name: "y" });

    const tables = new Set(calls.map((c) => c.table));
    expect([...tables].sort()).toEqual(["channels", "flows"]);
    expect(tables.has("triggers")).toBe(false);

    const writes = calls.filter((c) => c.ops.some(([op]) => ["insert", "update", "delete", "upsert"].includes(op)));
    expect(writes.every((c) => c.table === "flows")).toBe(true);
    expect(calls.some((c) => c.ops.some(([op]) => op === "delete"))).toBe(false);
  });

  it("todas las consultas filtran por workspace_id", async () => {
    const { client, calls } = recordingClient([{ id: FLOW_ID }]);
    const store = new SupabaseFlowStore(client, WORKSPACE);

    await store.listChannels();
    await store.listFlows();
    await store.getFlow(FLOW_ID);
    await store.updateDraft(FLOW_ID, { name: "y" });

    for (const call of calls) {
      expect(call.ops).toContainEqual(["eq", ["workspace_id", WORKSPACE]]);
    }
  });

  it("insertDraft fuerza status draft, version 1 y el workspace configurado", async () => {
    const { client, calls } = recordingClient({ id: FLOW_ID });
    const store = new SupabaseFlowStore(client, WORKSPACE);

    await store.insertDraft({ name: "x", nodes: [], edges: [] });

    const insert = calls[0].ops.find(([op]) => op === "insert");
    expect(insert?.[1][0]).toMatchObject({ workspace_id: WORKSPACE, status: "draft", version: 1 });
  });

  it("el código de mcp/src no menciona triggers ni expone herramientas de publicar o borrar", () => {
    const dir = __dirname;
    const sources = readdirSync(dir)
      .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
      .map((f) => readFileSync(join(dir, f), "utf8"));
    const code = sources.join("\n");

    expect(code).not.toMatch(/from\(\s*["']triggers["']\s*\)/);
    expect(code).not.toMatch(/registerTool\(\s*["'][a-z_]*(publish|delete|trigger)[a-z_]*["']/);
    expect(code).not.toMatch(/\.delete\(/);
    expect(code).not.toMatch(/status:\s*["']published["']/);
  });
});

// ---------- validation ----------

describe("validación con zod", () => {
  it("rechaza un nodo de tipo desconocido", () => {
    expect(() =>
      validateGraph([{ id: "n1", type: "webhookMagico", position: { x: 0, y: 0 }, data: {} }], []),
    ).toThrow(/Nodos inválidos/);
  });

  it("rechaza un trigger con triggerType inválido", () => {
    expect(() =>
      validateGraph([{ id: "n1", type: "trigger", position: { x: 0, y: 0 }, data: { triggerType: "nope" } }], []),
    ).toThrow(/Nodos inválidos/);
  });

  it("rechaza ids de nodo duplicados", () => {
    const n = sampleFlow.nodes[0];
    expect(() => validateGraph([n, n], [])).toThrow(/duplicado/);
  });

  it("create_flow_draft rechaza tipos desconocidos antes de tocar la base", async () => {
    const store = fakeStore(null);
    const tools = createTools(store);
    await expect(
      tools.createFlowDraft({ name: "x", nodes: [{ id: "a", type: "boom", position: { x: 0, y: 0 }, data: {} }], edges: [] }),
    ).rejects.toThrow();
    expect(store.insertDraft).not.toHaveBeenCalled();
  });

  it("create_flow_draft guarda un grafo válido como borrador", async () => {
    const store = fakeStore(null);
    const tools = createTools(store);
    const res = await tools.createFlowDraft({ name: "x", nodes: sampleFlow.nodes, edges: sampleFlow.edges });
    expect(res).toMatchObject({ status: "draft", version: 1 });
  });
});

// ---------- build_comment_to_dm_flow ----------

describe("build_comment_to_dm_flow", () => {
  it("genera un trigger que buildDesiredTriggers interpreta como comment_keyword", () => {
    const rows = buildDesiredTriggers(sampleFlow.nodes as unknown as Array<Record<string, unknown>>, FLOW_ID);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      flow_id: FLOW_ID,
      type: "comment_keyword",
      is_active: true,
      config: {
        keywords: [{ value: "focus", matchType: "contains" }],
        replyText: "Te lo envié por DM",
      },
    });
  });

  it("usa los tipos de nodo que registra el constructor y conexiones coherentes", () => {
    const registered = ["trigger", "sendMessage", "condition", "delay", "action", "aiResponse"];
    expect(sampleFlow.nodes.map((n) => n.type).every((t) => registered.includes(t))).toBe(true);
    expect(sampleFlow.nodes.map((n) => n.type)).toEqual(["trigger", "sendMessage", "action"]);
    expect(sampleFlow.edges.map((e) => [e.source, e.target])).toEqual([
      ["trigger_1", "send_1"],
      ["send_1", "tag_1"],
    ]);
    expect(() => validateGraph(sampleFlow.nodes, sampleFlow.edges)).not.toThrow();
  });

  it("incluye el botón URL y la etiqueta con el formato del constructor", () => {
    const send = sampleFlow.nodes[1].data as { messages: Array<{ text: string; buttons: unknown[] }> };
    expect(send.messages[0].buttons).toEqual([{ type: "url", title: "Descargar", url: "https://example.com/guia" }]);
    expect(sampleFlow.nodes[2].data).toMatchObject({ actionType: "addTag", tagName: "lead-focus" });
  });

  it("omite el nodo de etiqueta cuando no se pide", () => {
    const f = buildCommentToDmFlow({ name: "x", keyword: "a", publicReply: "r", dmText: "d" });
    expect(f.nodes).toHaveLength(2);
    expect(f.edges).toHaveLength(1);
    expect(f.nodes[0].data).toMatchObject({ keywords: [{ value: "a", matchType: "contains" }] });
  });
});

// ---------- config / secrets ----------

describe("configuración y secretos", () => {
  const base = { SUPABASE_URL: "https://abc.supabase.co", ZERNFLOW_WORKSPACE_ID: WORKSPACE };

  it("lee la clave desde SUPABASE_SERVICE_ROLE_KEY", () => {
    expect(loadConfig({ ...base, SUPABASE_SERVICE_ROLE_KEY: "k" }).serviceKey).toBe("k");
  });

  it("lee la clave desde SERVICE_KEY_FILE cuando no hay variable", () => {
    const cfg = loadConfig({ ...base, SERVICE_KEY_FILE: "/ruta/clave" }, () => "clave-del-archivo\n");
    expect(cfg.serviceKey).toBe("clave-del-archivo");
  });

  it("los errores no incluyen el valor de la clave", () => {
    const secret = "super-secret-value";
    try {
      loadConfig({ SUPABASE_URL: "http://127.0.0.1:54321", ZERNFLOW_WORKSPACE_ID: WORKSPACE, SUPABASE_SERVICE_ROLE_KEY: secret });
    } catch (e) {
      expect((e as Error).message).not.toContain(secret);
    }
    expect(() => loadConfig({ ...base, SERVICE_KEY_FILE: "/no/existe" }, () => { throw new Error("ENOENT"); })).toThrow(/archivo de clave/);
  });

  it("rechaza URLs locales y workspaces que no son UUID", () => {
    expect(() => loadConfig({ ...base, SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_SERVICE_ROLE_KEY: "k" })).toThrow(/https/);
    expect(() => loadConfig({ ...base, ZERNFLOW_WORKSPACE_ID: "abc", SUPABASE_SERVICE_ROLE_KEY: "k" })).toThrow(/UUID/);
  });
});
