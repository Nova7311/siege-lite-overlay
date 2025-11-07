# Siege Lite Overlay

A helper app for **Rainbow Six Siege** that shows player stats in a simple overlay while you play.

You type (or OCR-detect) the names from the scoreboard, and the app shows:

- Rank + rank badge icon  
- MMR  
- K/D  
- Number of matches  
- Win percentage  

The app **does not** touch game memory or game files. It only:

1. Captures what’s already on your screen (like a screenshot tool)  
2. Reads text from that image using OCR (Optical Character Recognition)  
3. Uses the visible player names to ask a public stats API for info  
4. Shows the results in its own window

---

## Who this project is for

- Siege players who want quick **lobby scouting** without alt-tabbing to websites every round  
- People who are OK following a step-by-step guide but **don’t know anything about code**  
- Anyone curious how a ToS-friendly stats overlay can be built

If you can follow instructions and copy-paste commands, you can use this.

---

## Project layout

This repository has **two main parts**:

- `backend/` – the **stats server**
  - Node.js + Express
  - Talks to a Rainbow Six stats API (R6Data or similar)
  - Provides simple endpoints:
    - `GET /api/player/:platform/:name` → stats for one player
    - `POST /api/match` → stats for up to 10 players in one call

- `overlay/` – the **desktop overlay app**
  - Built with Electron
  - Lets you:
    - Enter up to 10 players and assign them to Blue / Orange teams
    - Fetch ranked stats from the backend
    - See a “Match View” with:
      - Rank (with badge icon and color)
      - MMR
      - K/D
      - Matches
      - Win %
  - Includes:
    - Always-on-top window
    - “Overlay mode” that hides debug info
    - Global hotkey (F8) to hide/show the overlay quickly
    - Screen capture + OCR that:
      - Takes a screenshot
      - Reads text from it
      - Tries to detect names
      - Can auto-fill the 10 player slots

---

## ToS & safety

This app is designed to stay on the safe side:

- **No memory reading / writing**
- **No DLL injection**
- **No game file edits**
- **No macros or automated inputs**

It only:

- Captures the screen (like OBS, NVIDIA overlay, etc.)
- Translates pixels → text using OCR
- Sends player names to a stats website to get public stats
- Visualizes those stats

You should still double-check the **current** Ubisoft / Siege ToS yourself if you plan to use or share it, but the architecture is intentionally conservative.

---

## Requirements

You’ll need:

- **Windows 10 or 11**
- **Rainbow Six Siege** (preferably in *Borderless Windowed* mode)
- **Node.js** (version 18+ recommended)  
  Download from: https://nodejs.org and run the installer with default options.

You **do not** need to know any programming or install heavy tools just to run this.

---

## Getting the project

### Downloading as ZIP (easiest for non-coders)

1. Open this repository in your browser:  
   https://github.com/Nova7311/siege-lite-overlay
2. Click the green **Code** button → **Download ZIP**.
3. Save the ZIP (for example in `Documents`).
4. Right-click the ZIP → **Extract All…**  
   and extract it to something like:

       C:\Users\<YOUR_WINDOWS_USER>\Documents\siege-lite-overlay

In the rest of this guide, replace `<YOUR_WINDOWS_USER>` with your actual Windows username.

---

## Running the backend (stats server)

You’ll run the backend in one terminal window.

1. Open **Command Prompt** or **PowerShell**.
2. Go to the backend folder:

       cd C:\Users\<YOUR_WINDOWS_USER>\Documents\siege-lite-overlay\backend

3. Install dependencies (first time only):

       npm install

   This downloads the libraries the backend needs.

4. Start the backend:

       npm start

5. Leave this window **open** while you use the app.  
   You should see something like:

       Backend listening on http://localhost:4000

That means the stats server is ready.

---

## Running the overlay app

You’ll run the overlay in a **second** terminal window.

1. Open another **Command Prompt** or **PowerShell** window.
2. Go to the overlay folder:

       cd C:\Users\<YOUR_WINDOWS_USER>\Documents\siege-lite-overlay\overlay

3. Install dependencies (first time only):

       npm install

4. Start the overlay:

       npm start

5. An Electron window called **“Siege Lite Match Overlay”** should appear.

If the window opens and the backend is running, everything is ready.

---

## Basic usage (manual names)

This is the simplest way to test everything (no OCR, just typing):

1. Make sure:
   - Backend window says it’s listening on `http://localhost:4000`
   - Overlay window is open
2. In the overlay:
   - At the top, choose your platform (usually `PC`)
   - Find **Player 1** in the list
   - Type a real Siege username (your own, for example)
   - Set their team to **Blue** or **Orange**
3. Optionally fill more players (Player 2, Player 3, etc.).
4. Click **Fetch Stats**.
5. Under **Match View**, look at the team boxes:
   - You should see a row with:
     - Name
     - Rank (with badge icon)
     - MMR
     - K/D
     - Matches
     - Win %

If that works, the overlay ↔ backend ↔ stats API pipeline is working.

---

## Using it in an actual game (with OCR)

Here’s the full “in-match” workflow using OCR to auto-detect names.

### 1. Set up Siege

1. Launch **Rainbow Six Siege**.
2. In the video settings, set display mode to **Borderless Windowed**.
3. Join a match.
4. Open the **scoreboard** so you can see all players’ names.

