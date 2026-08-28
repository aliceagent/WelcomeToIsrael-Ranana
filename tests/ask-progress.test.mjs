import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("ask progress UI communicates request, search, think, and write stages", () => {
  const askPage = readFileSync(join(root, "src/pages/Ask.tsx"), "utf8");
  const progress = readFileSync(join(root, "src/components/AskProgress.tsx"), "utf8");
  const logic = readFileSync(join(root, "src/lib/ask-progress.ts"), "utf8");
  const i18n = readFileSync(join(root, "src/lib/i18n.ts"), "utf8");
  const css = readFileSync(join(root, "src/styles/global.css"), "utf8");

  assert.match(askPage, /AskProgress/);
  assert.match(askPage, /askProgressPhase/);
  assert.match(askPage, /aria-busy=\{busy\}/);
  assert.match(progress, /role="status"/);
  assert.match(progress, /aria-live="polite"/);
  assert.match(logic, /processing/);
  assert.match(logic, /tool-searchDirectory/);
  assert.match(logic, /reasoning/);
  assert.match(i18n, /askProcessing/);
  assert.match(i18n, /askSearching/);
  assert.match(i18n, /askThinking/);
  assert.match(i18n, /askWriting/);
  assert.match(i18n, /askWorking/);
  assert.match(css, /\.ask-progress-spinner/);
});
