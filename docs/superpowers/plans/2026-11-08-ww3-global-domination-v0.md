# WW3: Global Domination v0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a quick, playable static browser prototype (GitHub Pages-ready) of *WW3: Global Domination*: turn-based, single-player vs simple AI, simplified regions, resources, recruit/move/attack, win/lose.

**Architecture:** Plain HTML/CSS/JS loaded by `index.html` (no build step). Game rules/state live in small JS modules/files exposed as globals or simple namespaces for zero-config static hosting; `ui.js` renders state and dispatches actions to `game.js`. Map is a fixed adjacency graph in `map.js`.

**Tech Stack:** HTML5, CSS, vanilla JavaScript (ES5/ES6 compatible for broad browsers), Git; optional Node for quick logic sanity checks if available.

**Spec:** `docs/superpowers/specs/2026-11-08-ww3-global-domination-v0-design.md`

## Global Constraints
- Static GitHub Pages-ready: `index.html` at repo root; no server/build required to play.
- v0 only: single-player vs simple AI, turn-based, ~20–24 regions, 3 resources (`money`, `manpower`, `industry`), 2 unit types (`infantry`, `armor`), adjacent move/attack, domination/elimination win/lose.
- No CoN-accurate map/balance, no multiplayer/accounts/persistence, no full diplomacy/research.
- Keep implementation simple and playable; builder may choose balance numbers if core loop works.

