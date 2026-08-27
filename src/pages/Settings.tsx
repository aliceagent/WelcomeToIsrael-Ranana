import { useState } from "react";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { meta } from "../lib/data";

export function SettingsPage() {
  const { lang, home, setHome, resetHome, profile, setProfile } = useStore();
  const [lat, setLat] = useState(String(home.lat));
  const [lng, setLng] = useState(String(home.lng));

  return (
    <div>
      <h1 style={{ fontFamily: "var(--display)" }}>{t(lang, "settings")}</h1>
      <div className="sheet">
        <h2>{t(lang, "homePin")}</h2>
        <p className="muted">{t(lang, "homePinHelp")}</p>
        <label className="field">
          {t(lang, "latitude")}
          <input value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" />
        </label>
        <label className="field">
          {t(lang, "longitude")}
          <input value={lng} onChange={(e) => setLng(e.target.value)} inputMode="decimal" />
        </label>
        <div className="actions">
          <button
            className="btn primary"
            onClick={() => {
              const a = Number(lat);
              const b = Number(lng);
              if (Number.isFinite(a) && Number.isFinite(b)) setHome({ lat: a, lng: b });
            }}
          >
            {t(lang, "save")}
          </button>
          <button
            className="btn"
            onClick={() => {
              resetHome();
              setLat(String(meta.home_default.lat));
              setLng(String(meta.home_default.lng));
            }}
          >
            {t(lang, "useDefaultPin")}
          </button>
        </div>
      </div>
      <div className="sheet">
        <h2>{t(lang, "profile")}</h2>
        <p>{t(lang, "weDrive")}</p>
        <div className="actions">
          <button className={`btn ${profile.drives ? "primary" : ""}`} onClick={() => setProfile({ drives: true })}>
            {t(lang, "yes")}
          </button>
          <button className={`btn ${profile.drives === false ? "primary" : ""}`} onClick={() => setProfile({ drives: false })}>
            {t(lang, "no")}
          </button>
        </div>
        <p>{t(lang, "weHaveKids")}</p>
        <div className="actions">
          <button className={`btn ${profile.kids ? "primary" : ""}`} onClick={() => setProfile({ kids: true })}>
            {t(lang, "yes")}
          </button>
          <button className={`btn ${profile.kids === false ? "primary" : ""}`} onClick={() => setProfile({ kids: false })}>
            {t(lang, "no")}
          </button>
        </div>
      </div>
      <p className="muted">{meta.privacy_note}</p>
    </div>
  );
}
