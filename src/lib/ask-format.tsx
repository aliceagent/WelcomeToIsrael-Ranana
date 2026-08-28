import type { ReactNode } from "react";

export function formatAskInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function AskAnswerContent({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="ask-answer-content">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const isList = lines.length > 0 && lines.every((line) => /^\d+\.\s/.test(line));

        if (isList) {
          return (
            <ol className="ask-answer-list" key={blockIndex}>
              {lines.map((line, lineIndex) => {
                const match = line.match(/^\d+\.\s+(.*)$/);
                return <li key={lineIndex}>{formatAskInline(match?.[1] ?? line)}</li>;
              })}
            </ol>
          );
        }

        return (
          <p className="ask-p" key={blockIndex}>
            {formatAskInline(lines.join(" "))}
          </p>
        );
      })}
    </div>
  );
}
