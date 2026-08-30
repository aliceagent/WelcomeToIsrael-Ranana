/**
 * Community stats endpoint: counter aggregation against a stand-in for the
 * Upstash REST store, plus the no-store behaviour the home page relies on to
 * hide the section.
 *
 * handle-stats.ts imports nothing else, but it is TypeScript, so the test
 * bundles it with esbuild (already a Vite dependency) and imports the bundle.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "raanana-stats-")), "stats.mjs");
await build({
  entryPoints: [join(root, "src/server/handle-stats.ts")],
  outfile: out,
  bundle: true,
  format: "esm",
  platform: "node",
});
const { handleStats } = await import(out);

/** Minimal Upstash-compatible /pipeline server: PFADD, PFCOUNT, GET, INCRBY. */
function startStore() {
  const counters = new Map();
  const sets = new Map();
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const commands = JSON.parse(body || "[]");
      const results = commands.map(([cmd, key, arg]) => {
        const op = String(cmd).toUpperCase();
        if (op === "PFADD") {
          const set = sets.get(key) || new Set();
          set.add(arg);
          sets.set(key, set);
          return { result: 1 };
        }
        if (op === "PFCOUNT") return { result: (sets.get(key) || new Set()).size };
        if (op === "INCRBY") {
          const next = (counters.get(key) || 0) + Number(arg);
          counters.set(key, next);
          return { result: next };
        }
        if (op === "GET") return { result: counters.get(key) ?? null };
        return { result: null };
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port, counters, sets }));
  });
}

const post = (events, device = "device-aaaaaaaa") =>
  handleStats(
    new Request("https://x/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}` },
      body: JSON.stringify({ device, events }),
    }),
  );
const get = () => handleStats(new Request("https://x/api/stats"));

test("without a store the endpoint reports unavailable and swallows beacons", async () => {
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  const summary = await (await get()).json();
  assert.equal(summary.available, false);
  assert.equal(summary.reason, "no_store");
  // The beacon must still succeed, or the client would retry forever.
  assert.equal((await post({ sessions: 1 })).status, 204);
});

test("with a store attached, beacons aggregate across devices", async () => {
  const { server, port } = await startStore();
  process.env.KV_REST_API_URL = `http://127.0.0.1:${port}`;
  process.env.KV_REST_API_TOKEN = "test-token";
  try {
    await post({ sessions: 1, searches: 3, card_taps: 5, favorites: 1, seconds: 120 }, "device-aaaaaaaa");
    await post({ sessions: 1, searches: 2, card_taps: 1, asks: 4, shares: 2 }, "device-bbbbbbbb");
    // Same device again: counts add up, but it is still one unique device.
    await post({ sessions: 1, searches: 1 }, "device-aaaaaaaa");

    const s = await (await get()).json();
    assert.equal(s.available, true);
    assert.equal(s.devices, 2, "unique devices");
    assert.equal(s.sessions, 3);
    assert.equal(s.searches, 6);
    assert.equal(s.card_taps, 6);
    assert.equal(s.favorites, 1);
    assert.equal(s.asks, 4);
    assert.equal(s.shares, 2);
    assert.equal(s.seconds, 120);
  } finally {
    server.close();
  }
});

test("per-request caps stop one beacon from inflating a counter", async () => {
  const { server, port } = await startStore();
  process.env.KV_REST_API_URL = `http://127.0.0.1:${port}`;
  process.env.KV_REST_API_TOKEN = "test-token";
  try {
    await post({ searches: 10_000, sessions: 99, seconds: 999_999 });
    const s = await (await get()).json();
    assert.equal(s.searches, 60, "searches capped");
    assert.equal(s.sessions, 1, "sessions capped");
    assert.equal(s.seconds, 4 * 60 * 60, "seconds capped at four hours");
  } finally {
    server.close();
  }
});

test("a malformed device id is rejected before it can write", async () => {
  const { server, port } = await startStore();
  process.env.KV_REST_API_URL = `http://127.0.0.1:${port}`;
  process.env.KV_REST_API_TOKEN = "test-token";
  try {
    const res = await post({ searches: 1 }, "../../etc/passwd");
    assert.equal(res.status, 400);
    const s = await (await get()).json();
    assert.equal(s.devices, 0);
  } finally {
    server.close();
  }
});

test("an unreachable store degrades to unavailable rather than throwing", async () => {
  process.env.KV_REST_API_URL = "http://127.0.0.1:1";
  process.env.KV_REST_API_TOKEN = "test-token";
  const s = await (await get()).json();
  assert.equal(s.available, false);
  assert.equal(s.reason, "store_error");
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
});

test("the marketplace env var spelling works too", async () => {
  const { server, port } = await startStore();
  process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${port}/`; // trailing slash on purpose
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  try {
    await post({ sessions: 1 });
    const s = await (await get()).json();
    assert.equal(s.available, true);
    assert.equal(s.sessions, 1);
  } finally {
    server.close();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  }
});
