import type { HomePin, Resource } from "./types";

const R = 6371;

export function haversineKm(a: HomePin, lat: number, lng: number): number {
  const dLat = ((lat - a.lat) * Math.PI) / 180;
  const dLng = ((lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function estimateTravel(kmStraight: number) {
  const walkKm = kmStraight * 1.18;
  const driveKm = kmStraight * 1.25;
  const walkMin = Math.max(1, Math.round((walkKm / 4.8) * 60));
  const driveMin = Math.max(3, Math.round((driveKm / 24) * 60 + 1.5));
  return { walkKm, walkMin, driveMin };
}

export function isLowConfidence(r: Resource): boolean {
  const c = (r.coordinate_confidence || "").toLowerCase();
  return c.includes("fallback") || c.includes("unavailable") || c.includes("city-center");
}

export function mapsSearchUrl(r: Resource): string {
  if (r.google_maps_location_url) return r.google_maps_location_url;
  const q = [r.name_en, r.address_en, r.city || "Ra'anana", "Israel"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function directionsUrl(r: Resource, home: HomePin, mode: "walking" | "driving"): string {
  const dest =
    r.latitude_est != null && r.longitude_est != null
      ? `${r.latitude_est},${r.longitude_est}`
      : [r.address_en, r.city || "Ra'anana", "Israel"].filter(Boolean).join(", ");
  const origin = `${home.lat},${home.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=${mode}`;
}

export function wazeUrl(r: Resource): string | null {
  if (r.latitude_est != null && r.longitude_est != null) {
    return `https://waze.com/ul?ll=${r.latitude_est},${r.longitude_est}&navigate=yes`;
  }
  if (r.address_en) {
    return `https://waze.com/ul?q=${encodeURIComponent(r.address_en + ", Ra'anana")}`;
  }
  return null;
}

export function appleMapsUrl(r: Resource, home: HomePin): string {
  const d =
    r.latitude_est != null && r.longitude_est != null
      ? `${r.latitude_est},${r.longitude_est}`
      : encodeURIComponent([r.address_en, "Ra'anana"].filter(Boolean).join(", "));
  return `https://maps.apple.com/?saddr=${home.lat},${home.lng}&daddr=${d}&dirflg=w`;
}

/** Some records list alternates as "09-123 4567 / 106"; each deserves its own tel: link. */
export function phoneNumbers(phone: string | null | undefined): string[] {
  if (!phone) return [];
  return phone
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean);
}

export function telHref(phone: string): string {
  const cleaned = phoneNumbers(phone)[0]?.replace(/[^\d+*]/g, "") ?? "";
  return `tel:${cleaned}`;
}

export function whatsappHref(value: string): string {
  const digits = value.replace(/[^\d]/g, "");
  if (digits.length >= 9) return `https://wa.me/${digits.startsWith("0") ? "972" + digits.slice(1) : digits}`;
  return `https://wa.me/${encodeURIComponent(value)}`;
}
