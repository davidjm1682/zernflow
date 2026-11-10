import { z } from "zod";

/**
 * Node/edge schemas for the visual flow builder. They mirror what the canvas
 * stores (components/flow-builder/flow-canvas.tsx, nodes/, panels/):
 * node.type is one of the six registered React Flow node types, and every
 * "action" style node (tags, custom fields, HTTP, ...) is stored as
 * type "action" with data.actionType.
 *
 * `data` objects are passthrough so builder-only fields (label, ...) survive,
 * but the fields the runtime reads are validated.
 */

export const NODE_TYPES = [
  "trigger",
  "sendMessage",
  "condition",
  "delay",
  "action",
  "aiResponse",
] as const;

export const TRIGGER_TYPES = [
  "keyword",
  "postback",
  "quick_reply",
  "welcome",
  "default",
  "comment_keyword",
] as const;

export const ACTION_TYPES = [
  "addTag",
  "removeTag",
  "setCustomField",
  "httpRequest",
  "goToFlow",
  "subscribe",
  "unsubscribe",
  "humanTakeover",
  "abSplit",
  "smartDelay",
  "enrollSequence",
] as const;

export const MATCH_TYPES = ["exact", "contains", "startsWith"] as const;

const keywordSchema = z.object({
  value: z.string().trim().min(1),
  matchType: z.enum(MATCH_TYPES),
});

const buttonSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("url"), title: z.string().min(1).max(20), url: z.string().url() }),
  z.object({ type: z.literal("postback"), title: z.string().min(1).max(20), payload: z.string() }),
]);

const messageSchema = z
  .object({
    text: z.string().optional(),
    imageUrl: z.string().url().optional(),
    quickReplies: z.array(z.object({ title: z.string().min(1), payload: z.string() })).optional(),
    buttons: z.array(buttonSchema).max(3).optional(),
  })
  .passthrough();

const triggerData = z
  .object({
    triggerType: z.enum(TRIGGER_TYPES),
    keywords: z.array(keywordSchema).optional(),
    payload: z.string().optional(),
    alsoMatchInDms: z.boolean().optional(),
    replyText: z.string().optional(),
    postIds: z.array(z.string()).optional(),
  })
  .passthrough();

const sendMessageData = z.object({ messages: z.array(messageSchema) }).passthrough();

const conditionData = z
  .object({
    conditions: z.array(
      z.object({
        field: z.string(),
        operator: z.enum(["equals", "not_equals", "contains", "exists", "gt", "lt"]),
        value: z.string(),
      }),
    ),
    logic: z.enum(["and", "or"]),
  })
  .passthrough();

const delayData = z
  .object({
    duration: z.number().positive(),
    unit: z.enum(["seconds", "minutes", "hours", "days"]),
  })
  .passthrough();

const actionData = z.object({ actionType: z.enum(ACTION_TYPES) }).passthrough();

const aiResponseData = z.object({ systemPrompt: z.string(), model: z.string() }).passthrough();

const position = z.object({ x: z.number(), y: z.number() });

const nodeBase = { id: z.string().min(1), position };

export const flowNodeSchema = z.discriminatedUnion("type", [
  z.object({ ...nodeBase, type: z.literal("trigger"), data: triggerData }).passthrough(),
  z.object({ ...nodeBase, type: z.literal("sendMessage"), data: sendMessageData }).passthrough(),
  z.object({ ...nodeBase, type: z.literal("condition"), data: conditionData }).passthrough(),
  z.object({ ...nodeBase, type: z.literal("delay"), data: delayData }).passthrough(),
  z.object({ ...nodeBase, type: z.literal("action"), data: actionData }).passthrough(),
  z.object({ ...nodeBase, type: z.literal("aiResponse"), data: aiResponseData }).passthrough(),
]);

export const flowEdgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    sourceHandle: z.string().nullish(),
    label: z.string().optional(),
  })
  .passthrough();

export type FlowNode = z.infer<typeof flowNodeSchema>;
export type FlowEdge = z.infer<typeof flowEdgeSchema>;

/**
 * Validates a node/edge graph: schemas plus referential integrity
 * (unique ids, edges pointing at existing nodes). Throws a readable Error.
 */
export function validateGraph(rawNodes: unknown, rawEdges: unknown): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodesResult = z.array(flowNodeSchema).safeParse(rawNodes);
  if (!nodesResult.success) {
    throw new Error(`Nodos inválidos: ${formatIssues(nodesResult.error)}. Tipos permitidos: ${NODE_TYPES.join(", ")}.`);
  }
  const edgesResult = z.array(flowEdgeSchema).safeParse(rawEdges);
  if (!edgesResult.success) {
    throw new Error(`Conexiones (edges) inválidas: ${formatIssues(edgesResult.error)}.`);
  }
  const nodes = nodesResult.data;
  const edges = edgesResult.data;

  const ids = new Set<string>();
  for (const n of nodes) {
    if (ids.has(n.id)) throw new Error(`Id de nodo duplicado: "${n.id}".`);
    ids.add(n.id);
  }
  const edgeIds = new Set<string>();
  for (const e of edges) {
    if (edgeIds.has(e.id)) throw new Error(`Id de conexión duplicado: "${e.id}".`);
    edgeIds.add(e.id);
    if (!ids.has(e.source)) throw new Error(`La conexión "${e.id}" apunta a un nodo origen inexistente: "${e.source}".`);
    if (!ids.has(e.target)) throw new Error(`La conexión "${e.id}" apunta a un nodo destino inexistente: "${e.target}".`);
  }
  return { nodes, edges };
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 5)
    .map((i) => `${i.path.join(".") || "(raíz)"}: ${i.message}`)
    .join("; ");
}
