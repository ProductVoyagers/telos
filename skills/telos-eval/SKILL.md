---
name: telos-eval
description: Score the quality of a critique across 6 dimensions (/30). Single mode scores one flow's critique (the premium confidence badge); suite mode runs the dev test cases. Use to check how trustworthy a critique is.
argument-hint: "single <flow>   |   suite"
---

# Telos — Eval

Score a critique's quality (not the design). Two modes.

## Resolve context

Read `~/.telos/config.json` for `workspace`, `defaultProject`. The eval worker is the `telos-eval` subagent.

## Mode A — single (per-critique confidence)

`/telos-eval single <flow>`

1. Locate `<workspace>/projects/<project-slug>/flows/<flow-slug>/critique-card.html`. Absent → tell them to run `/telos-review` first.
2. Extract the KR(s) from the critique's KR header.
3. Delegate to the **`telos-eval`** subagent in `single` mode with the critique content + KR.
4. Report the 6-dimension breakdown, total /30, and the confidence % + badge color. If below 24/30, offer one retry (re-run `/telos-review` with feedback on the weakest dimension).

## Mode B — suite (dev test cases)

`/telos-eval suite` (default if no args)

1. Read test-case files from `<workspace>/evals/test-cases/` (each: flow description/screens, KR(s), expected findings, anti-expectations, expected alignment range).
2. For each: if it references real screens, delegate to `telos-critique` to generate a critique; then delegate to `telos-eval` in `suite` mode with the critique + KR + expectations.
3. Print a summary table (test case, score, PASS/FAIL, weakest dimension), the average, and the pass rate. Save results to `<workspace>/evals/results/<test-case>-<date>.md`.

> Note: the plugin ships without bundled test cases. Suite mode runs against whatever test cases exist in the user's own `evals/test-cases/` (e.g. the habit-tracker example, or cases they add).

## Done

Report the scores. Keep it short.
