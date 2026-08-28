import { useState } from "react";
import type { Resource } from "../lib/types";
import { displayDescription, displayName, TYPE_LABELS } from "../lib/format";
import { shareContent, whatsappShareUrl, recordPath, absoluteUrl, recordOgImage } from "../lib/share";
import { t } from "../lib/i18n";
import { useStore } from "../lib/store";

export function ShareBar({ r }: { r: Resource }) {
  const { lang } = useStore();
  const [msg, setMsg] = useState("");
  const title = displayName(r, lang);
  const url = absoluteUrl(recordPath(r));
  const type = TYPE_LABELS[r.record_type]?.[lang] || r.category;
  const text = displayDescription(r, lang) || t(lang, "shareRecordFallback").replace("{name}", title).replace("{type}", type);

  return (
    <div className="actions">
      <button
        className="btn primary"
        onClick={async () => {
          const res = await shareContent(title, text, url, recordOgImage(r));
          if (res === "copied") setMsg(t(lang, "copied"));
        }}
      >
        {t(lang, "share")}
      </button>
      <a className="wa-text" href={whatsappShareUrl(title, url, text)} target="_blank" rel="noreferrer">
        {t(lang, "whatsapp")}
      </a>
      {msg ? <span className="muted">{msg}</span> : null}
    </div>
  );
}
