# The Archive

**A living spatial mindspace** — a persistent 3D workspace where notes,
tasks, ideas, and images exist as physical objects you place, carry, link,
and organize by walking through the space, with an AI curator that lives
inside the world and actively helps organize it.

Built with React Three Fiber (Three.js) so it runs entirely on modest
hardware — no dedicated GPU required, no heavy game-engine install.

![Knowledge objects in the space, connected by threads](docs/screenshots/knowledge-objects.png)

## Table of contents

- [What this is](#what-this-is)
- [Features](#features)
- [Controls](#controls)
- [Setup — running in the browser](#setup--running-in-the-browser)
- [Setup — running as a desktop app (Electron)](#setup--running-as-a-desktop-app-electron)
- [Building the submission executable](#building-the-submission-executable)
- [AI curator setup](#ai-curator-setup)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Known limitations](#known-limitations)

## What this is

Most digital workspaces are flat — folders, tabs, lists. The Archive puts
your notes, tasks, ideas, and files inside an actual 3D space you walk
through, carry things around in, and physically connect to each other. The
space remembers exactly how you left it, and an AI curator embedded in the
world (not a chat sidebar bolted on the side) helps you notice connections
you might not have drawn yourself.

## Features

**Navigate & explore**
Free-flying WASD movement with mouse-look (pointer-lock, FPS-style). A
crosshair reticle targets whatever you're looking at — no mouse-click
menus.

**Create & manipulate objects spatially**
- `1`–`4` spawn a note / task / idea / image in front of you
- `E` picks up whatever's under your crosshair and carries it with you;
  `E` again drops it
- Scroll wheel scales a carried object; `Z`/`X` rotate it
- `L` links two objects into a visible knowledge-graph thread
- `R` renames via an in-world panel; `Backspace` deletes

**Persistent world state**
Every change is saved automatically. In the browser this uses
`localStorage`; the Electron build backs it with a real JSON file on disk,
so your space survives a full reinstall or move to another machine.

**Object-based knowledge graph + constellation view**
Linked objects form a visible 3D graph you build by hand. Press `C` to pull
back into a free-orbiting bird's-eye view of the whole graph at once.

![Bird's-eye constellation view of the knowledge graph](docs/screenshots/constellation-view.png)

**AI Curator (agentic AI, embedded in the world)**
A small light entity that physically inhabits the space rather than a
chatbot panel:
- Greets you at the start of each session referencing your *actual*
  objects and what it noticed last time (contextual memory across
  sessions, persisted in the save file)
- `G` asks it to scan the space and propose semantic connections — shown
  as dashed preview links you accept (`Y`) or dismiss (`N`) before they
  become permanent
- `T` opens a natural-language chat with it — it answers grounded in your
  real workspace, not generically
- Its movement is context-driven: it holds still while "thinking," hovers
  over the pair of objects it's proposing to link, follows whatever you're
  carrying, and drifts toward whatever you're currently looking at — never
  an independent random wander

**Living memory & reactive atmosphere**
Objects glow brighter the more recently you've touched them and the more
richly they're connected; forgotten ones slowly dim. Ambient lighting and
fog shift warmer and clearer as the space becomes more organized, cooler
and foggier when it's cluttered and disconnected — the environment itself
reflects how you've been using it.

**Onboarding & help**
First-time entry shows a control summary; `H` reopens it anytime.

## Controls

| Key | Action |
|---|---|
| `W A S D` | Move |
| `Space` / `Shift` | Up / down |
| Mouse | Look around (click to lock pointer) |
| `1` `2` `3` `4` | Spawn note / task / idea / image |
| `E` | Pick up / drop the targeted object |
| Scroll (while carrying) | Scale the object |
| `Z` / `X` (while carrying) | Rotate the object |
| `L` | Start / complete a link between two objects |
| `R` | Rename the targeted/carried object |
| `Backspace` | Delete the targeted/carried object |
| `G` | Ask the curator to propose connections |
| `Y` / `N` | Accept / dismiss the curator's suggestions |
| `T` | Talk to the curator |
| `C` | Toggle constellation (bird's-eye) view |
| `H` | Reopen the controls help panel |
| `Esc` | Cancel current action / return to menu |

## Setup — running in the browser

Requires [Node.js](https://nodejs.org) (LTS).

```bash
npm install
npm run dev
```

Open the printed `localhost` URL, click "Enter," then click into the canvas
to lock the pointer.

## Setup — running as a desktop app (Electron)

```bash
npm run electron:dev
```

Launches Vite's dev server and an Electron window pointed at it — same fast
reload loop as the browser, but world saves go to a real file on disk
instead of `localStorage`.

## Building the submission executable

```bash
npm run electron:build
```

Produces both a portable standalone executable and an NSIS installer in
`release/`:

- **`The Archive <version>.exe`** — portable, no installation required.
  This is the intended "Executable Build" deliverable.
- **`The Archive Setup <version>.exe`** — installer, optional.

> Windows SmartScreen will flag the executable as unrecognized ("Windows
> protected your PC") since it isn't code-signed — this is expected for any
> unsigned indie/student build, not a bug. Click "More info" → "Run
> anyway."

> **Windows-specific build note:** `electron-builder` downloads a code-signing
> helper package on first run that requires symlink privileges Windows
> restricts by default. If the build fails with a `Cannot create symbolic
> link` error, either enable **Developer Mode** (Settings → Privacy &
> security → For developers) or run the build command from an
> Administrator terminal, then retry.

## AI curator setup

Copy the environment template and add your key:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_LLM_PROVIDER=gemini
VITE_LLM_API_KEY=your_key_here
```

Get a free key at [aistudio.google.com](https://aistudio.google.com) → "Get
API key." Restart the dev server after editing `.env` — environment
variables are only read at startup. Without a key, the curator degrades
gracefully to generic stub messages rather than breaking.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full technical
write-up (system diagram, data flow, and design rationale). Short version:

- **React Three Fiber** renders the 3D world and owns all spatial
  interaction (movement, crosshair targeting, carrying, linking).
- **Zustand** (`src/state/store.js`) holds all world state — objects,
  curator memory, view mode — as the single source of truth every
  component reads and writes through.
- **`src/state/persistence.js`** abstracts save/load so the exact same app
  code works identically against `localStorage` in the browser and a real
  JSON file in Electron — nothing else in the app needs to know which one
  it's talking to.
- **`src/ai/curatorAgent.js`** is a thin, swappable wrapper around the LLM
  API — every provider-specific detail lives in one function, so switching
  providers is a one-line change.
- **`electron/`** contains the desktop shell — `main.cjs` (window +
  file-backed persistence via IPC) and `preload.cjs` (safely exposes that
  to the renderer via `contextBridge`).

## Project structure

```
the-archive/
├── electron/              # Desktop shell (main process + preload)
├── docs/
│   ├── ARCHITECTURE.md    # Full technical write-up
│   └── screenshots/
├── src/
│   ├── ai/                # AI curator - LLM interface & prompts
│   ├── scene/              # 3D world - movement, objects, curator entity,
│   │                        atmosphere, links, interactions
│   ├── state/              # Zustand store + persistence abstraction
│   ├── ui/                 # Screen-space overlays (menu, HUD, panels)
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── vite.config.js
```

## Known limitations

- Object geometry is simple primitives per type rather than rich per-object
  visuals (e.g. notes don't render their actual text on their face).
- The curator's clustering suggestions are single-shot per `G` press rather
  than continuously running in the background.
- Tested primarily on Windows with integrated graphics; other platforms
  should work (Electron/Three.js are cross-platform) but are untested.
