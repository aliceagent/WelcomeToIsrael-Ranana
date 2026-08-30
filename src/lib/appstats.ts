/**
 * Client side of the community stats: counts what happens on this device and
 * beacons it to /api/stats in small batches. Everything is fire-and-forget —
 * offline, blocked, or storage-less deployments lose nothing but the counts.
 */

const DEVICE_KEY = "raanana.deviceId";
const PENDING_KEY = "raanana.statsPending";
const SESSION_FLAG = "raanana.statsSession";
const CACHE_KEY = "raanana.statsCache";
const FLUSH_MS = 25_000;
const CACHE_MS = 60_000;

export type StatEvent = "sessions" | "seconds" | "searches" | "card_taps" | "favorites" | "asks" | "shares";

export type StatsSummary = {
  available: boolean;
  devices?: number;
  sessions?: number;
  seconds?: number;
  searches?: number;
  card_taps?: number;
  favorites?: number;
  asks?: number;
  shares?: number;
};

function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "anonymous-device";
  }
}

function readPending(): Partial<Record<StatEvent, number>> {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || "{}") as Partial<Record<StatEvent, number>>;
  } catch {
    return {};
  }
}

function writePending(p: Partial<Record<StatEvent, number>>) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(p));
  } catch {
    /* stats are best-effort */
  }
}

export function recordStat(event: StatEvent, n = 1) {
  const pending = readPending();
  pending[event] = (pending[event] || 0) + n;
  writePending(pending);
}

function flush(useBeacon = false) {
  const pending = readPending();
  if (!Object.keys(pending).length) return;
  writePending({});
  const payload = JSON.stringify({ device: deviceId(), events: pending });
  try {
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon("/api/stats", new Blob([payload], { type: "application/json" }));
      return;
    }
    fetch("/api/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(
      () => writePending({ ...readPending(), ...pending }),
    );
  } catch {
    writePending({ ...readPending(), ...pending });
  }
}

let started = false;

/** Called once from Layout: counts the session and keeps a visible-time clock. */
export function initStats() {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    if (!sessionStorage.getItem(SESSION_FLAG)) {
      sessionStorage.setItem(SESSION_FLAG, "1");
      recordStat("sessions");
    }
  } catch {
    /* ignore */
  }
  // Session length = time the tab is actually visible, sampled coarsely.
  let visibleSince = document.visibilityState === "visible" ? Date.now() : 0;
  const bank = () => {
    if (visibleSince) {
      const secs = Math.round((Date.now() - visibleSince) / 1000);
      if (secs > 0) recordStat("seconds", Math.min(secs, 4 * 60 * 60));
      visibleSince = Date.now();
    }
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      bank();
      visibleSince = 0;
      flush(true);
    } else {
      visibleSince = Date.now();
    }
  });
  window.addEventListener("pagehide", () => {
    bank();
    flush(true);
  });
  setInterval(() => {
    bank();
    flush();
  }, FLUSH_MS);
}

export async function fetchStats(): Promise<StatsSummary | null> {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null") as { at: number; data: StatsSummary } | null;
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;
    const res = await fetch("/api/stats");
    if (!res.ok) return cached?.data ?? null;
    const data = (await res.json()) as StatsSummary;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
    } catch {
      /* ignore */
    }
    return data;
  } catch {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null") as { at: number; data: StatsSummary } | null;
      return cached?.data ?? null;
    } catch {
      return null;
    }
  }
}
