import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { RecordCard } from "../components/RecordCard";
import { AskProgress } from "../components/AskProgress";
import { AskIcon } from "../components/Icons";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { getById } from "../lib/data";
import { askProgressPhase, textOf } from "../lib/ask-progress";
import { ASK_PROMPTS, ensureCatalogSearch, matchingFolders, searchCatalog } from "../lib/catalog-hits";

ensureCatalogSearch();

const sentQueries = new Set<string>();

function recordIdsFrom(message: UIMessage): string[] {
  const ids: string[] = [];
  for (const part of message.parts) {
    if (part.type === "tool-searchDirectory" && "state" in part && part.state === "output-available") {
      const output = (part as { output?: { records?: { record_id: string }[] } }).output;
      for (const rec of output?.records || []) ids.push(rec.record_id);
    }
    if (part.type === "tool-getRecord" && "state" in part && part.state === "output-available") {
      const output = (part as { output?: { record_id?: string } }).output;
      if (output?.record_id) ids.push(output.record_id);
    }
  }
  return [...new Set(ids)];
}

function folderHitsFrom(message: UIMessage): { path: string; icon: string; title: string }[] {
  const folders: { path: string; icon: string; title: string }[] = [];
  const seen = new Set<string>();
  for (const part of message.parts) {
    if (part.type !== "tool-searchDirectory" || !("state" in part) || part.state !== "output-available") continue;
    const output = (part as { output?: { folders?: { path: string; icon: string; title: string }[] } }).output;
    for (const folder of output?.folders || []) {
      if (seen.has(folder.path)) continue;
      seen.add(folder.path);
      folders.push(folder);
    }
  }
  return folders;
}

export function AskPage() {
  const { lang, online } = useStore();
  const [params] = useSearchParams();
  const initial = (params.get("q") || "").trim();
  const [draft, setDraft] = useState(initial);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ask",
        body: { lang },
      }),
    [lang],
  );

  const { messages, sendMessage, status, error } = useChat({ transport });

  useEffect(() => {
    if (!initial || sentQueries.has(initial)) return;
    sentQueries.add(initial);
    sendMessage({ text: initial });
  }, [initial, sendMessage]);

  const latestQuestion = [...messages].reverse().find((m) => m.role === "user");
  const localQuery = textOf(latestQuestion || { id: "", role: "user", parts: [{ type: "text", text: initial }] });
  const localHits = useMemo(() => (localQuery ? searchCatalog(localQuery, lang, 6) : { records: [], folders: [] }), [localQuery, lang]);
  const localRecords = localHits.records.map((hit) => getById(hit.record_id)).filter(Boolean);
  const extraFolders = localHits.folders.length ? localHits.folders : matchingFolders(localQuery, lang);

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const showLocal = Boolean(localRecords.length && (!lastAssistant || recordIdsFrom(lastAssistant).length === 0));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    sendMessage({ text });
    setDraft("");
  }

  const busy = status === "submitted" || status === "streaming";
  const progressPhase = askProgressPhase(status, lastAssistant);
  const unavailable = error?.message?.includes("503") || /not_configured/i.test(error?.message || "");

  return (
    <div className="ask-page">
      <p className="ask-kicker">{t(lang, "askHeadline")}</p>

      {messages.length === 0 && !busy && !initial ? (
        <div className="ask-empty">
          <p className="muted">{t(lang, "askHint")}</p>
          <div className="ask-suggestions">
            {ASK_PROMPTS.map((prompt) => (
              <button
                key={prompt.en}
                type="button"
                className="ask-chip"
                onClick={() => {
                  sentQueries.add(prompt[lang]);
                  sendMessage({ text: prompt[lang] });
                }}
              >
                {prompt[lang]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="ask-thread">
        {messages.map((message) => {
          if (message.role === "user") {
            return (
              <div className="ask-msg user" key={message.id}>
                {textOf(message)}
              </div>
            );
          }
          const ids = recordIdsFrom(message);
          const folders = folderHitsFrom(message);
          const body = textOf(message);
          return (
            <div className="ask-msg bot" key={message.id}>
              {body
                ? body.split(/\n{2,}/).map((para, idx) => (
                    <p key={`${message.id}-${idx}`} className="ask-p">
                      {para}
                    </p>
                  ))
                : null}
              {folders.length ? (
                <div className="ask-folders">
                  {folders.map((folder) => (
                    <Link className="need-chip inline" key={folder.path} to={folder.path}>
                      <span className="need-ico">{folder.icon}</span>
                      {t(lang, "askOpenList")} {folder.title}
                    </Link>
                  ))}
                </div>
              ) : null}
              {ids.length ? (
                <div className="ask-cards">
                  <p className="ask-cards-label">{t(lang, "askFromDirectory")}</p>
                  {ids.map((id) => {
                    const rec = getById(id);
                    return rec ? <RecordCard key={id} r={rec} compact /> : null;
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
        {progressPhase ? <AskProgress phase={progressPhase} lang={lang} /> : null}
      </div>

      {unavailable || !online ? (
        <div className="banner">{!online ? t(lang, "askOffline") : t(lang, "askUnavailable")}</div>
      ) : null}

      {error && !unavailable ? <div className="banner warn">{t(lang, "askUnavailable")}</div> : null}

      {showLocal ? (
        <div className="ask-cards">
          <p className="ask-cards-label">{t(lang, "askFromDirectory")}</p>
          {extraFolders.map((folder) => (
            <Link className="need-chip inline" key={folder.path} to={folder.path}>
              <span className="need-ico">{folder.icon}</span>
              {t(lang, "askOpenList")} {folder.title}
            </Link>
          ))}
          {localRecords.map((r) => (r ? <RecordCard key={r.record_id} r={r} compact /> : null))}
        </div>
      ) : null}

      <form className="ask-composer" onSubmit={onSubmit}>
        <AskIcon />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t(lang, "askPlaceholder")}
          aria-label={t(lang, "askHeadline")}
          disabled={busy}
        />
        <button className="ask-go" type="submit" disabled={busy || !draft.trim()} aria-busy={busy}>
          {busy ? t(lang, "askWorking") : t(lang, "askSend")}
        </button>
      </form>
    </div>
  );
}
