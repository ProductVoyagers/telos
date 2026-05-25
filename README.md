# Telos

**The PM toolkit where every screen is tied to a business goal.**

Design tools think in pixels. Analytics tools think in numbers. Nobody checks whether a design actually serves the goal *before* you ship it. That's Telos.

Telos is a Claude Code plugin. You sketch screens, critique whole flows against your KRs (not generic UX heuristics), and — when you're ready — share a living design hub with your squad where every screen is annotated against the goal it's supposed to move.

## Install

```
/plugin marketplace add ProductVoyagers/telos
/plugin install telos
```

Then just talk to it:

```
/telos
```

Or jump straight to a command if you know what you want:

| Command | What it does |
|---|---|
| `/telos` | Talk to Telos. It figures out what you need and drives the rest. |
| `/telos-setup` | One-time setup: learn your product's design system from screenshots, and (optionally) connect a GitHub repo. |
| `/telos-napkin` | Turn a wireframe or Figma frame into a styled mockup in your design system. |
| `/telos-review` | Critique a flow against one or more KRs. |
| `/telos-apply` | Accept critique recommendations and regenerate the affected screens. |
| `/telos-eval` | Score a critique's quality across six dimensions. |

## How it grows with you

1. **Solo, local.** Works the moment you install it. No GitHub, no setup ceremony. Everything lives on your machine.
2. **Solo, connected.** Point Telos at your own GitHub repo whenever you decide. Your flows render as a shareable web hub.
3. **Squad.** Point a whole team at one repo. Versioned screens + threaded comments + a shared, goal-annotated hub. Telos becomes your Figma — but for goals, not just pixels.

## Privacy

Telos runs locally in your Claude Code. Your screens and KRs never leave your machine unless *you* connect a repo and push them there.

---

Built by [ProductVoyagers](https://github.com/ProductVoyagers).
