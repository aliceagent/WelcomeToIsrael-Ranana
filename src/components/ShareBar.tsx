import { useState } from "react";
import type { Resource } from "../lib/types";
import { displayName } from "../lib/format";
import { shareContent, whatsappShareUrl, recordPath, absoluteUrl } from "../lib/share";
import { t } from "../lib/i18n";
import { useStore } from "../lib/store";

export function ShareBar({ r }: { r: Resource }) {
  const { lang } = useStore();
  const [msg, setMsg] = useState("");
  const title = displayName(r, lang);
  const url = absoluteUrl(recordPath(r));

  return (
    <div className="actions">
      <button
        className="btn primary"
        onClick={async () => {
          const res = await shareContent(title, r.description_en || title, url);
          if (res === "copied") setMsg(t(lang, "copied"));
        }}
      >
        {t(lang, "share")}
      </button>
      <a className="btn" href={whatsappShareUrl(title, url)} target="_blank" rel="noreferrer">
        {t(lang, "whatsapp")}
      </a>
      {msg ? <span className="muted">{msg}</span> : null}
    </div>
  );
}
