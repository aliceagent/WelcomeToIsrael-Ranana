import { useEffect, useState } from "react";
import { useStore } from "../lib/store";
import { t, type DictKey } from "../lib/i18n";

const VISITS_KEY = "raanana.visits";
const STATE_KEY = "raanana.installNudge";
const SESSION_KEY = "raanana.visitCounted";
/** Visit counts that trigger the card: first ask, then two reminders. */
const THRESHOLDS = [2, 5, 10];

type NudgeState = { shown: number; never: boolean };

function readState(): NudgeState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<NudgeState>) : {};
    return { shown: Number(parsed.shown) || 0, never: !!parsed.never };
  } catch {
    return { shown: 0, never: false };
  }
}

function writeState(state: NudgeState) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    /* private mode: the nudge just re-evaluates next launch */
  }
}

/** Counts one "use" per browser session, however many pages get visited. */
function countVisit(): number {
  try {
    const visits = (Number(localStorage.getItem(VISITS_KEY)) || 0) + (sessionStorage.getItem(SESSION_KEY) ? 0 : 1);
    if (!sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, "1");
      localStorage.setItem(VISITS_KEY, String(visits));
    }
    return visits;
  } catch {
    return 0;
  }
}

function isStandalone(): boolean {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS reports as Mac; the touch check catches it.
  if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

// Chrome on Android offers a real install prompt; hold on to it so the card's
// button can trigger it instead of walking through the menu by hand.
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferredPrompt: InstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as InstallPromptEvent;
  });
}

/**
 * "Add it to your home screen" card. Appears on the 2nd use of the app and,
 * if put off with "Remind me later", again on the 5th and 10th use — three
 * showings at most. From the second showing on, "Don't show again" opts out
 * for good. Steps are tailored to iPhone vs Android, and installed (standalone)
 * launches never see it.
 */
export function InstallNudge() {
  const { lang } = useStore();
  const [open, setOpen] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const platform = detectPlatform();

  useEffect(() => {
    const visits = countVisit();
    if (isStandalone()) return;
    try {
      if (!localStorage.getItem("raanana.onboarded")) return; // never stack on the first-run tour
    } catch {
      return;
    }
    const state = readState();
    if (state.never || state.shown >= THRESHOLDS.length) return;
    if (visits >= THRESHOLDS[state.shown]) {
      setDisplayIndex(state.shown);
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  function remindLater() {
    writeState({ ...readState(), shown: displayIndex + 1 });
    setOpen(false);
  }

  function dontShowAgain() {
    writeState({ shown: displayIndex + 1, never: true });
    setOpen(false);
  }

  async function installNow() {
    if (!deferredPrompt) return;
    const evt = deferredPrompt;
    deferredPrompt = null;
    await evt.prompt();
    const choice = await evt.userChoice.catch(() => ({ outcome: "dismissed" }));
    if (choice.outcome === "accepted") dontShowAgain();
  }

  const steps: DictKey[] =
    platform === "ios"
      ? ["nudgeIosStep1", "nudgeIosStep2", "nudgeIosStep3"]
      : platform === "android"
        ? ["nudgeAndroidStep1", "nudgeAndroidStep2", "nudgeAndroidStep3"]
        : ["nudgeOtherStep"];

  return (
    <div className="onboard nudge" role="dialog" aria-modal="true" aria-label={t(lang, "nudgeTitle")}>
      <div className="onboard-card nudge-card">
        <div className="nudge-ico" aria-hidden="true">
          📲
        </div>
        <h2>{t(lang, "nudgeTitle")}</h2>
        <p className="muted">{t(lang, "nudgeIntro")}</p>
        <ol className="nudge-steps">
          {steps.map((key) => (
            <li key={key}>{t(lang, key)}</li>
          ))}
        </ol>
        <div className="actions" style={{ flexDirection: "column" }}>
          {platform === "android" && deferredPrompt ? (
            <button className="btn primary" onClick={installNow}>
              {t(lang, "nudgeInstallNow")}
            </button>
          ) : null}
          <button className="btn" onClick={remindLater}>
            {t(lang, "nudgeRemindLater")}
          </button>
          {displayIndex >= 1 ? (
            <button className="nudge-never" onClick={dontShowAgain}>
              {t(lang, "nudgeDontShowAgain")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
