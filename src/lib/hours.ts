import type { Resource } from "./types.js";
import { isChag, jerusalemDay, jerusalemMinutes } from "./shabbat.js";

export type OpenState = "always" | "open" | "closed";

export type ParsedHours =
  | { always: true }
  | { always: false; days: Set<number>; open: number; close: number };

/** One opening window: weekday 0=Sun..6=Sat, minutes since midnight. */
type Window = { day: number; open: number; close: number };

/**
 * What a chip can say beyond open/closed: when the place shuts today, or when
 * it next opens. Absent when the schedule does not say (a record may be known
 * to close on Shabbat without its weekday hours ever being recorded).
 */
export type OpenDetail = {
  state: OpenState;
  /** "HH:MM" it closes today, when open now. */
  closesAt?: string;
  /** Next opening, when closed now. */
  opensAt?: { weekday: number; time: string; today: boolean };
  /** Why it is shut, when the reason is the calendar rather than the clock. */
  closedFor?: "shabbat" | "holiday";
};

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

function hhmm(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Days the place is known to be shut, whatever the rest of the schedule says.
 * Marking a kosher supermarket closed on Saturday is a fact; claiming to know
 * its weekday hours would not be, so the two are recorded separately.
 */
function closedDays(r: Resource): number[] {
  return (r.closed_days ?? []).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
}

/** The weekly opening windows, from structured hours or a parseable note. */
function windows(r: Resource): { always: boolean; list: Window[] } {
  if (r.hours_structured?.length) {
    const list: Window[] = [];
    for (const range of r.hours_structured) {
      for (const day of range.days) list.push({ day, open: minutesOf(range.open), close: minutesOf(range.close) });
    }
    return { always: false, list };
  }
  const parsed = parseHours(r.availability_hours_note);
  if (!parsed) return { always: false, list: [] };
  if (parsed.always) return { always: true, list: [] };
  return {
    always: false,
    list: [...parsed.days].map((day) => ({ day, open: parsed.open, close: parsed.close })),
  };
}

/** The first window that starts after `from` on `weekday`, or later in the week. */
function nextOpening(list: Window[], shut: number[], weekday: number, mins: number): OpenDetail["opensAt"] {
  if (!list.length) return undefined;
  for (let i = 0; i < 7; i++) {
    const day = (weekday + i) % 7;
    if (shut.includes(day)) continue;
    const candidates = list
      .filter((w) => w.day === day && (i > 0 || w.open > mins))
      .sort((a, b) => a.open - b.open);
    if (candidates.length) return { weekday: day, time: hhmm(candidates[0].open), today: i === 0 };
  }
  return undefined;
}

/**
 * Open/closed plus the next transition. null when no schedule is known — then
 * show no badge at all.
 */
export function openStateDetail(r: Resource, now: Date = new Date()): OpenDetail | null {
  const { always, list } = windows(r);
  const shut = closedDays(r);
  if (always) return { state: "always" };
  if (!list.length && !shut.length) return null;

  const d = jerusalemDay(now);
  const mins = jerusalemMinutes(now);
  const chag = isChag(now);
  const restDay = shut.includes(d.weekday) && d.weekday === 6;
  const shutToday = chag || shut.includes(d.weekday);
  const closedFor: OpenDetail["closedFor"] = chag ? "holiday" : restDay ? "shabbat" : undefined;

  if (!shutToday) {
    const open = list.find((w) => w.day === d.weekday && mins >= w.open && mins < w.close);
    if (open) return { state: "open", closesAt: hhmm(open.close) };
  }
  // Nothing but the closed days is known: stay silent on every other day
  // rather than imply the place is shut.
  if (!list.length) return shutToday ? { state: "closed", closedFor } : null;
  // Chagim can run two days or into Shabbat, which this weekly schedule
  // cannot see — so say closed without promising when it reopens.
  if (chag) return { state: "closed", closedFor };
  return {
    state: "closed",
    closedFor,
    opensAt: nextOpening(list, shut, d.weekday, shutToday ? 24 * 60 : mins),
  };
}

/** null when no schedule is known — then show no badge at all. */
export function openState(r: Resource, now: Date = new Date()): OpenState | null {
  return openStateDetail(r, now)?.state ?? null;
}
