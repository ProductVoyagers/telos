---
name: telos-setup
description: One-time Telos setup. Captures the user's identity + team, learns their product's design system from 3-5 screenshots, scaffolds a workspace, and optionally connects a GitHub repo to publish the hub. Run this before any other Telos command.
argument-hint: "(then paste 3-5 product screenshots)"
---

# Telos — Setup

Get a PM from zero to a working Telos workspace. This writes `~/.telos/config.json` (the contract every other Telos command reads), scaffolds the workspace + hub, and extracts their design system. Works **local-first** — GitHub is optional and can be added later.

## Resolve plugin paths

- Registry script: `telos-registry` (on PATH when the plugin is enabled).
- Templates + schema: `${CLAUDE_PLUGIN_ROOT}/templates/` and `${CLAUDE_PLUGIN_ROOT}/config/config.schema.json`.
- Design-system agent: the `telos-design-system` subagent.

## Step 1 — Identity & team

Ask for (or confirm from git config):
- **Name** and **email** (used for commit + comment attribution and flow ownership).
- **Team label** — shown in the hub header (e.g. "Growth", "Mobile"). Optional.

## Step 2 — Local or connected?

Ask: *"Keep everything on your machine for now, or connect a GitHub repo so your hub is shareable?"*

- **Local (default):** `sync: "local"`, `workspace` defaults to `~/telos-workspace` (let them change it).
- **Connected:** ask for the repo URL (or offer to help them create one), branch (default `main`), and the Pages URL once known. `workspace` becomes the local clone path. Reassure: nothing is pushed until they run a command that produces output.

You can always start local and connect later by re-running setup.

## Step 3 — Write the config

Write `~/.telos/config.json` matching `${CLAUDE_PLUGIN_ROOT}/config/config.schema.json`:

```json
{
  "schemaVersion": 1,
  "identity": { "name": "...", "email": "..." },
  "sync": "local",
  "workspace": "/Users/.../telos-workspace",
  "designSystem": "design-system.json",
  "defaultProject": "<slug>",
  "team": "<team label or null>",
  "figmaToken": null
}
```

(Add the `repo` block only in connected mode.) Create `~/.telos/` if needed.

## Step 4 — Scaffold the workspace

Run `telos-registry init`. This creates the workspace, copies the hub templates (index, project-index source, walkthrough source, comments, how-it-works), and writes an empty `manifest.json`. In connected mode it clones the repo and pushes the initial scaffold.

## Step 5 — Extract the design system

Ask the user to paste **3-5 screenshots** of their product (a main/list screen, a detail screen, a form/input screen; optionally nav, cards). If fewer than 3, ask for more — variety reveals more tokens.

Delegate to the **`telos-design-system`** subagent, passing: the screenshots, the output path (`<workspace>/design-system.json`), and the design-system name. It writes `design-system.json`.

Show the extracted tokens back (colors, font, radius, frame, components). If anything's off, edit `design-system.json` directly.

## Step 6 — Confirm

Tell the user setup is done and what's next:
- Local: "Run `/telos-napkin` to make your first screen, or just talk to `/telos` (ask it to open your hub anytime)."
- Connected: also give them the Pages URL and remind them to enable GitHub Pages on the repo if they haven't.

> Note (squad/comments): in connected mode, the hub's comment threads are GitHub-backed. The owner/repo/branch placeholders in `comments.js` get filled from config; a GitHub token for comments is handled separately and never committed. (Comments are a squad feature — fine to skip for solo use.)

## Done

Report: identity, team, sync mode, workspace path, design-system name + token count, and the next command. Keep it short.
