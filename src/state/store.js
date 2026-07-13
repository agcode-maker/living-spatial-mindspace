import { create } from 'zustand';
import { loadWorld, saveWorld } from './persistence.js';

// A knowledge object shape:
// { id, type: 'note'|'task'|'idea'|'image', label, position: [x,y,z], color, links: [id, ...] }

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

const saved = loadWorld();

export const useWorld = create((set, get) => ({
  // 'menu' | 'exploring'
  sessionState: 'menu',
  objects: saved?.objects ?? [],

  targetedId: null, // whatever the crosshair is currently over
  carryingId: null, // object currently being carried in front of the camera
  linkFrom: null, // id of object waiting to be connected to a second one
  editingId: null, // object currently open in the rename panel
  viewMode: 'first-person', // 'first-person' | 'constellation'

  enterWorld: () => set({ sessionState: 'exploring', targetedId: null, carryingId: null, linkFrom: null, editingId: null, viewMode: 'first-person' }),
  returnToMenu: () => {
    get().persist();
    set({ sessionState: 'menu', targetedId: null, carryingId: null, linkFrom: null, editingId: null, viewMode: 'first-person' });
  },

  openEditor: (id) => set({ editingId: id }),
  closeEditor: () => set({ editingId: null }),

  toggleViewMode: () =>
    set((s) => ({ viewMode: s.viewMode === 'first-person' ? 'constellation' : 'first-person' })),

  addObject: (type, position) => {
    const obj = {
      id: makeId(),
      type,
      label: type === 'note' ? 'New note' : type[0].toUpperCase() + type.slice(1),
      position,
      color: colorFor(type),
      links: [],
      createdAt: Date.now(),
    };
    set((s) => ({ objects: [...s.objects, obj] }));
    get().persist();
    return obj.id;
  },

  // Persists immediately - use for discrete edits (rename, link, etc).
  updateObject: (id, patch) => {
    set((s) => ({
      objects: s.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));
    get().persist();
  },

  // Does NOT persist - used every frame while an object is being carried,
  // so we're not writing to disk/localStorage 60 times a second. persist()
  // is called once when the object is dropped instead.
  moveObjectLive: (id, position) => {
    set((s) => ({
      objects: s.objects.map((o) => (o.id === id ? { ...o, position } : o)),
    }));
  },

  deleteObject: (id) => {
    set((s) => ({
      objects: s.objects
        .filter((o) => o.id !== id)
        .map((o) => ({ ...o, links: o.links.filter((l) => l !== id) })),
      targetedId: s.targetedId === id ? null : s.targetedId,
      carryingId: s.carryingId === id ? null : s.carryingId,
      linkFrom: s.linkFrom === id ? null : s.linkFrom,
    }));
    get().persist();
  },

  setTargeted: (id) => set({ targetedId: id }),
  pickUp: (id) => set({ carryingId: id }),
  drop: () => {
    get().persist();
    set({ carryingId: null });
  },

  // Called when the user wants to draw a link. First press sets linkFrom,
  // a second press on a different object completes the link both ways.
  beginOrCompleteLink: (id) => {
    const { linkFrom, objects } = get();
    if (!linkFrom) {
      set({ linkFrom: id });
      return;
    }
    if (linkFrom === id) {
      set({ linkFrom: null });
      return;
    }
    set({
      objects: objects.map((o) => {
        if (o.id === linkFrom && !o.links.includes(id)) return { ...o, links: [...o.links, id] };
        if (o.id === id && !o.links.includes(linkFrom)) return { ...o, links: [...o.links, linkFrom] };
        return o;
      }),
      linkFrom: null,
    });
    get().persist();
  },

  cancelLink: () => set({ linkFrom: null }),

  resetWorld: () => {
    set({ objects: [], targetedId: null, carryingId: null, linkFrom: null });
    get().persist();
  },

  persist: () => saveWorld({ objects: get().objects }),
}));

function colorFor(type) {
  switch (type) {
    case 'note': return '#6fa8ff';
    case 'task': return '#ffb454';
    case 'idea': return '#c792ea';
    case 'image': return '#7ee0a8';
    default: return '#e8e6df';
  }
}
