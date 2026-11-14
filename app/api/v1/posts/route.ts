import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createZernioClient } from "@/lib/zernio-client";

export const dynamic = "force-dynamic";

interface PickerPost {
  id: string;
  platform: string | null;
  username: string | null;
  caption: string;
  picture: string | null;
  permalink: string | null;
  createdTime: string | null;
  commentCount: number;
}

interface InboxPost {
  id?: string;
  platform?: string;
  accountUsername?: string;
  content?: string;
  picture?: string | null;
  permalink?: string | null;
  createdTime?: string;
  commentCount?: number;
}

interface ExternalPost {
  platform?: string;
  platformPostId?: string;
  platformPostUrl?: string;
  content?: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  analytics?: { comments?: number };
}

const COMMENT_PLATFORMS: ("instagram" | "facebook")[] = ["instagram", "facebook"];

function fromExternal(p: ExternalPost, username: string | null): PickerPost | null {
  if (!p.platformPostId) return null;
  return {
    id: p.platformPostId,
    platform: p.platform ?? null,
    username,
    caption: (p.content ?? "").slice(0, 200),
    picture: p.thumbnailUrl ?? p.mediaUrl ?? null,
    permalink: p.platformPostUrl ?? null,
    createdTime: p.publishedAt ?? null,
    commentCount: p.analytics?.comments ?? 0,
  };
}

/**
 * GET /api/v1/posts[?url=<post link>]
 *
 * Recent posts of the workspace's Instagram/Facebook channels, for the post
 * picker of the comment trigger. `id` is the platform post id, which is what
 * the webhook reports as the comment's post (see app/api/webhooks/late).
 *
 * Zernio's inbox is a periodically synced copy, so a reel published minutes ago
 * may be missing from it. We therefore also run Zernio's on-demand sync, which
 * reads the platform live (debounced on Zernio's side), and merge both lists.
 * With `?url=` it locates one specific post by its link instead.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(*)")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  const workspace = membership?.workspaces;
  if (!workspace) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!workspace.late_api_key_encrypted) return NextResponse.json({ posts: [] });

  const { data: channels } = await supabase
    .from("channels")
    .select("late_account_id, platform, username")
    .eq("workspace_id", workspace.id)
    .eq("is_active", true)
    .in("platform", COMMENT_PLATFORMS);

  const zernio = createZernioClient(workspace.late_api_key_encrypted);
  const url = new URL(request.url).searchParams.get("url")?.trim();

  // Locate one post by its link (fallback when it is still not listed).
  if (url) {
    for (const channel of channels ?? []) {
      try {
        const res = await zernio.analytics.syncExternalPosts({
          body: { accountId: channel.late_account_id, url },
        });
        const post = res.data?.post ? fromExternal(res.data.post, channel.username ?? null) : null;
        if (post) return NextResponse.json({ posts: [post] });
      } catch {
        // try the next channel
      }
    }
    return NextResponse.json({ posts: [], error: "not_found" }, { status: 404 });
  }

  const results = await Promise.all(
    (channels ?? []).map(async (channel): Promise<PickerPost[]> => {
      const username = channel.username ?? null;
      const [live, inbox] = await Promise.all([
        zernio.analytics
          .syncExternalPosts({ body: { accountId: channel.late_account_id } })
          .then((r: { data?: { posts?: unknown[] } }) => (r.data?.posts ?? []) as ExternalPost[])
          .catch(() => [] as ExternalPost[]),
        zernio.comments
          .listInboxComments({
            query: { accountId: channel.late_account_id, limit: 50, sortBy: "date" },
          })
          .then((r: { data?: { data?: unknown[] } }) => (r.data?.data ?? []) as InboxPost[])
          .catch(() => [] as InboxPost[]),
      ]);

      const byId = new Map<string, PickerPost>();
      for (const p of inbox) {
        if (!p.id) continue;
        byId.set(p.id, {
          id: p.id,
          platform: p.platform ?? null,
          username: p.accountUsername ?? username,
          caption: (p.content ?? "").slice(0, 200),
          picture: p.picture ?? null,
          permalink: p.permalink ?? null,
          createdTime: p.createdTime ?? null,
          commentCount: p.commentCount ?? 0,
        });
      }
      // The live sync also returns posts Zernio still remembers but that were
      // deleted/archived on the platform (the inbox no longer lists them). Only
      // take live-only posts newer than the inbox's newest one: those are the
      // freshly published posts the inbox hasn't picked up yet.
      const newestInbox = inbox.reduce(
        (max, p) => ((p.createdTime ?? "") > max ? (p.createdTime ?? "") : max),
        "",
      );
      // Live data wins for freshness; keep inbox values where live has none.
      for (const p of live) {
        const post = fromExternal(p, username);
        if (!post) continue;
        const prev = byId.get(post.id);
        if (!prev && newestInbox && (post.createdTime ?? "") <= newestInbox) continue;
        byId.set(post.id, {
          ...post,
          username: prev?.username ?? post.username,
          caption: post.caption || prev?.caption || "",
          picture: post.picture ?? prev?.picture ?? null,
          commentCount: Math.max(post.commentCount, prev?.commentCount ?? 0),
        });
      }
      return [...byId.values()];
    }),
  );

  const posts = results.flat();
  posts.sort((a, b) => (b.createdTime ?? "").localeCompare(a.createdTime ?? ""));

  return NextResponse.json({ posts });
}
