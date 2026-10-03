/** Only allow same-site relative paths, so ?next= cannot become an open redirect. */
export function safeNext(next: string | null | undefined, fallback = "/today") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
