const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (name, dataStr) => ipcRenderer.send('save-file', name, dataStr),
  loadFile: (callback) => ipcRenderer.on('load-file', (event, dataStr) => callback(dataStr)),
  listFiles: () => ipcRenderer.invoke('list-files'),
  openFile: (fileName) => ipcRenderer.send('open-file', fileName),
  deleteFile: (fileName) => ipcRenderer.invoke('delete-file', fileName),
  renameFile: (oldName, newName) => ipcRenderer.invoke('rename-file', oldName, newName),
  copyFile: (fileName) => ipcRenderer.invoke('copy-file', fileName),
  openFinder: () => ipcRenderer.send('open-finder'),
  onAutoSave: (callback) => ipcRenderer.on('trigger-autosave', callback),
  onRefreshSidebar: (callback) => ipcRenderer.on('refresh-sidebar', callback)
});
