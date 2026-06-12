const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('setup', {
  load: () => ipcRenderer.invoke('setup-load'),
  test: (config) => ipcRenderer.invoke('setup-test', config),
  save: (config) => ipcRenderer.invoke('setup-save', config),
  cancel: () => ipcRenderer.send('setup-cancel')
})
