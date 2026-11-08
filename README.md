# WW3: Global Domination (v0 prototype)

A quick, playable browser prototype inspired by grand-strategy conflict games. **v1** is single-player, turn-based, with a **real-world country border map** (simplified Natural Earth data), real-country selection (incl. **Antarctica** as unclaimed/oil-rich), basic resources, recruitment, movement/combat, and simple AI. Adjacencies/combat remain simplified for prototype gameplay.

> Prototype only — not affiliated with or a clone of Conflict of Nations.

## Run locally

- Open `index.html` in a modern browser, **or**
- Serve the folder with any static server (recommended), e.g.:
  - `python -m http.server 8080` then open `http://localhost:8080/`

## GitHub Pages

1. Push this repository to GitHub (`nicojano200-stack/ww3-global-domination`).
2. In GitHub: **Settings → Pages → Build and deployment**: source = *Deploy from a branch*, branch = `main` (or `master`) / root.
3. Open the published Pages URL.

## How to play (v1)

1. **New Game** starts a match (you control one nation).
2. Click a region to select it. Owned regions show your units/resources context.
3. **Recruit Infantry/Armor** in regions you own (if you can afford them).
4. Select an adjacent target to **Move** (to your region) or **Attack** (enemy region).
5. **End Turn**: you gain income, AI takes its turns.
6. **Win** by dominating most regions; **lose** if eliminated.

## Status

Playable **v0 prototype** implemented (simplified map, turn-based play, resources, recruit/move/attack, simple AI, win/lose). See `docs/superpowers/plans/2026-11-08-ww3-global-domination-v0.md`.
