---
name: telos-review
description: Critique a flow against one or more Key Results (business goals, not UX heuristics). Produces a shareable critique card + a side-by-side review board. Use when the user wants an impact review of an existing flow.
argument-hint: "<Flow> | KR: <goal>   [| --eval]"
---

# Telos — Impact Review

Generate a KR-driven critique for an existing flow.

## Resolve context

Read `~/.telos/config.json` for `workspace`, `defaultProject`. Missing → run `/telos-setup` first. Templates at `${CLAUDE_PLUGIN_ROOT}/templates/`; bookkeeping via `telos-registry`.

## Step 1 — Parse inputs

Get the **flow** (required), one or more **KRs** (required — this is what makes it an impact review, not a UX audit), **project** (default `defaultProject`), and the optional **`--eval`** flag. If the KR is missing, ask for it.

## Step 2 — Locate the screens

Find the screen HTML files in `<workspace>/projects/<project-slug>/flows/<flow-slug>/`, excluding `walkthrough.html`, `review.html`, `critique-card.html`, and anything starting with `critique`. If none, tell the user and stop.

## Step 3 — Critique

Delegate to the **`telos-critique`** subagent, passing:
- the screen file paths
- the KR statement(s), flow name, project name
- critique template: `${CLAUDE_PLUGIN_ROOT}/templates/critique-card-template.html`
- review template: `${CLAUDE_PLUGIN_ROOT}/templates/review-template.html`
- output dir: the flow directory
- comments path (if it exists): `<workspace>/comments/<project-slug>/<flow-slug>.json`

It writes `critique-card.html` + `review.html` and reports the alignment score + recommendation count.

## Step 4 — Eval (only if `--eval`)

Delegate the critique content + KR to the **`telos-eval`** subagent in `single` mode. Report the confidence score. If it scores below 24/30, offer one retry (re-run the critique with feedback on the weakest dimension).

## Step 5 — Record

```bash
telos-registry set-critique --project "<project-slug>" --flow "<flow-slug>" \
  --alignment <N> --verdict "<Weak|Partial|Strong|Full>" --kr "<KR text>" --has-review
```
This updates the manifest (the hub shows the alignment dots + KR) and pushes in connected mode.

## Done

Report: critique-card path, review-board path, alignment score, recommendation count (for `/telos-apply`), and confidence (if `--eval`). Keep it short.
