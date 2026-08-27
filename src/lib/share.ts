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
  if (path.startsWith("http")) return path;
  return `${window.location.origin}${path}`;
}

export function recordOgImage(r: Resource): string {
  return `/og/e/${r.slug}.png`;
}

export async function shareContent(
  title: string,
  text: string,
  url: string,
  imagePath?: string,
): Promise<"shared" | "copied" | "failed"> {
  const payload: ShareData = { title, text, url };
  if (imagePath && typeof navigator.canShare === "function") {
    try {
      const res = await fetch(absoluteUrl(imagePath));
      if (res.ok) {
        const blob = await res.blob();
        const file = new File([blob], "share.png", { type: blob.type || "image/png" });
        if (navigator.canShare({ files: [file] })) payload.files = [file];
      }
    } catch {
      /* crawlers still unfurl the URL */
    }
  }
  try {
    if (navigator.share) {
      await navigator.share(payload);
      return "shared";
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") return "failed";
    if (payload.files && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return "shared";
      } catch (retry) {
        if ((retry as Error).name === "AbortError") return "failed";
      }
    }
  }
  try {
    await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
    return "copied";
  } catch {
    return "failed";
  }
}

export function whatsappShareUrl(title: string, url: string, text?: string): string {
  const body = text ? `${title}\n${text}\n${url}` : `${title}\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(body)}`;
}