## Review Focus
- **Invalid moves/actions:** moving/attacking non-adjacent or enemy-owned-from-invalid states, recruiting without resources/ownership — must be rejected or ignored with clear UI/log feedback, never corrupt state.
- **Combat/state integrity:** region ownership, unit counts, and resources never become negative/NaN; capture happens only when defender eliminated per rules.
- **AI/player turn boundaries:** AI must not act during player input handling except on End Turn; End Turn applies income/resolution exactly once per turn.
- **Win/lose detection:** domination/elimination checked after relevant actions; game stops accepting moves and shows result.
- **Static hosting:** `index.html` works when opened locally and on GitHub Pages (correct relative paths, no module/CORS assumptions that break file:// if avoidable; prefer classic scripts).

---
### Task 1: Scaffold, Git remote readiness, and loadable shell

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `js/map.js`
- Create: `js/game.js`
- Create: `js/ai.js`
- Create: `js/ui.js`
- Create: `README.md`

**Interfaces:**
- Consumes: approved spec; existing git repo with `origin` set.
- Produces: loadable page showing title "WW3: Global Domination" and placeholder panels; README with local/GitHub Pages run instructions; initial commit.

- [ ] **Step 1: Create `index.html` shell**
  Include `<link rel="stylesheet" href="style.css">`, containers for header/resources, map, sidebar (selected region/actions), log; script tags in order: `js/map.js`, `js/game.js`, `js/ai.js`, `js/ui.js`; `ui.init()` on load.

- [ ] **Step 2: Create `style.css` with readable layout**
  Basic responsive-ish layout (header, main grid: map + sidebar, log). Visible region buttons/tiles, owner colors, selected state.

- [ ] **Step 3: Create JS stubs with namespaces**
  `window.WW3Map`, `window.WW3Game`, `window.WW3AI`, `window.WW3UI` objects; `WW3UI.init()` renders "Ready" placeholder without errors.

- [ ] **Step 4: Create `README.md`**
  Name, quick prototype note, how to run locally (open `index.html` or `python -m http.server`), GitHub Pages note, controls summary (to be updated).

- [ ] **Step 5: Verify load**
  Run: open `index.html` in browser (or `Start-Process index.html` on Windows) and confirm no console errors; page shows title and placeholders. If Node available, optional: `node --check js/game.js` (and others).

- [ ] **Step 6: Commit**
  ```bash
  git add index.html style.css js README.md docs
  git commit -m "chore: scaffold WW3 Global Domination v0 prototype"
  ```

### Task 2: Map data and adjacency

**Files:**
- Modify: `js/map.js`
- (Optional) Create: `scripts/check-map.js` (Node sanity check, not required for Pages)

**Interfaces:**
- Consumes: none.
- Produces: `WW3Map.regions` array/object of regions `{id,name,adj:[ids],income:{money,manpower,industry},defense?}` (>=20 regions, connected graph); helpers `WW3Map.get(id)`, `WW3Map.areAdjacent(a,b)`, `WW3Map.regionIds()`.

- [ ] **Step 1: Define simplified region graph**
  Include regions covering major areas (e.g., North America, Central America, South America, Western Europe, Eastern Europe, Russia West/Siberia, Middle East, North Africa, West Africa, East Africa, Southern Africa, Central Asia, South Asia, East Asia, Southeast Asia, Oceania, Arctic/placeholder optional) — total >=20, each with >=1 adjacency, graph connected enough for gameplay.

- [ ] **Step 2: Implement helpers**
  `get` returns region or null; `areAdjacent` true only if listed; `regionIds` returns all ids.

- [ ] **Step 3: Verify**
  Run Node check if available: script asserts every adjacency is reciprocal or intentionally handled, all ids resolve, region count >=20. Otherwise manually inspect in console: `WW3Map.regionIds().length`, adjacency samples.

- [ ] **Step 4: Commit**
  ```bash
  git add js/map.js scripts/check-map.js
  git commit -m "feat: add simplified world region map graph"
  ```

### Task 3: Game state, setup, income, and recruitment

**Files:**
- Modify: `js/game.js`

**Interfaces:**
- Consumes: `WW3Map`.
- Produces: `WW3Game.state` shape `{turn, playerNationId, nations:{id:{resources,alive}}, owners:{regionId:nationId}, units:{regionId:{infantry,armor}}, log:[], winner}`; functions `newGame(playerRegionId?)`, `getIncome(nationId)`, `endTurn()`, `canRecruit(regionId,type)`, `recruit(regionId,type)`, `getVisibleState()`.

- [ ] **Step 1: Implement setup**
  Assign each region an initial owner (one per "nation"/region owner id; player picks or defaults). Seed starting resources and small starting units (e.g., 2 infantry in capital/home region). `winner=null`, `turn=1`.

- [ ] **Step 2: Implement income and `endTurn()`**
  `getIncome` sums `region.income` for owned regions. `endTurn()` (player-initiated): apply player income once, mark/log; call `WW3AI.takeTurn(state)`; apply AI incomes via controlled path; increment turn; check win/lose. Ensure no double income.

- [ ] **Step 3: Implement recruitment**
  Costs (builder-chosen constants, e.g. Infantry: money 20/manpower 10; Armor: money 60/manpower 20/industry 20). `canRecruit`: player alive, owns region, affordable, `winner` null. `recruit` deducts and adds unit; logs.

- [ ] **Step 4: Verify**
  In browser console or Node harness: new game gives positive starting state; recruit deducts correctly; cannot recruit in unowned region or with insufficient resources; end turn increments turn and changes resources.

- [ ] **Step 5: Commit**
  ```bash
  git add js/game.js
  git commit -m "feat: add game state resources and recruitment"
  ```

### Task 4: Movement and combat

**Files:**
- Modify: `js/game.js`

**Interfaces:**
- Consumes: `WW3Map`, state from Task 3.
- Produces: `canMove(from,to,unitType,count)`, `moveOrAttack(from,to,unitType,count)`; updates owners/units/log; triggers capture/win checks.

- [ ] **Step 1: Implement validation**
  Require adjacency, source owned by player, sufficient units, count>=1, `winner` null. Moving into owned region merges units. Attacking moves survivors per rules.

- [ ] **Step 2: Implement combat resolver**
  Simple strength (Infantry 1, Armor 3) × count ± small random factor (bounded). Apply losses to both sides proportionally/simply; if defender reaches 0, transfer ownership to attacker and move surviving attackers (or defined subset). Never negative units.

- [ ] **Step 3: Implement win/lose check**
  `checkWinner()`: if player owns 0 regions -> AI/winner defeat; if player owns >= domination threshold (e.g. 70% of regions) -> player wins. Set `state.winner`.

- [ ] **Step 4: Verify**
  Console tests: cannot move non-adjacent; attack can capture empty/weak region; invalid actions leave state unchanged; winner set on elimination.

- [ ] **Step 5: Commit**
  ```bash
  git add js/game.js
  git commit -m "feat: add movement combat and victory conditions"
  ```

### Task 5: Simple AI

**Files:**
- Modify: `js/ai.js`

**Interfaces:**
- Consumes: `WW3Game.state`, `WW3Map`, game helpers (`getIncome` logic via state rules) — AI may use internal helpers or `WW3Game` exposes safe methods; builder chooses clean minimal interface.
- Produces: `WW3AI.takeTurn(state)` mutates state for all non-player alive nations in a bounded, simple way (recruit if affordable, attempt limited attacks/moves toward player or weakest adjacent).

- [ ] **Step 1: Implement AI economy/recruit**
  For each AI nation, compute income, add resources, recruit in a random/strong owned region when affordable.

- [ ] **Step 2: Implement AI attacks/moves**
  For each AI nation, attempt a small number of actions: attack adjacent weaker/undefended regions, prefer player/vulnerable targets; avoid invalid moves.

- [ ] **Step 3: Verify**
  After several `endTurn()` calls, AI resources/units/ownership change legally; no negative values; game eventually reaches win/lose in normal play or remains stable.

- [ ] **Step 4: Commit**
  ```bash
  git add js/ai.js
  git commit -m "feat: add simple AI opponent turns"
  ```

### Task 6: UI — render, selection, actions

**Files:**
- Modify: `js/ui.js`
- Modify: `style.css`
- Modify: `index.html` (only if container ids/classes needed)

**Interfaces:**
- Consumes: `WW3Map`, `WW3Game`, `WW3AI`.
- Produces: interactive UI: renders map regions colored by owner, selected region details, resource/turn/winner display, log; buttons `New Game`, `End Turn`, `Recruit Infantry`, `Recruit Armor`, move/attack controls for adjacent targets.

- [ ] **Step 1: Render map and HUD**
  Draw all regions as clickable elements (grid/schematic). Show turn, player resources, winner banner when set.

- [ ] **Step 2: Selection and actions**
  Click region selects it and shows owner/units; recruit buttons call `WW3Game.recruit` for selected owned region; adjacent target selector/buttons call `moveOrAttack`; disable/feedback when invalid or game over.

- [ ] **Step 3: Log and new game**
  Append key events (recruit, move, combat, capture, turn, win/lose). `New Game` resets via `WW3Game.newGame()`.

- [ ] **Step 4: Verify**
  Manual playtest: load page, start game, recruit, end turn (AI acts), attack adjacent region, observe capture/win or defeat path. Confirm no console errors on normal actions.

- [ ] **Step 5: Commit**
  ```bash
  git add js/ui.js style.css index.html
  git commit -m "feat: add playable UI for map actions and turns"
  ```

### Task 7: Polish, README, and delivery

**Files:**
- Modify: `README.md`
- Modify: any `js/*`, `style.css` for bugs found in playtest

**Interfaces:**
- Consumes: working v0.
- Produces: updated README (controls, rules summary, GitHub Pages deploy steps), stable quick playtest; commits. Attempt push to `origin` only if user approved/possible.

- [ ] **Step 1: Playtest and fix critical bugs**
  Run through: new game, recruit, several turns, combat/capture, win/lose. Fix state corruption/NaN/invalid-action crashes.

- [ ] **Step 2: Update README**
  Document controls, v0 rules, local run, and GitHub Pages (Settings > Pages > branch/root).

- [ ] **Step 3: Final commit**
  ```bash
  git add -A
  git commit -m "docs: finalize v0 README and prototype polish" || echo "nothing to commit"
  ```

- [ ] **Step 4: Push (if authenticated)**
  Run: `git push -u origin master` (or detect default branch; if fails, try `main`). If authentication/push fails, report exact command for the user to run locally.
