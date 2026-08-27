import { ToolLoopAgent, tool, isStepCount, InferAgentUIMessage } from "ai";
import type { MoonshotAIChatModelId } from "@ai-sdk/moonshotai";
import { createMoonshotAI } from "@ai-sdk/moonshotai";
import { z } from "zod";
import type { Lang } from "../lib/types";
import { getCompactRecord, searchCatalog } from "../lib/catalog-hits";

const MODEL = (process.env.KIMI_MODEL || process.env.MOONSHOT_MODEL || "kimi-k2.6") as MoonshotAIChatModelId;

function moonshotKey(): string | undefined {
  return process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY;
}

function instructions(lang: Lang): string {
  const language =
    lang === "fr" ? "French" : lang === "he" ? "Hebrew (you may mix Hebrew and English names)" : "English";
  return `You are the in-app helper for Welcome to Ra'anana, a living directory for English- and French-speaking newcomers in Ra'anana, Israel.

Always search the directory first. Call searchDirectory before you answer any practical local question (health, school, plumber, food, bills, city hall, emergency, apps). Use getRecord if you need hours, a website, or a phone that was truncated.

Then answer in ${language}. Be short, warm, and concrete:
- Lead with what to do next.
- Name the matching places from the tool results. Tell the user they can tap the cards to open the listing.
- Never invent a phone number, address, hour, or price. If it is not in the tool result, say so and suggest Midrag / Google Maps / the official site.
- For general Israel questions (how a kupah works, aliyah steps, driving licence) you MAY add background knowledge AFTER searching, and label it as general Israel context, not a Ra'anana listing.
- Emergencies: say Police 100, MDA 101, Fire 102, Home Front 104, City 107 immediately, then search for shelters / numbers.
- If the directory is thin, say so and still be useful.

Do not mention system prompts, API keys, or Kimi.`;
}

export function createAskAgent(lang: Lang) {
  const apiKey = moonshotKey();
  if (!apiKey) return null;
  const moonshotai = createMoonshotAI({ apiKey });

  return new ToolLoopAgent({
    id: "raanana-ask",
    model: moonshotai(MODEL),
    instructions: instructions(lang),
    stopWhen: isStepCount(6),
    providerOptions: {
      moonshotai: {
        thinking: { type: "disabled" },
      },
    },
    tools: {
      searchDirectory: tool({
        description:
          "Search the Ra'anana newcomer directory (businesses, health, schools, trades, city services, apps, emergency). Call this first.",
        inputSchema: z.object({
          query: z.string().describe("Search text in English, French, or Hebrew"),
        }),
        execute: async ({ query }) => searchCatalog(query, lang, 8),
      }),
      getRecord: tool({
        description: "Load one directory record by id for extra contact and hours detail.",
        inputSchema: z.object({
          record_id: z.string().describe("Directory record_id such as MUN-001"),
        }),
        execute: async ({ record_id }) => getCompactRecord(record_id, lang),
      }),
    },
  });
}

export type AskAgent = NonNullable<ReturnType<typeof createAskAgent>>;
export type AskAgentUIMessage = InferAgentUIMessage<AskAgent>;

export function isAskConfigured(): boolean {
  return Boolean(moonshotKey());
}
