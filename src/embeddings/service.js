const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

let host;
let ready;
let nextId = 0;
const pending = new Map();

function reset(error) {
  const previous = host;
  host = null;
  ready = null;
  for (const { reject, timer } of pending.values()) {
    clearTimeout(timer);
    reject(error);
  }
  pending.clear();
  if (previous && !previous.isDestroyed()) previous.destroy();
}

ipcMain.on('embedding-response', (event, response) => {
  if (!host || event.sender !== host.webContents) return;
  if (response.fatal) return reset(new Error(response.fatal));
  const request = pending.get(response.id);
  if (!request) return;
  pending.delete(response.id);
  clearTimeout(request.timer);
  if (response.error) return request.reject(new Error(response.error));
  if (!Array.isArray(response.embedding) || response.embedding.length !== 384 ||
      !response.embedding.every(Number.isFinite)) {
    return request.reject(new Error('Invalid embedding returned by Assist.'));
  }
  request.resolve(response.embedding);
});

function ensureHost() {
  if (ready) return ready;
  host = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, contextIsolation: true, sandbox: true,
      backgroundThrottling: false,
    },
  });
  const window = host;
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  ready = new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      ipcMain.removeListener('embedding-ready', onReady);
      window.removeListener('closed', onClosed);
    };
    const fail = error => { cleanup(); reject(error); };
    const onClosed = () => fail(new Error('Embedding window closed.'));
    const onReady = event => {
      if (event.sender !== window.webContents) return;
      cleanup(); resolve();
    };
    const timer = setTimeout(() => fail(new Error('Embedding worker startup timed out.')), 30000);
    ipcMain.on('embedding-ready', onReady);
    window.once('closed', onClosed);
    window.loadFile(path.join(__dirname, 'index.html')).catch(fail);
  });
  window.webContents.on('render-process-gone', () => {
    if (host === window) reset(new Error('Embedding process stopped. Please try again.'));
  });
  window.on('closed', () => {
    if (host === window) reset(new Error('Embedding window closed.'));
  });
  return ready;
}

async function embed(text) {
  try { await ensureHost(); } catch (error) { reset(error); throw error; }
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => reset(new Error('Embedding request timed out. Please try again.')), 120000);
    pending.set(id, { resolve, reject, timer });
    host.webContents.send('embedding-request', { id, text });
  });
}

app.on('before-quit', () => reset(new Error('Cogulator is closing.')));
module.exports = { embed, dispose: () => reset(new Error('Assist closed.')) };
