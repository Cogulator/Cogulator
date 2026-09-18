const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('embeddingHost', {
  onRequest: callback => ipcRenderer.on('embedding-request', (_event, request) => callback(request)),
  respond: response => ipcRenderer.send('embedding-response', response),
  ready: () => ipcRenderer.send('embedding-ready'),
});
