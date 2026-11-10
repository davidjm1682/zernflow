import { z } from "zod";
import { MATCH_TYPES, type FlowEdge, type FlowNode } from "./schemas";

export const commentToDmInput = z.object({
  name: z.string().trim().min(1),
  keyword: z.string().trim().min(1),
  matchType: z.enum(MATCH_TYPES).default("contains"),
  publicReply: z.string().trim().min(1),
  dmText: z.string().trim().min(1),
  dmButton: z.object({ label: z.string().min(1).max(20), url: z.string().url() }).optional(),
  tag: z.string().trim().min(1).optional(),
});

export type CommentToDmInput = z.input<typeof commentToDmInput>;

const edgeStyle = { stroke: "var(--border)", strokeWidth: 2 };

function edge(id: string, source: string, target: string): FlowEdge {
  return { id, source, target, animated: true, style: edgeStyle };
}

/**
 * Builds the comment -> public reply + DM (-> tag) pattern the way the visual
 * builder stores it:
 *
 *   trigger(comment_keyword, replyText = public reply)
 *     -> sendMessage (first message is sent as the private reply / DM)
 *     -> action addTag (optional)
 */
export function buildCommentToDmFlow(rawInput: CommentToDmInput): {
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
} {
  const input = commentToDmInput.parse(rawInput);

  const nodes: FlowNode[] = [
    {
      id: "trigger_1",
      type: "trigger",
      position: { x: 250, y: 0 },
      data: {
        triggerType: "comment_keyword",
        keywords: [{ value: input.keyword, matchType: input.matchType }],
        replyText: input.publicReply,
      },
    },
    {
      id: "send_1",
      type: "sendMessage",
      position: { x: 250, y: 180 },
      data: {
        messages: [
          {
            text: input.dmText,
            ...(input.dmButton
              ? { buttons: [{ type: "url" as const, title: input.dmButton.label, url: input.dmButton.url }] }
              : {}),
          },
        ],
      },
    },
  ];
  const edges: FlowEdge[] = [edge("e_trigger_1_send_1", "trigger_1", "send_1")];

  if (input.tag) {
    nodes.push({
      id: "tag_1",
      type: "action",
      position: { x: 250, y: 360 },
      data: { actionType: "addTag", tagName: input.tag },
    });
    edges.push(edge("e_send_1_tag_1", "send_1", "tag_1"));
  }

  return { name: input.name, nodes, edges };
}
