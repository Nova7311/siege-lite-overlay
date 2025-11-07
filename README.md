# Siege Lite Overlay

A **Rainbow Six Siege** companion app that shows live match stats in an overlay window – without touching game memory or doing anything that violates the game ToS.

The project is split into:

- `backend/` – Node.js service that talks to a public R6 stats API and exposes a simple JSON API.
- `overlay/` – Electron app that:
  - Lets you enter up to 10 player names and teams (Blue / Orange)
  - Fetches their ranked stats from the backend
  - Shows a clean match view with ranks, MMR, K/D, winrates, etc.
  - Displays rank badges + colors
  - Has an always-on-top overlay mode + global hotkey
  - Can capture the screen, run OCR, and auto-fill player slots

---

## Features

### Backend

- `/api/player/:platform/:name`
  - Returns simplified ranked stats for a single player (rank id, MMR, kills, deaths, matches, win%, etc.)
- `/api/match`
  - Accepts up to 10 players in one POST body and returns an array of stats
- Pulls extra info from seasonal stats:
  - Rank name (e.g. `COPPER III`)
  - Rank badge image URL
  - Rank color

### Overlay

- Manual input for up to 10 players, with per-player team selection
- “Match View” that splits info into **Blue Team** and **Orange Team**
- Columns: Name, Rank (with icon), MMR, K/D, Matches, Win %
- “Overlay mode” to hide debug JSON and keep UI compact in-game
- Always-on-top window, suitable for borderless windowed Siege
- Global hotkey (default: **F8**) to quickly show/hide the overlay
- OCR pipeline:
  - Capture full screen from the main process
  - Run Tesseract OCR on the screenshot
  - Show raw OCR text
  - Heuristically extract name-like tokens
  - “Fill player slots from detected names” button to auto-populate the 10 entries

---

## Project structure

```text
backend/
  server.js          # Express app with /api/player and /api/match
  package.json

overlay/
  main.js            # Electron main process (window + hotkey + OCR handler)
  index.html         # UI layout
  renderer.js        # Front-end logic (match view, OCR, auto-fill, API calls)
  package.json
