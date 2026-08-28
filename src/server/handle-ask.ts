import { createAgentUIStreamResponse, type UIMessage } from "ai";
import type { Lang } from "../lib/types.js";
import { createAskAgent, isAskConfigured } from "./ask-agent.js";

const MAX_MESSAGES = 16;
const MAX_CHARS = 4000;
const MAX_BODY_BYTES = 120_000;
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

// Best-effort per-instance throttle; enough to stop a casual script from
// burning the model budget through this public endpoint.
const recentByIp = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const kept = (recentByIp.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  kept.push(now);
  recentByIp.set(ip, kept);
  if (recentByIp.size > 5000) recentByIp.clear();
  return kept.length > RATE_LIMIT;
}

function asLang(value: unknown): Lang {
  return value === "fr" || value === "he" ? value : "en";
}

function normalizeUIMessages(messages: unknown[]): UIMessage[] {
  return messages.map((raw, index) => {
    const message = raw as Partial<UIMessage> & { parts?: UIMessage["parts"] };
    return {
      id: typeof message.id === "string" && message.id ? message.id : `msg-${index}-${crypto.randomUUID()}`,
      role: message.role === "assistant" || message.role === "system" ? message.role : "user",
      parts: Array.isArray(message.parts) ? message.parts : [],
    };
  });
}

export async function handleAsk(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  if (request.method === "GET") {
    return Response.json({ ok: true, configured: isAskConfigured() });
  }
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const declaredBytes = Number(request.headers.get("content-length") || 0);
  if (declaredBytes > MAX_BODY_BYTES) {
    return Response.json({ error: "too_large" }, { status: 413 });
  }
  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (rateLimited(ip)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { messages?: unknown; lang?: unknown };
  try {
    body = (await request.json()) as { messages?: unknown; lang?: unknown };
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "missing_messages" }, { status: 400 });
  }
  if (messages.length > MAX_MESSAGES) {
    return Response.json({ error: "too_many_messages" }, { status: 400 });
  }

  const last = messages[messages.length - 1] as { parts?: { type?: string; text?: string }[] } | undefined;
  const lastText = last?.parts?.filter((p) => p.type === "text").map((p) => p.text || "").join(" ") || "";
  if (lastText.length > MAX_CHARS) {
    return Response.json({ error: "too_long" }, { status: 400 });
  }

  const agent = createAskAgent(asLang(body.lang));
  if (!agent) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  try {
    return await createAgentUIStreamResponse({
      agent,
      uiMessages: normalizeUIMessages(messages),
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "ask_failed" }, { status: 502 });
  }
}
