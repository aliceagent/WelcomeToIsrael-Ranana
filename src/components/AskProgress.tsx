import { t, type DictKey } from "../lib/i18n";
import {
  askProgressDetailKey,
  askProgressLabelKey,
  askProgressStep,
  type AskProgressProps,
} from "../lib/ask-progress";

const STEPS = ["askStepRequest", "askStepSearch", "askStepAnswer"] as const;

export function AskProgress({ phase, lang }: AskProgressProps) {
  const activeStep = askProgressStep(phase);

  return (
    <div className="ask-progress" role="status" aria-live="polite" aria-busy="true">
      <div className="ask-progress-head">
        <span className="ask-progress-spinner" aria-hidden="true" />
        <div className="ask-progress-copy">
          <strong>{t(lang, askProgressLabelKey(phase) as DictKey)}</strong>
          <p>{t(lang, askProgressDetailKey(phase) as DictKey)}</p>
        </div>
      </div>
      <ol className="ask-progress-steps" aria-label={t(lang, "askProgressSteps")}>
        {STEPS.map((key, index) => {
          const state = index < activeStep ? "done" : index === activeStep ? "active" : "pending";
          return (
            <li key={key} className={`ask-progress-step ${state}`}>
              <span className="ask-progress-dot" aria-hidden="true" />
              <span>{t(lang, key)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
