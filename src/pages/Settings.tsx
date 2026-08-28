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
  const { lang, home, setHome, resetHome, online } = useStore();
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
        <div className="actions">
          <button className="btn primary" onClick={() => setHome(draft)}>
            {t(lang, "save")}
          </button>
          <button className="btn" onClick={useMyLocation} disabled={locating}>
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
      </div>
      <p className="muted">{meta.privacy_note}</p>
    </div>
  );
}
