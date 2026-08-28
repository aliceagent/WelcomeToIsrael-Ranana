import { useStore } from "../lib/store";
import { t } from "../lib/i18n";

/** Reads a Hebrew word aloud with the device's speech synthesis. */
export function SpeakButton({ text }: { text: string }) {
  const { lang } = useStore();
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  return (
    <button
      type="button"
      className="speak"
      aria-label={t(lang, "listen")}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "he-IL";
        u.rate = 0.85;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }}
    >
      <span aria-hidden="true">🔊</span>
    </button>
  );
}
