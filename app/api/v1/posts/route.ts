import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createZernioClient } from "@/lib/zernio-client";

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

const COMMENT_PLATFORMS: ("instagram" | "facebook")[] = ["instagram", "facebook"];

/**
 * GET /api/v1/posts
 *
 * Recent posts of the workspace's Instagram/Facebook channels, for the post
 * picker of the comment trigger. `id` is the platform post id, which is what
 * the webhook reports as the comment's post (see app/api/webhooks/late).
 */
export async function GET() {
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
    .select("late_account_id, platform")
    .eq("workspace_id", workspace.id)
    .eq("is_active", true)
    .in("platform", COMMENT_PLATFORMS);

  const zernio = createZernioClient(workspace.late_api_key_encrypted);
  const results = await Promise.all(
    (channels ?? []).map(async (channel): Promise<InboxPost[]> => {
      try {
        const res = await zernio.comments.listInboxComments({
          query: { accountId: channel.late_account_id, limit: 50, sortBy: "date" },
        });
        return res.data?.data ?? [];
      } catch {
        return [];
      }
    }),
  );

  const posts = results.flat().flatMap((p) =>
    p.id
      ? [
          {
            id: p.id,
            platform: p.platform ?? null,
            username: p.accountUsername ?? null,
            caption: (p.content ?? "").slice(0, 200),
            picture: p.picture ?? null,
            permalink: p.permalink ?? null,
            createdTime: p.createdTime ?? null,
            commentCount: p.commentCount ?? 0,
          },
        ]
      : [],
  );
  posts.sort((a, b) => (b.createdTime ?? "").localeCompare(a.createdTime ?? ""));

  return NextResponse.json({ posts });
}
