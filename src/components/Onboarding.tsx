import { useState } from "react";
import { useStore } from "../lib/store";
import { t } from "../lib/i18n";
import type { Lang } from "../lib/types";

const DONE_KEY = "raanana.onboarded";

const LANG_CHOICES: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "he", label: "עברית" },
];

/** Three-screen first-run setup: language, home pin, install hint. */
export function Onboarding() {
  const { lang, setLang, setHome } = useStore();
  const [open, setOpen] = useState(() => {
    try {
      return !localStorage.getItem(DONE_KEY);
    } catch {
      return false;
    }
  });
  const [step, setStep] = useState(0);
  const [locating, setLocating] = useState(false);
  const [locateFailed, setLocateFailed] = useState(false);

  if (!open) return null;

  function finish() {
    try {
      localStorage.setItem(DONE_KEY, "1");
    } catch {
      /* private mode: the tour simply reappears next launch */
    }
    setOpen(false);
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setLocateFailed(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setHome({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        setStep(2);
      },
      () => {
        setLocating(false);
        setLocateFailed(true);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div className="onboard" role="dialog" aria-modal="true" aria-label={t(lang, "appName")}>
      <div className="onboard-card">
        {step === 0 ? (
          <>
            <div className="onboard-mark" aria-hidden="true">
              ר
            </div>
            <h2>{t(lang, "onboardWelcome")}</h2>
            <p className="muted">{t(lang, "onboardLang")}</p>
            <div className="onboard-langs">
              {LANG_CHOICES.map((c) => (
                <button
                  key={c.code}
                  lang={c.code}
                  className={`btn ${c.code === lang ? "primary" : ""}`}
                  onClick={() => {
                    setLang(c.code);
                    setStep(1);
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h2>{t(lang, "onboardPinTitle")}</h2>
            <p className="muted">{t(lang, "onboardPinBody")}</p>
            <div className="actions">
              <button className="btn primary" onClick={useMyLocation} disabled={locating}>
                <span aria-hidden="true">📍 </span>
                {locateFailed ? t(lang, "locationError") : locating ? "…" : t(lang, "useMyLocation")}
              </button>
              <button className="btn" onClick={() => setStep(2)}>
                {t(lang, "useDefaultPin")}
              </button>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2>{t(lang, "onboardInstallTitle")}</h2>
            <p className="muted">{t(lang, "onboardInstallBody")}</p>
            <div className="actions">
              <button className="btn primary" onClick={finish}>
                {t(lang, "done")}
              </button>
            </div>
          </>
        ) : null}

        {step < 2 ? (
          <button className="onboard-skip" onClick={finish}>
            {t(lang, "skip")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
