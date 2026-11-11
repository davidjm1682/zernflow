/**
 * The flow builder stores every "action" style node (tags, custom fields, HTTP
 * requests, go-to-flow, subscribe, A/B split, ...) as a node of type "action"
 * with the concrete kind in `data.actionType` (see components/flow-builder/
 * flow-canvas.tsx and node-palette.tsx). Templates and the engine's own types
 * use the concrete kind directly as `node.type` ("addTag", "httpRequest", ...).
 *
 * This resolves a stored node to the concrete type the engine dispatches on, so
 * both storage shapes execute the same way. A node whose `actionType` is missing
 * keeps the type "action", which the engine treats as a no-op.
 */
export function resolveNodeType(node: { type: string; data?: unknown }): string {
  if (node.type !== "action") return node.type;
  const actionType = (node.data as { actionType?: unknown } | null | undefined)?.actionType;
  return typeof actionType === "string" && actionType.length > 0 ? actionType : node.type;
}
