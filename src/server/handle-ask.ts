import { createAgentUIStreamResponse } from "ai";
import type { Lang } from "../lib/types";
import { createAskAgent, isAskConfigured } from "./ask-agent";

const MAX_MESSAGES = 16;
const MAX_CHARS = 4000;

function asLang(value: unknown): Lang {
  return value === "fr" || value === "he" ? value : "en";
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
      uiMessages: messages,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "ask_failed" }, { status: 502 });
  }
}
