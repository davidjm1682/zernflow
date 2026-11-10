import { createHash, timingSafeEqual } from "node:crypto";

export const MIN_TOKEN_LENGTH = 32;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A token is usable only if it is long enough to resist guessing. */
export function isUsableToken(token: string | undefined): token is string {
  return typeof token === "string" && token.length >= MIN_TOKEN_LENGTH;
}

export function isUuid(value: string | undefined): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * Constant-time check of an `Authorization: Bearer <token>` header against the
 * expected token. Both sides are hashed first so lengths never leak.
 */
export function bearerMatches(header: string | null | undefined, expected: string): boolean {
  if (!header) return false;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return false;
  const a = createHash("sha256").update(match[1]).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
