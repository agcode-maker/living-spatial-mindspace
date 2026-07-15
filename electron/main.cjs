const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Where the world gets saved on this machine - a real file, not just
// localStorage, so persistence survives a full app reinstall/move too.
const SAVE_PATH = path.join(app.getPath('userData'), 'archive-save.json');

function readSave() {
  try {
    return JSON.parse(fs.readFileSync(SAVE_PATH, 'utf-8'));
  } catch {
    return null; // no save yet, or it's corrupt - start fresh rather than crash
  }
}

function writeSave(data) {
  try {
    fs.writeFileSync(SAVE_PATH, JSON.stringify(data), 'utf-8');
  } catch (e) {
    console.error('Failed to write save file', e);
  }
}

// Synchronous IPC on purpose - src/state/persistence.js expects
// loadWorld()/saveWorld() to return immediately, same as the localStorage
// path it falls back to in the browser. Keeps that file provider-agnostic.
ipcMain.on('load-world', (event) => {
  event.returnValue = readSave();
});

ipcMain.on('save-world', (event, data) => {
  writeSave(data);
  event.returnValue = true;
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#05060a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
