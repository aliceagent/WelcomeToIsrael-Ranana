import type { Resource } from "./types";

export function recordPath(r: Resource): string {
  return `/e/${r.slug}`;
}

export function categoryPath(category: string): string {
  return `/c/${category
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export function absoluteUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export async function shareContent(title: string, text: string, url: string): Promise<"shared" | "copied" | "failed"> {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return "shared";
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") return "failed";
  }
  try {
    await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
    return "copied";
  } catch {
    return "failed";
  }
}

export function whatsappShareUrl(title: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
}
