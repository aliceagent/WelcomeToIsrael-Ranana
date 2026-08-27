/** Collapse duplicate outbound links so Website / Continue / Order are not the same URL three times. */
export function normalizeUrl(u: string): string {
  const trimmed = u.trim();
  try {
    const url = new URL(trimmed);
    const host = url.host.toLowerCase().replace(/^www\./, "");
    const path = url.pathname.replace(/\/+$/, "");
    return `${host}${path}${url.search}`.toLowerCase();
  } catch {
    return trimmed.replace(/\/+$/, "").toLowerCase();
  }
}

export function sameUrl(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return normalizeUrl(a) === normalizeUrl(b);
}
