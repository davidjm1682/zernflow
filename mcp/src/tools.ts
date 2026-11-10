import { z } from "zod";
import { buildCommentToDmFlow, commentToDmInput } from "./flow-builders";
import { validateGraph } from "./schemas";
import type { FlowStore } from "./store";

/**
 * Tool handlers. Pure functions over a FlowStore so they can be tested without
 * a database. There is intentionally no publish, delete or trigger tool here.
 */

const uuid = z.string().uuid();

export const createFlowDraftInput = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional(),
  nodes: z.array(z.unknown()),
  edges: z.array(z.unknown()),
});

export const updateFlowDraftInput = z.object({
  flowId: uuid,
  name: z.string().trim().min(1).optional(),
  nodes: z.array(z.unknown()).optional(),
  edges: z.array(z.unknown()).optional(),
});

export const getFlowInput = z.object({ flowId: uuid });

export function createTools(store: FlowStore) {
  return {
    async listChannels() {
      const rows = await store.listChannels();
      return rows.map((c) => ({
        id: c.id,
        platform: c.platform,
        name: c.display_name ?? c.username ?? null,
      }));
    },

    async listFlows() {
      return store.listFlows();
    },

    async getFlow(input: unknown) {
      const { flowId } = getFlowInput.parse(input);
      const flow = await store.getFlow(flowId);
      if (!flow) throw new Error("Flujo no encontrado en este workspace.");
      return flow;
    },

    async createFlowDraft(input: unknown) {
      const parsed = createFlowDraftInput.parse(input);
      const { nodes, edges } = validateGraph(parsed.nodes, parsed.edges);
      const flow = await store.insertDraft({
        name: parsed.name,
        description: parsed.description,
        nodes,
        edges,
      });
      return { id: flow.id, name: flow.name, status: flow.status, version: flow.version };
    },

    async updateFlowDraft(input: unknown) {
      const parsed = updateFlowDraftInput.parse(input);
      const existing = await store.getFlow(parsed.flowId);
      if (!existing) throw new Error("Flujo no encontrado en este workspace.");
      if (existing.status !== "draft") {
        throw new Error(
          `Este flujo está en estado "${existing.status}". Solo se pueden editar flujos en borrador (draft); no se modificó nada.`,
        );
      }
      if (parsed.name === undefined && parsed.nodes === undefined && parsed.edges === undefined) {
        throw new Error("No hay nada que actualizar: envía name, nodes o edges.");
      }

      const patch: { name?: string; nodes?: unknown; edges?: unknown } = {};
      if (parsed.name !== undefined) patch.name = parsed.name;
      if (parsed.nodes !== undefined || parsed.edges !== undefined) {
        // Validate the merged graph so a half-update cannot leave dangling edges.
        const { nodes, edges } = validateGraph(parsed.nodes ?? existing.nodes, parsed.edges ?? existing.edges);
        if (parsed.nodes !== undefined) patch.nodes = nodes;
        if (parsed.edges !== undefined) patch.edges = edges;
      }

      const updated = await store.updateDraft(parsed.flowId, patch);
      if (!updated) {
        throw new Error("El flujo dejó de ser borrador mientras se actualizaba; no se modificó nada.");
      }
      return { id: parsed.flowId, status: "draft", updated: Object.keys(patch) };
    },

    async buildCommentToDmFlow(input: unknown) {
      const parsed = commentToDmInput.parse(input);
      const built = buildCommentToDmFlow(parsed);
      const { nodes, edges } = validateGraph(built.nodes, built.edges);
      return { name: built.name, nodes, edges };
    },
  };
}

export type Tools = ReturnType<typeof createTools>;
