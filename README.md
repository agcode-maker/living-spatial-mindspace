# The Archive

A living spatial mindspace — a persistent 3D workspace where notes, tasks, ideas,
and images exist as physical objects you place, link, and organize by walking
through the space, with an AI curator that helps organize it semantically.

Built with React Three Fiber (Three.js) so it runs entirely in the browser /
Electron on modest hardware — no dedicated GPU required.

## Status: Day 1 scaffold

Working:
- Free-fly WASD movement with pointer-lock look
- Floor grid, fog, lighting
- Spawn knowledge objects (note/task/idea/image) with number keys 1-4
- Select objects, link two objects with shift+click
- World state persists across refresh (localStorage; becomes a real file
  once wrapped in Electron — see `src/state/persistence.js`)
- Main menu with Enter / Continue / Reset

Not yet built (see roadmap below): drag-to-move objects, editing note text,
raycast-based placement in front of the camera, the AI curator's in-world
presence and behaviors, ambient sound/atmosphere reactions, Electron
packaging.

## Setup

```bash
npm install
npm run dev
```

Open the printed localhost URL. Click into the window to lock the pointer
and look around; WASD to move, space/shift for up/down.

## Running as a desktop app (Electron)

```bash
npm run electron:dev
```

This launches Vite's dev server and an Electron window pointed at it, so you
get the same fast reload loop as the browser. In this mode, world saves go
to a real JSON file (via `electron/main.cjs` + `preload.cjs`) instead of
localStorage — same persistence layer, no code changes needed elsewhere.

## Building the submission executable

```bash
npm run electron:build
```

Produces a Windows installer/executable in `release/`. This is the
"Executable Build" deliverable for submission.

## AI curator setup (optional for now)

Copy `.env.example` to `.env` and add your key:

```bash
cp .env.example .env
```

Get a free Gemini key at https://aistudio.google.com → "Get API key". The
curator degrades gracefully to a stub message if no key is set, so you can
develop everything else without it.

## Roadmap

- **Day 2** — object drag/move/rotate, camera-facing spawn placement, note
  text editing, delete, richer object visuals per type
- **Day 3** — AI curator entity (floating light that moves through the
  space), session-start summary, semantic cluster suggestions, natural
  language commands
- **Day 4** — atmosphere reacting to organization state, ambient sound,
  main menu polish, performance pass
- **Day 5** — Electron packaging (`electron/main.cjs` + `preload.cjs` to
  replace localStorage with a real save file), demo video, architecture doc

## Architecture

See the project's architecture doc (added Day 5) for the full breakdown.
Short version: React Three Fiber renders the world and owns all interaction;
Zustand (`src/state/store.js`) holds world state and is the single source of
truth; `src/state/persistence.js` abstracts save/load so it works identically
in the browser (localStorage) and in Electron (real JSON file) without the
rest of the app knowing the difference; `src/ai/curatorAgent.js` is a thin,
swappable wrapper around whichever LLM API you use.
