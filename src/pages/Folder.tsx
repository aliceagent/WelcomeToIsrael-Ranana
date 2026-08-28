import { useMemo, useState } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { RecordCard } from "../components/RecordCard";
import { NearMeToggle } from "../components/NearMeToggle";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { getFolder, folderLabel, recordsInFolder, directorySorter } from "../lib/directory";
import { effectiveKm } from "../lib/geo";
import { openState } from "../lib/hours";
import { shareContent, whatsappShareUrl, absoluteUrl } from "../lib/share";
import type { Resource } from "../lib/types";

export function FolderPage() {
  const { slug } = useParams();
  const { lang, origin, originIsDefault } = useStore();
  const [msg, setMsg] = useState("");
  const folder = getFolder(slug);
  // Filters live in the URL so back-navigation keeps them and lists stay shareable.
  const [params, setParams] = useSearchParams();
  const raanana = params.get("raanana") === "1";
  const physical = params.get("physical") === "1";
  const chip = params.get("chip") || "all";

  function patchParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value == null) next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace: true });
  }

  const items = useMemo(() => {
    if (!folder) return [];
    const kmOf = (r: Resource) => effectiveKm(r, origin, originIsDefault);
    let list = recordsInFolder(folder, kmOf);
    if (chip !== "all" && folder.chips) {
      const selected = folder.chips.find((c) => c.id === chip);
      if (selected) list = list.filter(selected.match).sort(directorySorter(kmOf));
    }
    if (raanana) list = list.filter((r) => r.is_raanana);
    if (physical) list = list.filter((r) => r.is_physical_location);
    return list;
  }, [folder, raanana, physical, chip, origin, originIsDefault]);

  if (!slug) return <Navigate to="/" replace />;
  if (!folder) return <div className="empty">{t(lang, "noResults")}</div>;

  const url = absoluteUrl(`/d/${folder.id}`);
  const title = folderLabel(folder, lang);

  return (
    <div>
      {folder.hint ? <p className="muted" style={{ marginTop: 0 }}>{folder.hint[lang]}</p> : null}
      <p className="muted">
        {items.length} {t(lang, "results")}
      </p>
      {folder.chips?.length ? (
        <div className="filters">
          <button aria-pressed={chip === "all"} className={chip === "all" ? "on" : ""} onClick={() => patchParams({ chip: null })}>
            {t(lang, "any")}
          </button>
          {folder.chips.map((c) => (
            <button key={c.id} aria-pressed={chip === c.id} className={chip === c.id ? "on" : ""} onClick={() => patchParams({ chip: c.id })}>
              {c.title[lang]}
            </button>
          ))}
        </div>
      ) : null}
      <div className="filters">
        <NearMeToggle />
        <button aria-pressed={raanana} className={raanana ? "on" : ""} onClick={() => patchParams({ raanana: raanana ? null : "1" })}>
          {t(lang, "raananaOnly")}
        </button>
        <button aria-pressed={physical} className={physical ? "on" : ""} onClick={() => patchParams({ physical: physical ? null : "1" })}>
          {t(lang, "physicalOnly")}
        </button>
      </div>
      <div className="actions" style={{ marginBottom: 12 }}>
        <button
          className="btn"
          onClick={async () => {
            const shareText = folder.hint?.[lang] || t(lang, "shareFolderFallback").replace("{name}", title);
            const res = await shareContent(title, shareText, url, `/og/d/${folder.id}.png`);
            if (res === "copied") setMsg(t(lang, "copied"));
          }}
        >
          {t(lang, "shareCategory")}
        </button>
        <a className="wa-text" href={whatsappShareUrl(title, url, folder.hint?.[lang] || title)}>
          {t(lang, "whatsapp")}
        </a>
        {msg ? <span className="muted">{msg}</span> : null}
      </div>
      {folder.caveat === "shelter" ? <div className="banner warn">{t(lang, "shelterCaveat")}</div> : null}
      {folder.caveat === "hours" ? <div className="banner">{t(lang, "hoursCaveat")}</div> : null}
      {folder.caveat === "kosher" ? <div className="banner">{t(lang, "kosherCaveat")}</div> : null}
      {folder.pinIds?.length ? <div className="banner">{t(lang, "tryLiveHelp")}</div> : null}
      {items.length === 0 ? <div className="empty">{t(lang, "noResults")}</div> : null}
      {items.map((r) => {
        const closed = openState(r) === "closed";
        return (
          <div key={r.record_id} className={closed ? "closed-wrap" : undefined}>
            <RecordCard r={r} compact />
          </div>
        );
      })}
    </div>
  );
}
