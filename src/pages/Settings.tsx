import { useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import { meta } from "../lib/data";
import { homeIcon } from "../components/PlacesMap";
import type { HomePin } from "../lib/types";

function ClickToMove({ onPick }: { onPick: (p: HomePin) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function SettingsPage() {
  const { lang, home, setHome, resetHome, online, address, setAddress, favorites, notes, checks, mergeImport } = useStore();
  const [importText, setImportText] = useState("");
  const [syncMsg, setSyncMsg] = useState("");

  async function shareFamilyData() {
    const payload = JSON.stringify({ v: 1, favs: [...favorites], notes, checks: [...checks], address });
    try {
      if (navigator.share) {
        await navigator.share({ title: t(lang, "familySync"), text: payload });
        return;
      }
    } catch {
      /* fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(payload);
      setSyncMsg(t(lang, "copied"));
    } catch {
      setSyncMsg(payload);
    }
  }

  function importFamilyData() {
    try {
      const start = importText.indexOf("{");
      const end = importText.lastIndexOf("}");
      const data = JSON.parse(importText.slice(start, end + 1));
      mergeImport(data);
      setImportText("");
      setSyncMsg(t(lang, "importDone"));
    } catch {
      setSyncMsg(t(lang, "importFailed"));
    }
  }
  const [draft, setDraft] = useState<HomePin>(home);
  // Remount the map when a button (not a map tap) moves the pin, so it recenters.
  const [mapKey, setMapKey] = useState(0);
  const [locating, setLocating] = useState(false);
  const [locateFailed, setLocateFailed] = useState(false);

  function jumpTo(p: HomePin) {
    setDraft(p);
    setMapKey((k) => k + 1);
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setLocateFailed(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        jumpTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        setLocateFailed(false);
      },
      () => {
        setLocating(false);
        setLocateFailed(true);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div>
      <h1 className="chrome-title">{t(lang, "settings")}</h1>
      <div className="sheet">
        <h2>{t(lang, "homePin")}</h2>
        <p className="muted">{t(lang, "homePinHelp")}</p>
        <div className="actions">
          <button className="btn primary" onClick={useMyLocation} disabled={locating}>
            <span aria-hidden="true">📍 </span>
            {locateFailed ? t(lang, "locationError") : locating ? "…" : t(lang, "useMyLocation")}
          </button>
          <button
            className="btn"
            onClick={() => {
              resetHome();
              jumpTo({ lat: meta.home_default.lat, lng: meta.home_default.lng });
            }}
          >
            {t(lang, "useDefaultPin")}
          </button>
        </div>
        {online ? (
          <>
            <p className="muted">{t(lang, "tapToSetPin")}</p>
            <div className="map-wrap" style={{ height: 280 }}>
              <MapContainer
                key={mapKey}
                center={[draft.lat, draft.lng]}
                zoom={15}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ClickToMove onPick={setDraft} />
                <Marker position={[draft.lat, draft.lng]} icon={homeIcon} />
              </MapContainer>
            </div>
          </>
        ) : (
          <div className="banner off">{t(lang, "mapsNeedNetwork")}</div>
        )}
        <details className="settings-advanced">
          <summary>{t(lang, "settingsAdvanced")}</summary>
          <div className="field-row">
            <label className="field">
              {t(lang, "latitude")}
              <input
                value={String(draft.lat)}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) setDraft((d) => ({ ...d, lat: v }));
                }}
                inputMode="decimal"
              />
            </label>
            <label className="field">
              {t(lang, "longitude")}
              <input
                value={String(draft.lng)}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) setDraft((d) => ({ ...d, lng: v }));
                }}
                inputMode="decimal"
              />
            </label>
          </div>
        </details>
        <div className="actions">
          <button className="btn primary" onClick={() => setHome(draft)}>
            {t(lang, "save")}
          </button>
        </div>
      </div>
      <div className="sheet">
        <h2>{t(lang, "addressSetting")}</h2>
        <p className="muted">{t(lang, "addressSettingHelp")}</p>
        <label className="field">
          {t(lang, "address")}
          <input dir="auto" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="רחוב אחוזה 1, רעננה" />
        </label>
      </div>
      <div className="sheet">
        <h2>{t(lang, "familySync")}</h2>
        <p className="muted">{t(lang, "familySyncHelp")}</p>
        <div className="actions">
          <button className="btn primary" onClick={shareFamilyData}>
            {t(lang, "exportData")}
          </button>
        </div>
        <label className="field">
          {t(lang, "importData")}
          <textarea
            className="import-box"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='{"v":1,…}'
            rows={3}
          />
        </label>
        <div className="actions">
          <button className="btn" onClick={importFamilyData} disabled={!importText.trim()}>
            {t(lang, "importData")}
          </button>
          {syncMsg ? <span className="muted">{syncMsg}</span> : null}
        </div>
      </div>
      <p className="muted">{t(lang, "settingsPrivacy")}</p>
    </div>
  );
}
