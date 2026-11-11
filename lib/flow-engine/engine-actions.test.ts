/**
 * The flow builder stores action nodes as `type: "action"` with the concrete
 * kind in `data.actionType`; templates store the kind as `node.type`. Both
 * shapes must execute, and "addTag" must add the tag (it used to remove it).
 */

import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { executeNode } from "./engine";
import { resolveNodeType } from "./node-type";
import type { FlowExecutionContext, FlowNode } from "./types";

type Op = [string, unknown[]];
interface Call {
  table: string;
  ops: Op[];
}

/** Chainable Supabase stub that records tables and operations. */
function fakeSupabase() {
  const calls: Call[] = [];
  const client = {
    from(table: string) {
      const call: Call = { table, ops: [] };
      calls.push(call);
      const builder: Record<string, unknown> = {};
      for (const op of ["select", "insert", "update", "upsert", "delete", "eq", "order", "limit"]) {
        builder[op] = (...args: unknown[]) => {
          call.ops.push([op, args]);
          return builder;
        };
      }
      const result = { data: { id: "tag-1" }, error: null };
      builder.single = () => Promise.resolve(result);
      builder.maybeSingle = () => Promise.resolve(result);
      builder.then = (resolve: (v: unknown) => unknown) => resolve(result);
      return builder;
    },
  };
  return { client: client as unknown as SupabaseClient, calls };
}

const context = {
  workspaceId: "ws-1",
  contactId: "contact-1",
  channelId: "ch-1",
  flowId: "flow-1",
  variables: {},
} as unknown as FlowExecutionContext;

const node = (type: string, data: Record<string, unknown>) =>
  ({ id: "n1", type, data, position: { x: 0, y: 0 } }) as unknown as FlowNode;

const hasOp = (calls: Call[], table: string, op: string) =>
  calls.some((c) => c.table === table && c.ops.some(([o]) => o === op));

describe("resolveNodeType", () => {
  it("resuelve action + actionType al tipo concreto", () => {
    expect(resolveNodeType({ type: "action", data: { actionType: "addTag" } })).toBe("addTag");
  });

  it("deja intactos los tipos que ya son concretos", () => {
    expect(resolveNodeType({ type: "addTag", data: { tagName: "x" } })).toBe("addTag");
    expect(resolveNodeType({ type: "sendMessage", data: {} })).toBe("sendMessage");
  });

  it("un action sin actionType sigue siendo action", () => {
    expect(resolveNodeType({ type: "action", data: {} })).toBe("action");
    expect(resolveNodeType({ type: "action" })).toBe("action");
    expect(resolveNodeType({ type: "action", data: { actionType: "" } })).toBe("action");
  });
});

describe("executeNode con nodos de acción", () => {
  it("action + addTag AÑADE la etiqueta (formato del constructor)", async () => {
    const { client, calls } = fakeSupabase();
    await executeNode(client, node("action", { actionType: "addTag", tagName: "lead" }), context, "s1");

    expect(hasOp(calls, "tags", "upsert")).toBe(true);
    expect(hasOp(calls, "contact_tags", "upsert")).toBe(true);
    expect(hasOp(calls, "contact_tags", "delete")).toBe(false);
  });

  it("addTag como node.type AÑADE la etiqueta (formato de las plantillas, que antes la quitaba)", async () => {
    const { client, calls } = fakeSupabase();
    await executeNode(client, node("addTag", { tagName: "lead" }), context, "s1");

    expect(hasOp(calls, "contact_tags", "upsert")).toBe(true);
    expect(hasOp(calls, "contact_tags", "delete")).toBe(false);
  });

  it("action + removeTag QUITA la etiqueta", async () => {
    const { client, calls } = fakeSupabase();
    await executeNode(client, node("action", { actionType: "removeTag", tagName: "lead" }), context, "s1");

    expect(hasOp(calls, "contact_tags", "delete")).toBe(true);
    expect(hasOp(calls, "contact_tags", "upsert")).toBe(false);
  });

  it("action + subscribe / unsubscribe actualiza is_subscribed", async () => {
    for (const [actionType, expected] of [
      ["subscribe", true],
      ["unsubscribe", false],
    ] as const) {
      const { client, calls } = fakeSupabase();
      await executeNode(client, node("action", { actionType }), context, "s1");

      const update = calls.find((c) => c.table === "contacts")?.ops.find(([o]) => o === "update");
      expect(update?.[1][0]).toEqual({ is_subscribed: expected });
    }
  });

  it("action + abSplit devuelve la rama elegida", async () => {
    const { client } = fakeSupabase();
    const result = await executeNode(
      client,
      node("action", {
        actionType: "abSplit",
        paths: [
          { name: "A", weight: 100 },
          { name: "B", weight: 0 },
        ],
      }),
      context,
      "s1",
    );
    expect(result).toBe("handle:A");
  });

  it("action sin actionType no hace nada ni falla", async () => {
    const { client, calls } = fakeSupabase();
    await expect(executeNode(client, node("action", {}), context, "s1")).resolves.toBeUndefined();
    expect(calls).toHaveLength(0);
  });
});
