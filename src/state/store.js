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
  selectedId: null,
  linkFrom: null, // id of object waiting to be connected to a second one

  enterWorld: () => set({ sessionState: 'exploring' }),
  returnToMenu: () => {
    get().persist();
    set({ sessionState: 'menu' });
  },

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

  updateObject: (id, patch) => {
    set((s) => ({
      objects: s.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));
    get().persist();
  },

  deleteObject: (id) => {
    set((s) => ({
      objects: s.objects
        .filter((o) => o.id !== id)
        .map((o) => ({ ...o, links: o.links.filter((l) => l !== id) })),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }));
    get().persist();
  },

  select: (id) => set({ selectedId: id }),

  // Called when the user wants to draw a link. First click sets linkFrom,
  // second click on a different object completes the link both ways.
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
    set({ objects: [], selectedId: null, linkFrom: null });
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
