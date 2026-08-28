import type { Resource } from "./types.js";
import { isChag, jerusalemDay, jerusalemMinutes } from "./shabbat.js";

export type OpenState = "always" | "open" | "closed";

export type ParsedHours =
  | { always: true }
  | { always: false; days: Set<number>; open: number; close: number };

const DAY_PREFIXES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/**
 * Best-effort parse of the free-text hours note. Most notes are advisories
 * ("call ahead") and stay unparsed on purpose; only explicit 24/7 markers and
 * "Sunday–Thursday 08:00–16:00" style ranges produce a badge.
 */
export function parseHours(note: string | null | undefined): ParsedHours | null {
  if (!note) return null;
  if (/\b24\s*\/\s*7\b|\b24 hours\b|around the clock/i.test(note)) return { always: true };
  const m = note.match(
    /\b(sun|mon|tue|wed|thu|fri|sat)[a-z]*\s*[–—-]\s*(sun|mon|tue|wed|thu|fri|sat)[a-z]*[^0-9]*?(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})/i,
  );
  if (!m) return null;
  const from = DAY_PREFIXES.indexOf(m[1].toLowerCase());
  const to = DAY_PREFIXES.indexOf(m[2].toLowerCase());
  if (from < 0 || to < 0 || to < from) return null;
  const open = Number(m[3]) * 60 + Number(m[4]);
  const close = Number(m[5]) * 60 + Number(m[6]);
  if (open >= close) return null;
  const days = new Set<number>();
  for (let i = from; i <= to; i++) days.add(i);
  return { always: false, days, open, close };
}

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** null when no schedule is known — then show no badge at all. */
export function openState(r: Resource, now: Date = new Date()): OpenState | null {
  // Structured hours (from the dataset overlays) win over the free-text note.
  if (r.hours_structured?.length) {
    if (isChag(now)) return "closed";
    const d = jerusalemDay(now);
    const mins = jerusalemMinutes(now);
    for (const range of r.hours_structured) {
      if (range.days.includes(d.weekday) && mins >= minutesOf(range.open) && mins < minutesOf(range.close)) {
        return "open";
      }
    }
    return "closed";
  }
  const p = parseHours(r.availability_hours_note);
  if (!p) return null;
  if (p.always) return "always";
  if (isChag(now)) return "closed";
  const d = jerusalemDay(now);
  if (!p.days.has(d.weekday)) return "closed";
  const mins = jerusalemMinutes(now);
  return mins >= p.open && mins < p.close ? "open" : "closed";
}
