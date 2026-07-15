const { contextBridge, ipcRenderer } = require('electron');

// Exposed as window.archiveAPI in the renderer - src/state/persistence.js
// checks for this and uses it instead of localStorage when present.
contextBridge.exposeInMainWorld('archiveAPI', {
  loadWorld: () => ipcRenderer.sendSync('load-world'),
  saveWorld: (data) => ipcRenderer.sendSync('save-world', data),
});
