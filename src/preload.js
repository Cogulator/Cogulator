const { contextBridge, ipcRenderer, webFrame, webUtils } = require('electron');

const syncChannels = new Set([
  'set-config', 'get-config', 'read-documents-path', 'read-desktop-path',
  'read-models-path', 'dialog-error', 'dialog-delete-confirm',
  'dialog-export-path', 'model-context-menu', 'directory-context-menu',
]);
const sendChannels = new Set(['rag-query']);
const invokeChannels = new Set([
  'groq-key-status', 'groq-key-save', 'groq-key-remove', 'open-groq-console',
  'rag-cancel', 'rag-clear-history',
]);
const receiveChannels = new Set([
  'Directory->Delete', 'Directory->Rename', 'Edit->Find',
  'File->ChangeModelsDirectory', 'File->Export Model',
  'File->Export Working Memory', 'File->Save', 'Help->Quick Start',
  'Model->Delete', 'Model->Duplicate', 'Model->Rename',
  'View->Dark', 'View->Light', 'View->Toggle Line Numbers',
  'rag-done', 'rag-error', 'rag-token',
]);

const file = (operation, ...args) => ipcRenderer.sendSync('file-operation', operation, ...args);
const path = (operation, ...args) => ipcRenderer.sendSync('path-operation', operation, ...args);
const platform = ipcRenderer.sendSync('platform-info');

const ipc = {
  sendSync(channel, ...args) {
    if (!syncChannels.has(channel)) throw new Error(`Unsupported synchronous IPC channel: ${channel}`);
    return ipcRenderer.sendSync(channel, ...args);
  },
  send(channel, ...args) {
    if (!sendChannels.has(channel)) throw new Error(`Unsupported IPC channel: ${channel}`);
    ipcRenderer.send(channel, ...args);
  },
  invoke(channel, ...args) {
    if (!invokeChannels.has(channel)) return Promise.reject(new Error(`Unsupported IPC channel: ${channel}`));
    return ipcRenderer.invoke(channel, ...args);
  },
  on(channel, listener) {
    if (!receiveChannels.has(channel)) throw new Error(`Unsupported IPC event: ${channel}`);
    ipcRenderer.on(channel, (_event, ...args) => listener(null, ...args));
  },
};

contextBridge.exposeInMainWorld('cogulator', {
  files: {
    mkdirSync: (target) => file('mkdir', target),
    readdirSync: (target) => file('readdir', target),
    stat: (target) => file('stat', target),
    readFileSync: (target, encoding) => file('read', target, encoding),
    renameSync: (source, target) => file('rename', source, target),
    existsSync: (target) => file('exists', target),
    writeFileSync: (target, contents) => file('write', target, contents),
    appendFileSync: (target, contents) => file('append', target, contents),
    copyFileSync: (source, target) => file('copy', source, target),
    trash: (target) => ipcRenderer.invoke('file-trash', target),
  },
  path: {
    basename: (...args) => path('basename', ...args),
    dirname: (...args) => path('dirname', ...args),
    extname: (...args) => path('extname', ...args),
    join: (...args) => path('join', ...args),
    resolve: (...args) => path('resolve', ...args),
    sep: platform.pathSeparator,
  },
  os: { type: platform.type, EOL: platform.EOL },
  ipc,
  window: {
    getZoomFactor: () => webFrame.getZoomFactor(),
    setZoomFactor: (factor) => webFrame.setZoomFactor(factor),
    command: (command) => ipcRenderer.sendSync('window-command', command),
    isFullScreen: () => ipcRenderer.sendSync('window-is-fullscreen'),
    setFullScreen: (value) => ipcRenderer.sendSync('window-set-fullscreen', Boolean(value)),
    openCogulatorFolder: () => ipcRenderer.invoke('open-cogulator-folder'),
    openWebsite: () => ipcRenderer.invoke('open-cogulator-website'),
    getPathForFile: (file) => webUtils.getPathForFile(file),
  },
});
