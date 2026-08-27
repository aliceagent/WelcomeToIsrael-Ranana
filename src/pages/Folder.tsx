import { useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { RecordCard } from "../components/RecordCard";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { getFolder, folderLabel, recordsInFolder, sortDirectory } from "../lib/directory";
import { shareContent, whatsappShareUrl, absoluteUrl } from "../lib/share";

export function FolderPage() {
  const { slug } = useParams();
  const { lang } = useStore();
  const folder = getFolder(slug);
  const [raanana, setRaanana] = useState(false);
  const [physical, setPhysical] = useState(false);
  const [chip, setChip] = useState("all");

  const items = useMemo(() => {
    if (!folder) return [];
    let list = recordsInFolder(folder);
    if (chip !== "all" && folder.chips) {
      const selected = folder.chips.find((c) => c.id === chip);
      if (selected) list = list.filter(selected.match).sort(sortDirectory);
    }
    if (raanana) list = list.filter((r) => r.is_raanana);
    if (physical) list = list.filter((r) => r.is_physical_location);
    return list;
  }, [folder, raanana, physical, chip]);

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
          <button className={chip === "all" ? "on" : ""} onClick={() => setChip("all")}>
            {t(lang, "any")}
          </button>
          {folder.chips.map((c) => (
            <button key={c.id} className={chip === c.id ? "on" : ""} onClick={() => setChip(c.id)}>
              {c.title[lang]}
            </button>
          ))}
        </div>
      ) : null}
      <div className="filters">
        <button className={raanana ? "on" : ""} onClick={() => setRaanana((v) => !v)}>
          {t(lang, "raananaOnly")}
        </button>
        <button className={physical ? "on" : ""} onClick={() => setPhysical((v) => !v)}>
          {t(lang, "physicalOnly")}
        </button>
      </div>
      <div className="actions" style={{ marginBottom: 12 }}>
        <button className="btn" onClick={() => shareContent(title, folder.hint?.[lang] || `${title} — Welcome to Ra'anana.`, url, `/og/d/${folder.id}.png`)}>
          {t(lang, "shareCategory")}
        </button>
        <a className="wa-text" href={whatsappShareUrl(title, url, folder.hint?.[lang] || title)}>
          {t(lang, "whatsapp")}
        </a>
      </div>
      {folder.caveat === "shelter" ? <div className="banner warn">{t(lang, "shelterCaveat")}</div> : null}
      {folder.caveat === "hours" ? <div className="banner">{t(lang, "hoursCaveat")}</div> : null}
      {folder.caveat === "kosher" ? <div className="banner">{t(lang, "kosherCaveat")}</div> : null}
      {folder.pinIds?.length ? <div className="banner">{t(lang, "tryLiveHelp")}</div> : null}
      {items.length === 0 ? <div className="empty">{t(lang, "noResults")}</div> : null}
      {items.map((r) => (
        <RecordCard key={r.record_id} r={r} compact />
      ))}
    </div>
  );
}
