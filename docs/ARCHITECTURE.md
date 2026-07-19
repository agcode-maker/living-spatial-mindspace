# The Archive — Architecture

## Overview

The Archive is a client-rendered 3D application built with React Three
Fiber (a React renderer for Three.js), state-managed by Zustand, and
optionally wrapped in Electron for a native desktop build. There is no
backend server — all logic runs client-side, and persistence is local
(browser storage or a local file, depending on how it's run).

The design goal throughout was that **the AI curator and the spatial
interaction model should reinforce each other**, rather than being two
separate features bolted together: the knowledge graph is the meaningful
spatial system, and the curator is an entity that lives inside that same
graph and actively shapes it.

## System diagram

```
┌───────────────────────────────────────────────────────────────┐
│                      Electron desktop app                     │
│                                                                 │
│   ┌─────────────────────┐        ┌───────────────────────┐   │
│   │   3D world           │        │   AI curator agent     │   │
│   │  (React Three Fiber) │◄──────►│  (src/ai/curatorAgent) │   │
│   └──────────┬───────────┘        └───────────┬───────────┘   │
│              │                                 │               │
│              ▼                                 ▼               │
│   ┌─────────────────────────────────────────────────────┐     │
│   │        Zustand store (src/state/store.js)            │     │
│   │   objects · curatorLog · view/session state           │     │
│   └──────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│   ┌─────────────────────────────────────────────────────┐     │
│   │   Persistence layer (src/state/persistence.js)        │     │
│   │   localStorage (browser)  or  JSON file (Electron)    │     │
│   └─────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼ (curator only)
                  ┌───────────────────┐
                  │   Cloud LLM API    │
                  │   (Gemini)         │
                  └───────────────────┘
```

## Core data model

A single array of **knowledge objects** in the Zustand store is the entire
world state:

```js
{
  id, type,            // 'note' | 'task' | 'idea' | 'image'
  label,
  position: [x, y, z],
  scale, rotationY,     // spatial transform, editable while carried
  color,
  links: [otherId, ...], // undirected adjacency - the knowledge graph
  createdAt, lastTouched // drives the living-memory glow
}
```

Everything the app does — rendering, persistence, the curator's reasoning
— reads and writes this one structure. There's no separate "graph" data
structure; the graph is just the `links` arrays on the objects themselves,
which keeps persistence trivial (it's one JSON blob) and keeps the curator
and the renderer looking at exactly the same source of truth.

## Why Zustand as the single source of truth

Every interactive system in the brief — object manipulation, persistence,
the AI agent, atmosphere — needs to read and sometimes write the same
world state. Rather than threading props through the component tree or
splitting state across contexts, everything funnels through one Zustand
store (`src/state/store.js`). Components subscribe only to the slices they
need (e.g. `KnowledgeObject` reads `targetedId`/`carryingId` but not the
curator's chat state), so updates stay cheap despite the shared store.

Two persistence tiers exist deliberately:
- **Discrete actions** (`updateObject`, `beginOrCompleteLink`, `deleteObject`)
  persist immediately — these are rare, user-intentional edits.
- **Continuous actions** (`moveObjectLive`, `scaleObjectLive`,
  `rotateObjectLive`) do **not** persist on every call — they run every
  animation frame while an object is being carried. Persisting 60 times a
  second would be wasteful and, in the Electron build, would mean 60
  synchronous disk writes per second. Instead, `persist()` is called once
  when the object is dropped.

## Why the interaction model is crosshair + keyboard, not mouse-click

The camera uses `PointerLockControls` for FPS-style look-around, which
captures the mouse for camera rotation — there is no free on-screen cursor
to click precise 3D targets with. Rather than fight that, `Interactions.jsx`
raycasts once per frame from the exact center of the screen (the crosshair)
to determine what's being looked at (`targetedId`), and all manipulation
happens via keyboard (`E` to carry, `L` to link, scroll/`Z`/`X` to
transform). This keeps every interaction spatial — you interact with what
you're looking at, not what you happen to click — which was a deliberate
fit for the brief's "interactions should happen naturally inside the 3D
world rather than through standard UI panels."

## The AI curator

`src/ai/curatorAgent.js` isolates every LLM-provider-specific detail behind
three functions (`summarizeSessionStart`, `suggestClusters`, `askCurator`),
each of which builds a prompt from the *live* object list (and, for session
start and chat, the persisted `curatorLog`) and returns plain text or
structured JSON. Swapping providers is a one-line change in the internal
`callLLM()` function; nothing else in the app knows which provider is in
use.

The curator is deliberately **not** a chat sidebar. `CuratorEntity.jsx` is a
physical light entity rendered inside the 3D scene whose movement is
state-driven rather than freely wandering:

1. While waiting on an API response, it holds still ("thinking").
2. While it has a pending cluster suggestion, it hovers directly between
   the two objects it's proposing to connect.
3. While the user is carrying an object, it stays near that object.
4. Otherwise it drifts toward whatever the user is currently looking at.
5. Only with no other signal does it idly drift among existing objects.

This priority chain is what makes its motion read as attentive rather than
decorative — a judge watching the demo can see *why* it's moving, without
narration.

Required agentic behaviors this satisfies: contextual memory across
sessions (curator log persisted, referenced in the session-start greeting),
proactive assistance (`G` unprompted-feeling suggestion flow), semantic
understanding (clustering reasoning is grounded in actual object labels,
not random pairing), and natural-language interaction (`T` chat, grounded
in real workspace state).

## Persistence abstraction

`src/state/persistence.js` exposes `loadWorld()`/`saveWorld()` with no
knowledge of *where* data actually goes. At runtime it checks for
`window.archiveAPI` (only present in the Electron build, injected by
`electron/preload.cjs` via `contextBridge`) and uses that; otherwise it
falls back to `localStorage`. The rest of the app — the store, every
component — calls the same two functions regardless of which environment
it's running in. `electron/main.cjs` backs the Electron path with a real
JSON file in the OS-appropriate user data directory, so the desktop build's
save survives even a full app reinstall.

## Atmosphere & living memory

Two systems make the environment feel reactive rather than static, both
computed live from the same object data rather than being separately
tracked state:

- **Living memory** (`KnowledgeObject.jsx`): each object's emissive glow is
  a function of how recently it was touched (`lastTouched`) and how many
  links it has. No separate "decay" system runs in the background — it's
  recomputed from timestamps every frame.
- **Atmosphere** (`AtmosphereController.jsx`): ambient light intensity,
  point light color/intensity, and fog distance all lerp toward targets
  computed from a single "organization" score (total links relative to
  object count) each frame.

## Known trade-offs

- Constellation view uses a second, independent camera + `OrbitControls`
  rather than repurposing the FPS camera, specifically to avoid conflicts
  with `PointerLockControls` state. This was simpler and more robust than
  trying to make one camera serve both interaction modes.
- The curator's clustering pass is triggered on demand (`G`) rather than
  running continuously in the background, to keep API usage predictable
  and avoid surprising the user with objects re-linking themselves
  unprompted.
