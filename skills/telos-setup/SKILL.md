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
  "figmaToken": null,
  "comments": null
}
```

(Add the `repo` block only in connected mode. Leave `comments` as `null` for now — Step 6 fills it if they want comments.) Create `~/.telos/` if needed.

## Step 4 — Scaffold the workspace

Run `telos-registry init`. This creates the workspace, copies the hub templates (index, project-index source, walkthrough source, how-it-works), renders `comments.js` from config, and writes an empty `manifest.json`. In connected mode it clones the repo and pushes the initial scaffold.

## Step 5 — Extract the design system

Ask the user to paste **3-5 screenshots** of their product (a main/list screen, a detail screen, a form/input screen; optionally nav, cards). If fewer than 3, ask for more — variety reveals more tokens.

Delegate to the **`telos-design-system`** subagent, passing: the screenshots, the output path (`<workspace>/design-system.json`), and the design-system name. It writes `design-system.json`.

Show the extracted tokens back (colors, font, radius, frame, components). If anything's off, edit `design-system.json` directly.

## Step 6 — Connect comments (optional, connected mode only)

Impact-review pages can carry inline comments per recommendation, backed by **GitHub Discussions via [Giscus](https://giscus.app)**. Each viewer signs in with their own GitHub account — **no tokens, API keys, or secrets ever touch the page**. The two IDs captured here (`repoId`, `categoryId`) are public identifiers, not credentials. Comments are a squad feature; **fine to skip for solo use** (the widget shows a disabled "connect a repo to enable" state until configured).

Only offer this in connected mode (it needs a GitHub repo with Pages). Ask: *"Want inline comments on your review pages? Reviewers sign in with their own GitHub — no tokens stored."* If yes, walk them through it (most steps are on github.com / giscus.app, so guide, don't automate):

1. **Enable Discussions** on the repo: Settings → Features → check **Discussions**.
2. **Install the Giscus app**: open <https://github.com/apps/giscus> → Install → pick the same repo → grant *Read access to metadata* + *Read and write access to Discussions* (no code access).
3. **Get the two IDs**: open <https://giscus.app>, enter the repo (must show "meets all criteria"), set **Mapping = "Discussion title contains a specific term"** and **Category = General**. Copy the generated `data-repo-id` and `data-category-id`.
4. **Write them to config** — add the `comments` block to `~/.telos/config.json`:

```json
"comments": {
  "provider": "giscus",
  "repo": "<owner>/<repo>",
  "repoId": "R_xxxxxxxx",
  "category": "General",
  "categoryId": "DIC_xxxxxxxx"
}
```

5. **Re-render** so pages pick up the IDs: run `telos-registry init` again (it overwrites `comments.js` from config, idempotently). Then push.

The discussion threads auto-create on first comment, one per recommendation (term `<project>/<flow>/rec-<N>`). The critique loop reads them back via `gh` GraphQL on the next run — see `telos-critique`.

## Step 7 — Start the hub and hand over the link

Telos pages are **live pages that must be served** — opened as a file (`file://`) the hub can't load its data and shows an empty list. So setup brings the server up for the user and gives them a link; they never open an html file.

Run the hub server in the **background** (so it keeps serving) and capture the URL it prints:

```bash
telos-registry serve --background
```

This prints `http://localhost:8765/` (reusing an already-running server if there is one). Give the user that link and be explicit:

> *"Your hub is running at **http://localhost:8765** — open it in a browser and keep that tab. This is where you view everything (your hub, screens, critiques). Don't open the .html files directly; only this link works. After each Telos command, refresh this tab."*

The hub has **About** and **How It Works** in its top nav, and your projects below.

## Step 8 — Confirm

Tell the user setup is done and what's next:
- Local: "Your hub is live at http://localhost:8765. Run `/telos-napkin` to make your first screen, then refresh the hub to see it. Or just talk to `/telos`."
- Connected: also give them the Pages URL and remind them to enable GitHub Pages on the repo if they haven't. If they connected comments, note that threads appear under each recommendation once published.

## Done

Report: identity, team, sync mode, workspace path, design-system name + token count, comments (on/off), and the next command. Keep it short.
