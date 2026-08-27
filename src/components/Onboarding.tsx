import { useStore } from "../lib/store";
import { t } from "../lib/i18n";

export function Onboarding() {
  const { lang, onboarded, setOnboarded, profile, setProfile } = useStore();
  if (onboarded) return null;
  return (
    <div className="sheet">
      <h2 style={{ fontFamily: "var(--display)", marginTop: 0 }}>{t(lang, "onboardingTitle")}</h2>
      <p className="muted">{t(lang, "weDrive")}</p>
      <div className="actions">
        <button className={`btn ${profile.drives === true ? "primary" : ""}`} onClick={() => setProfile({ drives: true })}>
          {t(lang, "yes")}
        </button>
        <button className={`btn ${profile.drives === false ? "primary" : ""}`} onClick={() => setProfile({ drives: false })}>
          {t(lang, "no")}
        </button>
      </div>
      <p className="muted">{t(lang, "weHaveKids")}</p>
      <div className="actions">
        <button className={`btn ${profile.kids === true ? "primary" : ""}`} onClick={() => setProfile({ kids: true })}>
          {t(lang, "yes")}
        </button>
        <button className={`btn ${profile.kids === false ? "primary" : ""}`} onClick={() => setProfile({ kids: false })}>
          {t(lang, "no")}
        </button>
      </div>
      <div className="actions">
        <button className="btn ghost" onClick={() => setOnboarded(true)}>
          {t(lang, "skip")}
        </button>
        <button className="btn primary" onClick={() => setOnboarded(true)}>
          {t(lang, "continue")}
        </button>
      </div>
    </div>
  );
}
