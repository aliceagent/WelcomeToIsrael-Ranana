import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("ask answer collapses long replies with read-more styling", () => {
  const askPage = readFileSync(join(root, "src/pages/Ask.tsx"), "utf8");
  const answer = readFileSync(join(root, "src/components/AskAnswer.tsx"), "utf8");
  const format = readFileSync(join(root, "src/lib/ask-format.tsx"), "utf8");
  const i18n = readFileSync(join(root, "src/lib/i18n.ts"), "utf8");
  const css = readFileSync(join(root, "src/styles/global.css"), "utf8");

  assert.match(askPage, /AskAnswer/);
  assert.match(answer, /ask-answer-body/);
  assert.match(answer, /askReadMore/);
  assert.match(answer, /aria-expanded/);
  assert.match(format, /formatAskInline/);
  assert.match(format, /ask-answer-list/);
  assert.match(i18n, /askReadMore/);
  assert.match(i18n, /askShowLess/);
  assert.match(css, /33dvh/);
  assert.match(css, /ask-answer-toggle/);
});
