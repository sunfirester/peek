const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('overlay', {
  onEvent: (callback) => ipcRenderer.on('frigate-event', (event, data) => callback(data)),
  hide: () => ipcRenderer.send('overlay-hide'),
  resize: (width, height) => ipcRenderer.send('overlay-resize', { width, height }),
  openUrl: (url) => ipcRenderer.send('overlay-open-url', url),
  onSetMuted: (callback) => ipcRenderer.on('set-muted', (event, muted) => callback(muted))
})
