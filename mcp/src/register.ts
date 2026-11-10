import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { commentToDmInput } from "./flow-builders";
import type { Tools } from "./tools";

/**
 * Registers the six draft-only tools on an McpServer. Shared by the local stdio
 * server and the remote HTTP endpoint so both expose exactly the same surface.
 * There is intentionally no publish, delete or trigger tool.
 */
export function registerTools(server: McpServer, tools: Tools, redact: (text: string) => string) {
  const run = async (fn: () => Promise<unknown>) => {
    try {
      const result = await fn();
      return { content: [{ type: "text" as const, text: redact(JSON.stringify(result, null, 2)) }] };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      return { isError: true, content: [{ type: "text" as const, text: redact(message) }] };
    }
  };

  server.registerTool(
    "list_channels",
    { description: "Lista los canales conectados del workspace (id, plataforma, nombre)." },
    () => run(() => tools.listChannels()),
  );

  server.registerTool(
    "list_flows",
    { description: "Lista los flujos del workspace: id, nombre, status, version, updated_at." },
    () => run(() => tools.listFlows()),
  );

  server.registerTool(
    "get_flow",
    {
      description: "Devuelve un flujo completo (nodes y edges incluidos).",
      inputSchema: { flowId: z.string().uuid() },
    },
    (args) => run(() => tools.getFlow(args)),
  );

  server.registerTool(
    "create_flow_draft",
    {
      description:
        "Crea un flujo nuevo como BORRADOR (status draft, version 1). No lo publica ni activa triggers. " +
        "Tipos de nodo permitidos: trigger, sendMessage, condition, delay, action, aiResponse.",
      inputSchema: {
        name: z.string(),
        description: z.string().optional(),
        nodes: z.array(z.unknown()),
        edges: z.array(z.unknown()),
      },
    },
    (args) => run(() => tools.createFlowDraft(args)),
  );

  server.registerTool(
    "update_flow_draft",
    {
      description:
        "Actualiza nombre/nodes/edges de un flujo SOLO si está en borrador. Rechaza flujos publicados o archivados.",
      inputSchema: {
        flowId: z.string().uuid(),
        name: z.string().optional(),
        nodes: z.array(z.unknown()).optional(),
        edges: z.array(z.unknown()).optional(),
      },
    },
    (args) => run(() => tools.updateFlowDraft(args)),
  );

  server.registerTool(
    "build_comment_to_dm_flow",
    {
      description:
        "Genera nodes/edges válidos para el patrón comentario con palabra clave -> respuesta pública + DM (+ etiqueta). " +
        "No guarda nada: pasa el resultado a create_flow_draft.",
      inputSchema: commentToDmInput.shape,
    },
    (args) => run(() => tools.buildCommentToDmFlow(args)),
  );
}
