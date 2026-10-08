---
name: telos-apply
description: Accept specific recommendations from a critique and regenerate the affected screens as new versions. Use after /telos-review when the user wants to act on the suggestions.
argument-hint: "<flow> <nums|all>   e.g. check-in 2,3"
---

# Telos — Apply Recommendations

Apply chosen critique recommendations and produce new screen versions.

## Resolve context

Read `~/.telos/config.json` for `workspace`, `defaultProject`. Missing → `/telos-setup` first. Registry script: `telos-registry`; render template at `${CLAUDE_PLUGIN_ROOT}/templates/screen-template.html`.

## Step 1 — Find the critique

Locate `<workspace>/projects/<project-slug>/flows/<flow-slug>/critique-card.html`. If absent: "No critique found — run `/telos-review` first."

## Step 2 — Extract recommendations

Parse the critique's numbered items (the "What to reconsider" + "Suggestions" sections share one numbering). For each: number, title, and the target screen(s) named in its screen-ref. Present them and confirm which to apply (the user passes comma-separated numbers or `all`).

## Step 3 — Group by screen

Group the accepted recommendations by target screen. Each affected screen gets one new version.

## Step 4 — Regenerate each affected screen

For each screen, read its current version and the next version number from the manifest (`<workspace>/manifest.json`). Delegate to the **`telos-render`** subagent in **modify** mode, passing:
- the current screen HTML
- the modification instructions (the accepted recommendations targeting this screen)
- design-system path, screen template path
- output path: `<...>/<screen-slug>-v<N>.html`

## Step 5 — Register each new version

```bash
telos-registry add-version --project "<project-slug>" --flow "<flow-slug>" \
  --screen "<screen-slug>" --file "<screen-slug>-v<N>.html" \
  --applied-recs "2,3" --note "<what changed>"
```
The registry bumps `currentVersion`, points the screen at the new file, regenerates the walkthrough, and pushes (connected).

## Step 6 — Offer a re-review

Ask if they want to re-run `/telos-review <flow> | KR: <same KR>` to see whether alignment improved.

## Reverting (override / undo)

Applying never overwrites — every version's file stays on disk and the manifest keeps the full `versions` history. If a new version turns out worse, point the screen back at an earlier one (nothing is deleted; you can move forward again later):

```bash
telos-registry revert-version --project "<project-slug>" --flow "<flow-slug>" \
  --screen "<screen-slug>" --to-version <N>
```

Use this when the user says a change made a screen worse, or asks to go back to a previous version. The registry moves the live pointer, regenerates the walkthrough, and pushes (connected).

## Done

Report: each screen's old→new version, the recommendations applied, new file paths, push status. Keep it short.
