"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PickerPost {
  id: string;
  platform: string | null;
  username: string | null;
  caption: string;
  picture: string | null;
  permalink: string | null;
  createdTime: string | null;
}

interface PostPickerProps {
  value: string[];
  onChange: (postIds: string[]) => void;
}

/** Choose which posts a comment trigger listens to. Empty = all posts. */
export function PostPicker({ value, onChange }: PostPickerProps) {
  const [posts, setPosts] = useState<PickerPost[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [link, setLink] = useState("");
  const [linkState, setLinkState] = useState<"idle" | "loading" | "notfound">("idle");

  const addByLink = async () => {
    const url = link.trim();
    if (!url) return;
    setLinkState("loading");
    try {
      const r = await fetch(`/api/v1/posts?url=${encodeURIComponent(url)}`, { cache: "no-store" });
      const json = r.ok ? await r.json() : null;
      const post: PickerPost | undefined = json?.posts?.[0];
      if (!post) return setLinkState("notfound");
      setPosts((prev) => [post, ...(prev ?? []).filter((p) => p.id !== post.id)]);
      if (!value.includes(post.id)) onChange([...value, post.id]);
      setLink("");
      setLinkState("idle");
    } catch {
      setLinkState("notfound");
    }
  };

  // Refresh when the user comes back to the tab (e.g. after publishing a new reel).
  useEffect(() => {
    const onFocus = () => setReloadKey((k) => k + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    fetch("/api/v1/posts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => !cancelled && setPosts(json.posts ?? []))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  const known = new Set((posts ?? []).map((p) => p.id));
  const orphans = value.filter((id) => !known.has(id));

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground">Publicaciones</label>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="text-[11px] text-muted-foreground underline hover:text-foreground"
        >
          Recargar
        </button>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">
        {value.length === 0
          ? "Todas las publicaciones. Elige una o varias para limitar este flujo."
          : `Solo ${value.length} publicación${value.length !== 1 ? "es" : ""} seleccionada${value.length !== 1 ? "s" : ""}.`}
      </p>

      {posts === null && !failed && <p className="text-xs text-muted-foreground">Cargando publicaciones…</p>}
      {failed && (
        <p className="text-xs text-destructive">No se pudieron cargar las publicaciones.</p>
      )}

      <div className="mb-2 flex gap-1.5">
        <input
          type="url"
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
            setLinkState("idle");
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addByLink())}
          placeholder="¿No aparece? Pega el enlace del reel"
          className="min-w-0 flex-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none"
        />
        <button
          type="button"
          onClick={addByLink}
          disabled={!link.trim() || linkState === "loading"}
          className="rounded-lg border border-border px-2.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          {linkState === "loading" ? "Buscando…" : "Añadir"}
        </button>
      </div>
      {linkState === "notfound" && (
        <p className="mb-2 text-xs text-destructive">
          No encontré esa publicación en tu cuenta conectada.
        </p>
      )}

      {posts !== null && posts.length === 0 && !failed && (
        <p className="text-xs text-muted-foreground">
          No se encontraron publicaciones. Revisa que el canal de Instagram esté activo.
        </p>
      )}

      <div className="max-h-64 space-y-1.5 overflow-y-auto">
        {(posts ?? []).map((post) => {
          const selected = value.includes(post.id);
          return (
            <button
              key={post.id}
              type="button"
              onClick={() => toggle(post.id)}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-lg border p-2 text-left transition-colors",
                selected ? "border-emerald-500 bg-emerald-500/10" : "border-border bg-card hover:bg-muted",
              )}
            >
              {post.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.picture} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs text-foreground">{post.caption || "(sin texto)"}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {post.username ? `@${post.username} · ` : ""}
                  {post.createdTime ? new Date(post.createdTime).toLocaleDateString() : ""}
                </p>
              </div>
              <input type="checkbox" readOnly checked={selected} className="mt-1 h-4 w-4" />
            </button>
          );
        })}

        {orphans.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => toggle(id)}
            className="flex w-full items-center justify-between rounded-lg border border-emerald-500 bg-emerald-500/10 p-2 text-left text-xs"
          >
            <span className="truncate">Publicación {id}</span>
            <span className="text-muted-foreground">quitar</span>
          </button>
        ))}
      </div>
    </div>
  );
}
