import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { AskAnswer } from "../components/AskAnswer";
import { RecordCard } from "../components/RecordCard";
import { AskProgress } from "../components/AskProgress";
import { AskIcon } from "../components/Icons";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { getById } from "../lib/data";
import { askIsBusy, askProgressLabelKey, askProgressPhase, textOf } from "../lib/ask-progress";
import type { DictKey } from "../lib/i18n";
import { ASK_PROMPTS, ensureCatalogSearch, matchingFolders, searchCatalog } from "../lib/catalog-hits";

ensureCatalogSearch();

const sentQueries = new Set<string>();

const HISTORY_KEY = "raanana.askHistory";
type AskHistoryEntry = { q: string; a: string; ts: number };

function readHistory(): AskHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as AskHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: AskHistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    /* private mode: history is a convenience only */
  }
}

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
  const [startedAt, setStartedAt] = useState<number | undefined>();
  const wasBusy = useRef(false);
  const [history, setHistory] = useState<AskHistoryEntry[]>(readHistory);

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

  const busy = askIsBusy(status, lastAssistant);
  const progressPhase = askProgressPhase(status, lastAssistant);
  const unavailable = error?.message?.includes("503") || /not_configured/i.test(error?.message || "");

  useEffect(() => {
    if (busy && !wasBusy.current) {
      setStartedAt(Date.now());
    }
    if (!busy && wasBusy.current) {
      setStartedAt(undefined);
      // Cache the finished answer so it can be reopened later, even offline.
      const q = latestQuestion ? textOf(latestQuestion) : "";
      const a = lastAssistant ? textOf(lastAssistant) : "";
      if (q && a) {
        setHistory((prev) => {
          const next = [{ q, a, ts: Date.now() }, ...prev.filter((h) => h.q !== q)].slice(0, 10);
          saveHistory(next);
          return next;
        });
      }
    }
    wasBusy.current = busy;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs on busy transitions only
  }, [busy]);

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
          {history.length ? (
            <div className="ask-recent">
              <p className="ask-cards-label">{t(lang, "recentAnswers")}</p>
              {history.map((h) => (
                <details className="ask-hist" key={h.ts}>
                  <summary>{h.q}</summary>
                  <p className="ask-p">{h.a}</p>
                </details>
              ))}
            </div>
          ) : null}
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
          const searched = message.parts.some((part) => part.type === "tool-searchDirectory");
          const noHits = searched && ids.length === 0 && folders.length === 0 && !!body && !busy;
          return (
            <div className="ask-msg bot" key={message.id}>
              {noHits ? (
                <div className="ask-nohits">
                  <span aria-hidden="true">📭</span>
                  {t(lang, "askNoHits")}
                </div>
              ) : null}
              {body ? <AskAnswer text={body} lang={lang} messageId={message.id} /> : null}
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
        {progressPhase ? (
          <AskProgress phase={progressPhase} lang={lang} assistant={lastAssistant} startedAt={startedAt} />
        ) : null}
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
          {busy && progressPhase
            ? t(lang, askProgressLabelKey(progressPhase) as DictKey)
            : busy
              ? t(lang, "askWorking")
              : t(lang, "askSend")}
        </button>
      </form>
    </div>
  );
}
