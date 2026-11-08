# WW3: Global Domination v0 (Quick Prototype) — Design

**Status:** Approved by user in chat (2026-11-08).  
**Repo target:** https://github.com/nicojano200-stack/ww3-global-domination (local Git initialized; user to push with their credentials).

## Intent
A quick, playable browser prototype inspired by Conflict of Nations, named **WW3: Global Domination**. It should capture the *feel* of controlling a nation in a modern global conflict: own regions, gain resources, build/recruit, move/attack, and win by domination/VP — without CoN’s MMO/server complexity.

## Goals
- Playable in a modern browser via static files (GitHub Pages-ready).
- Single-player: human controls one nation vs simple AI opponents.
- Core loop works: select nation → end turn/tick progression → resources accrue → build/recruit → move/attack adjacent regions → capture → win/lose.
- Clear UI (map/regions, selected region, resources, actions, log).

## Non-goals / Anti-goals (v0)
- No real-time multiplayer, servers, accounts, persistence beyond in-memory session.
- No CoN-accurate map, balance, research tree, diplomacy system, or full unit catalog.
- No external build tooling required to play (plain HTML/CSS/JS).
- Not a clone; inspired mechanics only.

## Constraints
- Static hosting (GitHub Pages). Entry: `index.html` at repo root.
- Plain JavaScript (ES modules optional; prefer simple script loading for zero-config Pages).
- Must run by opening `index.html` or via a simple static server.

## Approaches considered
1. **Static HTML/CSS/JS, turn-based, simplified region graph (chosen).** Fastest to build/deliver, deterministic, easy to host on GitHub Pages, no backend. Trade-off: less “live” than real-time ticks.
2. **Static JS with real-time ticks/animation loop.** Closer to CoN pacing but adds timing/state complexity and balance tuning. Rejected for “quick prototype first”.
3. **Framework/build stack (React/Vite) or Godot export.** More structure/power but adds setup and deployment steps. Rejected for speed and GitHub Pages simplicity.

## Key product decisions (v0, builder’s calls where noted)
- **Turn-based:** player acts, ends turn; each AI takes a simple turn; resources applied per turn. (Builder call for speed/determinism.)
- **Map:** ~20–24 named regions forming an adjacency graph (simplified world). Each region has terrain/resource value and owner.
- **Resources:** `Money`, `Manpower`, `Industry` (numbers); income from owned regions.
- **Units:** `Infantry` (cheap), `Armor` (stronger, costs more). Units occupy regions; movement to adjacent owned/enemy regions.
- **Combat:** simple deterministic-ish resolver (strength comparison + bounded randomness) with losses; attacker captures if defender eliminated.
- **Production:** spend resources in owned regions/capital to recruit units (takes effect immediately or next turn — builder chooses simplest consistent rule; document in UI).
- **Win/lose:** domination (control X% regions) or elimination of player; AI wins if player eliminated. VP display optional.

## UX (text sketch)
```
+----------------------------------------------------------+
| WW3: Global Domination        Money M  Manpower P  Ind I |
| [End Turn] [New Game]  Turn N   Status/Log               |
+---------------------------+------------------------------+
| Map (clickable regions)   | Selected: RegionName         |
|  [NA][SA][EU][AF][ME]...  | Owner: X  Units: Inf 3 Arm 1 |
|  colors = owner           | [Recruit Inf] [Recruit Arm]  |
|                           | [Move/Attack to...] (adjacent)|
+---------------------------+------------------------------+
| Log: AI attacked... You captured...                       |
+----------------------------------------------------------+
```
(Visual look is builder’s call; clarity over polish.)

## Out of scope details left to builder
Exact region list/names, balance numbers, combat formula details, AI heuristics, and styling — provided they preserve the approved core loop and remain simple/playable.
