// Persistence layer.
//
// In dev (browser, `npm run dev`) we use localStorage so the world survives
// a refresh. Once we wrap this in Electron (Day 5), electron/preload.cjs
// will expose `window.archiveAPI.saveWorld/loadWorld` backed by a real JSON
// file on disk via the main process — this file only needs a small branch
// added there, nothing else in the app changes.

const KEY = 'the-archive-save-v1';

export function loadWorld() {
  if (typeof window !== 'undefined' && window.archiveAPI?.loadWorld) {
    // Electron path — synchronous IPC bridge set up in Day 5.
    try {
      return window.archiveAPI.loadWorld();
    } catch (e) {
      console.warn('Electron load failed, falling back to empty world', e);
      return null;
    }
  }
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Failed to load saved world', e);
    return null;
  }
}

export function saveWorld(data) {
  if (typeof window !== 'undefined' && window.archiveAPI?.saveWorld) {
    window.archiveAPI.saveWorld(data);
    return;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save world', e);
  }
}
