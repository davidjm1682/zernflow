import type { SupabaseClient } from "@supabase/supabase-js";

export interface ChannelRow {
  id: string;
  platform: string;
  display_name: string | null;
  username: string | null;
}

export interface FlowSummary {
  id: string;
  name: string;
  status: string;
  version: number;
  updated_at: string;
}

export interface FlowRow extends FlowSummary {
  description: string | null;
  nodes: unknown;
  edges: unknown;
  viewport: unknown;
}

export interface FlowStore {
  listChannels(): Promise<ChannelRow[]>;
  listFlows(): Promise<FlowSummary[]>;
  getFlow(id: string): Promise<FlowRow | null>;
  insertDraft(input: { name: string; description?: string; nodes: unknown; edges: unknown }): Promise<FlowRow>;
  /** Updates only if the row is still a draft. Returns false when no draft row matched. */
  updateDraft(
    id: string,
    patch: { name?: string; description?: string; nodes?: unknown; edges?: unknown },
  ): Promise<boolean>;
}

const FLOW_COLUMNS = "id, name, description, status, version, updated_at, nodes, edges, viewport";

/**
 * Supabase-backed store. Deliberately the ONLY place that touches the database:
 *  - reads `channels` and `flows`, writes `flows` only;
 *  - never references `triggers` (those sync on publish, which this server
 *    cannot do), never deletes, never sets status to anything but 'draft';
 *  - every query is filtered by workspace_id.
 */
export class SupabaseFlowStore implements FlowStore {
  constructor(
    private readonly client: SupabaseClient,
    private readonly workspaceId: string,
  ) {}

  async listChannels(): Promise<ChannelRow[]> {
    const { data, error } = await this.client
      .from("channels")
      .select("id, platform, display_name, username")
      .eq("workspace_id", this.workspaceId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(`No se pudieron leer los canales: ${error.message}`);
    return (data ?? []) as ChannelRow[];
  }

  async listFlows(): Promise<FlowSummary[]> {
    const { data, error } = await this.client
      .from("flows")
      .select("id, name, status, version, updated_at")
      .eq("workspace_id", this.workspaceId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(`No se pudieron leer los flujos: ${error.message}`);
    return (data ?? []) as FlowSummary[];
  }

  async getFlow(id: string): Promise<FlowRow | null> {
    const { data, error } = await this.client
      .from("flows")
      .select(FLOW_COLUMNS)
      .eq("id", id)
      .eq("workspace_id", this.workspaceId)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer el flujo: ${error.message}`);
    return (data as FlowRow | null) ?? null;
  }

  async insertDraft(input: { name: string; description?: string; nodes: unknown; edges: unknown }): Promise<FlowRow> {
    const { data, error } = await this.client
      .from("flows")
      .insert({
        workspace_id: this.workspaceId,
        name: input.name,
        description: input.description ?? null,
        status: "draft",
        version: 1,
        nodes: input.nodes,
        edges: input.edges,
      })
      .select(FLOW_COLUMNS)
      .single();
    if (error || !data) throw new Error(`No se pudo crear el borrador: ${error?.message ?? "sin respuesta"}`);
    return data as FlowRow;
  }

  async updateDraft(
    id: string,
    patch: { name?: string; description?: string; nodes?: unknown; edges?: unknown },
  ): Promise<boolean> {
    const { data, error } = await this.client
      .from("flows")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", this.workspaceId)
      .eq("status", "draft") // atomic guard: a flow published in the meantime is not touched
      .select("id");
    if (error) throw new Error(`No se pudo actualizar el borrador: ${error.message}`);
    return (data ?? []).length > 0;
  }
}
