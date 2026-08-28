import { useEffect, useRef, useState } from "react";
import { AskAnswerContent } from "../lib/ask-format";
import { t } from "../lib/i18n";
import type { Lang } from "../lib/types";

type AskAnswerProps = {
  text: string;
  lang: Lang;
  messageId: string;
};

export function AskAnswer({ text, lang, messageId }: AskAnswerProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [messageId]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const measure = () => {
      if (expanded) return;
      setOverflows(el.scrollHeight > el.clientHeight + 4);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded, messageId]);

  if (!text) return null;

  const panelId = `ask-answer-${messageId}`;

  return (
    <div className="ask-answer">
      <div
        ref={bodyRef}
        id={panelId}
        className={`ask-answer-body${expanded ? " is-expanded" : ""}${overflows ? " has-overflow" : ""}`}
      >
        <AskAnswerContent text={text} />
      </div>
      {overflows || expanded ? (
        <button
          type="button"
          className="ask-answer-toggle"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? t(lang, "askShowLess") : t(lang, "askReadMore")}
        </button>
      ) : null}
    </div>
  );
}
