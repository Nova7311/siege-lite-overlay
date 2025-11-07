# Siege Lite Overlay

A small helper app for **Rainbow Six Siege** that shows player stats in a simple overlay while you play.

You type (or OCR-detect) the names from the scoreboard, and the app shows:

- Rank + rank badge icon  
- MMR  
- K/D  
- Number of matches  
- Win percentage  

It does **not** touch game memory or files. It just:

- Looks at what’s already on your screen  
- Uses player names to ask a stats website for public information  
- Shows the result in its own window

---

## Who this project is for

- Siege players who want quick **lobby scouting** without alt-tabbing to a website 10 times  
- People who are OK following a step-by-step guide but **don’t know how to code**  
- Anyone curious how a ToS-friendly “stats overlay” can be built

If you can copy-paste commands and click a few buttons, you can run this.

---

## What the project contains

This repository has **two parts**:

- `backend/` – a small **stats server**
  - Talks to a Rainbow Six stats API
  - Has endpoints like:
    - `/api/player/:platform/:name`
    - `/api/match` (up to 10 players at once)
- `overlay/` – the **overlay app**
  - A desktop window built with Electron
  - Lets you enter up to 10 players and their team (Blue / Orange)
  - Calls the backend and shows stats in a nice “Match View”
  - Has:
    - Rank icons + colored rank names
    - Always-on-top mode
    - A global hotkey (F8) to hide/show the overlay
    - Screen capture + OCR (reads names from the scoreboard)  
      and a button to auto-fill the 10 player boxes

---

## Is this ToS-safe?

This app:

- **Does not** read or write game memory  
- **Does not** inject into the game  
- **Does not** send inputs or macros to Siege  

It only:

1. Captures screenshots (like OBS or any screen recorder)  
2. Reads text from the screenshot using OCR  
3. Sends those names to a stats service and shows the results

You should still always check the **current** Ubisoft/RS6 ToS yourself,
but the design is intentionally conservative and non-intrusive.

---

## Requirements

You’ll need:

- **Windows 10/11**  
- **Rainbow Six Siege** (preferably in *Borderless Windowed* mode)  
- **Node.js** (LTS version – 18 or newer is fine)  
  - Download from: <https://nodejs.org>  
  - When installing, keep the default options and click “Next” a few times.

That’s it. You don’t need Visual Studio or any IDE to just run it.

---

## How to get the project

You can use either **Download ZIP** (easiest) or `git clone`.

### Option A – Download ZIP (non-coder friendly)

1. Open this repo in your browser:  
   `https://github.com/Nova7311/siege-lite-overlay`
2. Click the green **Code** button → **Download ZIP**.
3. Save the ZIP somewhere (e.g. `Documents`).
4. Right-click the ZIP → **Extract All…**  
   and extract it to something like:

   ```text
   C:\Users\<YOU>\Documents\siege-lite-overlay
