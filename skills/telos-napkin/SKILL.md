---
name: telos-napkin
description: Turn a wireframe screenshot (or Figma frame) into a styled phone-frame screen in the user's design system. Optionally critique it against a KR. Use when the user wants to create or sketch a product screen.
argument-hint: "<Flow> > <Screen>  [| KR: ...]   (then paste a wireframe)"
---

# Telos — Create a Screen

Render one screen from a wireframe, register it, and (if a KR is given) critique the flow.

## Resolve context

Read `~/.telos/config.json` for `workspace`, `designSystem`, `defaultProject`. If it's missing, tell the user to run `/telos-setup` first. Templates live at `${CLAUDE_PLUGIN_ROOT}/templates/`; bookkeeping is the `telos-registry` command.

## Step 1 — Parse inputs

From the user's input get: **flow name**, **screen name** (required), **project** (default `defaultProject`), optional **KR**. If no wireframe image is attached, ask for one.

**Figma link?** If they paste a `figma.com/design/...` URL instead of an image: read `figmaToken` from config (if absent, ask them to create a Personal Access Token and save it to config). Parse `file_key` + `node-id` (replace `-` with `:`), then:
```bash
curl -s -H "X-Figma-Token: TOKEN" "https://api.figma.com/v1/images/FILE_KEY?ids=NODE_ID&format=png&scale=2"
```
Download the returned image URL to `/tmp/telos-figma-export.png` and use it as the wireframe.

## Step 2 — Check design system

Confirm `<workspace>/<designSystem>` exists. If not: "No design system found. Run `/telos-setup` first."

## Step 3 — Render

Delegate to the **`telos-render`** subagent in **create** mode, passing:
- the wireframe image
- design-system path: `<workspace>/<designSystem>`
- screen template path: `${CLAUDE_PLUGIN_ROOT}/templates/screen-template.html`
- output path: `<workspace>/projects/<project-slug>/flows/<flow-slug>/<screen-slug>-v1.html`
- flow name, screen name

Capture the file path it reports.

## Step 4 — Register

Run the registry to record the screen, update the manifest, regenerate the walkthrough + project index, and (in connected mode) push:
```bash
telos-registry add-screen --project "<project-slug>" --flow "<flow-slug>" \
  --screen "<screen-slug>" --screen-name "<Screen Name>" --file "<screen-file>" \
  --flow-name "<Flow Name>"
```
(First screen in a new flow: also pass `--flow-icon`, `--flow-iconbg`, `--flow-description`, `--project-name` so the hub renders nicely. Pick a fitting emoji + light bg.)

## Step 5 — Critique (only if a KR was given)

If the user supplied a KR, run `/telos-review` behavior: scan the flow's screens and delegate to the **`telos-critique`** subagent (see the telos-review skill for the full critique flow), then `telos-registry set-critique`.

## Done

Report: screen file (with version), manifest/walkthrough updated, push status (connected) or "saved locally", and the critique-card path + alignment if a KR was given. Remind them they can ask `/telos` to open their hub. Keep it short.
