import type { UIMessage } from "ai";
import type { Lang } from "./types";

export type AskProgressPhase = "processing" | "searching" | "loading" | "thinking" | "writing";

export type ChatBusyStatus = "submitted" | "streaming" | "ready" | "error";

const TOOL_TYPES = new Set(["tool-searchDirectory", "tool-getRecord"]);

export function textOf(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function activeTool(message: UIMessage): "searchDirectory" | "getRecord" | null {
  for (const part of message.parts) {
    if (part.type === "tool-searchDirectory" && "state" in part) {
      if (part.state === "input-available" || part.state === "input-streaming") return "searchDirectory";
    }
    if (part.type === "tool-getRecord" && "state" in part) {
      if (part.state === "input-available" || part.state === "input-streaming") return "getRecord";
    }
  }
  return null;
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

export function assistantHasPendingWork(assistant: UIMessage): boolean {
  return assistant.parts.some((part) => {
    if (!("state" in part)) return false;
    if (part.type === "reasoning") return part.state === "streaming";
    if (typeof part.type === "string" && part.type.startsWith("tool-")) {
      return part.state === "input-streaming" || part.state === "input-available";
    }
    return false;
  });
}

/** True when the assistant reply looks complete even if transport status lags. */
export function assistantSettled(assistant?: UIMessage): boolean {
  if (!assistant) return false;
  if (textOf(assistant).length === 0) return false;
  return !assistantHasPendingWork(assistant);
}

export function askIsBusy(status: ChatBusyStatus, assistant?: UIMessage): boolean {
  if (status !== "submitted" && status !== "streaming") return false;
  if (assistantSettled(assistant)) return false;
  return true;
}

export function askProgressPhase(status: ChatBusyStatus, assistant?: UIMessage): AskProgressPhase | null {
  if (!askIsBusy(status, assistant)) return null;
  if (status === "submitted" || !assistant) return "processing";
  const tool = activeTool(assistant);
  if (tool === "getRecord") return "loading";
  if (tool === "searchDirectory" || toolSearching(assistant)) return "searching";
  const body = textOf(assistant);
  if (body.length > 0) return "writing";
  if (reasoning(assistant) || status === "streaming") return "thinking";
  return "processing";
}

export function askProgressStep(phase: AskProgressPhase): 0 | 1 | 2 {
  if (phase === "processing") return 0;
  if (phase === "searching" || phase === "loading") return 1;
  return 2;
}

export function askProgressLabelKey(phase: AskProgressPhase): string {
  switch (phase) {
    case "processing":
      return "askProcessing";
    case "searching":
      return "askSearching";
    case "loading":
      return "askLoadingRecord";
    case "thinking":
      return "askThinking";
    case "writing":
      return "askWriting";
  }
}

export function askProgressDetailKey(phase: AskProgressPhase, assistant?: UIMessage): string {
  if (phase === "searching" && assistant && activeTool(assistant) === "searchDirectory") {
    return "askSearchingDetail";
  }
  if (phase === "loading") return "askLoadingRecordDetail";
  switch (phase) {
    case "processing":
      return "askProcessingDetail";
    case "searching":
      return "askSearchingDetail";
    case "thinking":
      return "askThinkingDetail";
    case "writing":
      return "askWritingDetail";
    default:
      return "askProcessingDetail";
  }
}

export type AskProgressProps = {
  phase: AskProgressPhase;
  lang: Lang;
  assistant?: UIMessage;
  startedAt?: number;
};
