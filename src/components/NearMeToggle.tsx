import { useState } from "react";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";

/**
 * Filter-row toggle that measures distances from the device instead of the
 * home pin. The location never leaves the phone and is not persisted.
 */
export function NearMeToggle() {
  const { lang, gps, setGps, useGps, setUseGps } = useStore();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const on = useGps && gps != null;

  function toggle() {
    if (on) {
      setUseGps(false);
      return;
    }
    if (!("geolocation" in navigator)) {
      setFailed(true);
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUseGps(true);
        setBusy(false);
        setFailed(false);
      },
      () => {
        setBusy(false);
        setFailed(true);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  }

  return (
    <button aria-pressed={on} className={on ? "on" : ""} onClick={toggle} disabled={busy}>
      <span aria-hidden="true">📍 </span>
      {failed ? t(lang, "locationError") : busy ? "…" : t(lang, "nearMe")}
    </button>
  );
}
