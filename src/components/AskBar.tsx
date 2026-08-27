import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { ASK_PROMPTS } from "../lib/catalog-hits";
import { AskIcon } from "./Icons";

export function AskBar({ autoFocus = false }: { autoFocus?: boolean }) {
  const { lang } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  function go(text: string) {
    const next = text.trim();
    if (!next) {
      navigate("/ask");
      return;
    }
    navigate(`/ask?q=${encodeURIComponent(next)}`);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    go(q);
  }

  return (
    <section className="ask-hero" aria-label={t(lang, "askHeadline")}>
      <h2>{t(lang, "askHeadline")}</h2>
      <p className="ask-sub">{t(lang, "askHint")}</p>
      <form className="ask-form" onSubmit={onSubmit}>
        <AskIcon />
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t(lang, "askPlaceholder")}
          aria-label={t(lang, "askHeadline")}
        />
        <button className="ask-go" type="submit">
          {t(lang, "askSend")}
        </button>
      </form>
      <div className="ask-suggestions">
        {ASK_PROMPTS.map((prompt) => (
          <button key={prompt.en} type="button" className="ask-chip" onClick={() => go(prompt[lang])}>
            {prompt[lang]}
          </button>
        ))}
      </div>
    </section>
  );
}
