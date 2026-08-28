import type { UIMessage } from "ai";
import type { Lang } from "./types";

export type AskProgressPhase = "processing" | "searching" | "thinking" | "writing";

export type ChatBusyStatus = "submitted" | "streaming" | "ready" | "error";

const TOOL_TYPES = new Set(["tool-searchDirectory", "tool-getRecord"]);

export function textOf(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function toolSearching(message: UIMessage): boolean {
  return message.parts.some((part) => {
    if (!TOOL_TYPES.has(part.type) || !("state" in part)) return false;
    return part.state === "input-available" || part.state === "input-streaming";
  });
}

function reasoning(message: UIMessage): boolean {
  return message.parts.some(
    (part) =>
      part.type === "reasoning" &&
      "state" in part &&
      (part.state === "streaming" || part.state === "done"),
  );
}

export function askProgressPhase(status: ChatBusyStatus, assistant?: UIMessage): AskProgressPhase | null {
  if (status !== "submitted" && status !== "streaming") return null;
  if (status === "submitted" || !assistant) return "processing";
  if (toolSearching(assistant)) return "searching";
  const body = textOf(assistant);
  if (body.length > 0) return "writing";
  if (reasoning(assistant) || status === "streaming") return "thinking";
  return "processing";
}

export function askProgressStep(phase: AskProgressPhase): 0 | 1 | 2 {
  if (phase === "processing") return 0;
  if (phase === "searching") return 1;
  return 2;
}

export function askProgressLabelKey(phase: AskProgressPhase): string {
  switch (phase) {
    case "processing":
      return "askProcessing";
    case "searching":
      return "askSearching";
    case "thinking":
      return "askThinking";
    case "writing":
      return "askWriting";
  }
}

export function askProgressDetailKey(phase: AskProgressPhase): string {
  switch (phase) {
    case "processing":
      return "askProcessingDetail";
    case "searching":
      return "askSearchingDetail";
    case "thinking":
      return "askThinkingDetail";
    case "writing":
      return "askWritingDetail";
  }
}

export type AskProgressProps = {
  phase: AskProgressPhase;
  lang: Lang;
};