### 2. Show the overlay

1. Make sure:
   - Backend is running (`npm start` in `backend/`)
   - Overlay is running (`npm start` in `overlay/`)
2. Press **F8** to toggle the overlay:
   - F8 → overlay appears
   - F8 again → overlay hides

If you don’t see it, press F8 a couple of times.

### 3. Capture & OCR the scoreboard

1. With the scoreboard visible in Siege, press **F8** to show the overlay.
2. In the overlay window, click **Capture & OCR**.
3. The app will:
   - Capture a screenshot of your primary screen
   - Run OCR (text recognition) on it
   - Show progress in the status line
4. After a few seconds you should see:
   - `OCR finished.` in the status text
   - A block of green text under **“OCR Debug (raw text)”**

That text is the app’s best guess of all words on your screen (including player names).

### 4. Auto-fill player slots from OCR

1. Under the OCR debug section, look at **“Detected Names”**.
   - This is a filtered list of words that *look* like usernames  
     (no spaces, letters/numbers/underscore, reasonable length).
2. Click:

   **Fill player slots from detected names**

3. The overlay will:
   - Put those names into the **Player 1–10** input boxes
   - Set players 1–5 to **Blue** and players 6–10 to **Orange** by default

4. Check the filled-in names:
   - OCR is not perfect, so some characters may be wrong
   - Correct any mistakes by typing directly in the Player fields
   - Adjust Blue/Orange dropdowns if needed

### 5. Fetch stats for the lobby

1. Once the names and teams look correct, click **Fetch Stats**.
2. Scroll down to **Match View**:
   - Left box: **Blue Team**
   - Right box: **Orange Team**
3. For each player you’ll see:
   - **Rank** – text + badge icon, colored per rank tier
   - **MMR** – rank points
   - **K/D**
   - **Matches**
   - **Win %**

### 6. Using it while playing

- On a single monitor:
  - Show overlay between rounds with **F8**
  - Hide it with F8 again during the action
- On dual monitors:
  - You can keep the overlay open on the second monitor while you play

---

## Controls summary

- **F8** – Global hotkey to toggle the overlay window (show/hide)
- **Fetch Stats** – Ask the backend for stats and refresh the Match View
- **Capture & OCR** – Capture the screen and try to read names from it
- **Fill player slots from detected names** – Copy detected names into Player 1–10 boxes
- **Overlay mode (hide JSON)** – Hides low-level debug info so the overlay is cleaner

---

## Troubleshooting

### “npm is not recognized as an internal or external command”

Node.js is not installed correctly or the terminal doesn’t see it yet.

- Install Node.js from https://nodejs.org  
- Close **all** Command Prompt / PowerShell windows  
- Open a new one and run:

      node -v
      npm -v

You should see version numbers for both.

### Backend window shows errors when fetching stats

Possible causes:

- No internet connection.
- Player name doesn’t exist, or platform doesn’t match.
- The external stats site is temporarily having issues.

Try:

- Pinging a known name (your own, or a popular player).
- Waiting a bit and trying again.

### Overlay window opens but stats don’t update

Check:

1. Is the backend still running?  
   The first terminal should show something like “listening on http://localhost:4000”.
2. Is the overlay using the right backend URL?  
   In `overlay/renderer.js`, `BACKEND_URL` should be:

       const BACKEND_URL = 'http://localhost:4000';

### OCR seems very messy or misses names

OCR is never perfect. To improve it:

- Trigger **Capture & OCR** when the screen is still (no fast motion).
- Make sure the scoreboard text is clear and readable.
- Use the OCR auto-fill as a starting point, then manually fix any names.

If OCR completely fails, you can always type names manually and still use the overlay.

---

## What’s next for this project (future progress)

Planned / possible improvements:

1. **Better OCR region**
   - Instead of scanning the whole screen, only capture the area where the scoreboard is.
   - This should reduce noise and make detecting names easier.

2. **Smarter team detection**
   - Use the order of names on the scoreboard to automatically assign Blue vs Orange.
   - Try to keep your premade stack grouped correctly.

3. **Presets for common stacks**
   - Save your usual 5-stack as a preset.
   - Load that preset with one click before a game.

4. **Settings panel**
   - Change the global hotkey (F8 → e.g. F9).
   - Adjust overlay transparency.
   - Choose which monitor to capture for OCR.

5. **UI improvements**
   - Compact “minimal mode” that only shows Name + Rank + MMR.
   - Custom themes to match Siege’s look.

6. **Packaging**
   - Build a Windows installer or standalone `.exe` so users don’t have to run `npm install` and `npm start`.

7. **Better rank display**
   - Map numeric ranks to friendly tiers (Copper, Bronze, Silver, Gold, etc.).
   - Show the current season and maybe region.

---

## Quick summary (for non-coders)

1. Install **Node.js**.  
2. Download this repo and extract it.  
3. Run these in two separate terminals:

   **Backend:**

       cd backend
       npm install
       npm start

   **Overlay:**

       cd overlay
       npm install
       npm start

4. In game:
   - Open the scoreboard.
   - Press **F8** to show the overlay.
   - Click **Capture & OCR** → **Fill player slots from detected names** → **Fetch Stats**.
   - Press F8 to hide the overlay while you play.

That’s all you need to use **Siege Lite Overlay** without knowing any code.
