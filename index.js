const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const drawingsPath = path.join(app.getPath('documents'), 'Excalidraw-Desktop');

if (!fs.existsSync(drawingsPath)) {
  fs.mkdirSync(drawingsPath, { recursive: true });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 950,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL('https://excalidraw.com/');

  // 1. Download Interceptor (Fallback)
  mainWindow.webContents.session.on('will-download', (event, item) => {
    const fileName = item.getFilename();
    const filePath = path.join(drawingsPath, fileName.endsWith('.excalidraw') ? fileName : fileName + '.excalidraw');
    item.setSavePath(filePath);
    item.once('done', (e, state) => {
      if (state === 'completed') {
        console.log(`✓ [Download] Saved to: ${filePath}`);
        mainWindow.webContents.send('refresh-sidebar');
      }
    });
  });

  // 2. Inject Sidebar Script
  mainWindow.webContents.on('did-finish-load', () => {
    const sidebarScript = fs.readFileSync(path.join(__dirname, 'sidebar.js'), 'utf8');
    mainWindow.webContents.executeJavaScript(sidebarScript);
  });

  setInterval(() => mainWindow && mainWindow.webContents.send('trigger-autosave'), 15000);
}

// IPC Handlers
ipcMain.handle('list-files', async () => {
  return fs.readdirSync(drawingsPath).filter(f => f.endsWith('.excalidraw')).map(n => ({
    name: n, mtime: fs.statSync(path.join(drawingsPath, n)).mtimeMs
  }));
});

ipcMain.on('save-file', (e, name, dataStr) => {
  const p = path.join(drawingsPath, name.endsWith('.excalidraw') ? name : name + '.excalidraw');
  fs.writeFileSync(p, dataStr);
  console.log(`✓ [Internal Save] Success: ${p}`);
});

ipcMain.handle('delete-file', async (e, n) => {
  const res = dialog.showMessageBoxSync(mainWindow, { 
    type: 'question', buttons: ['Cancel', 'Delete'], defaultId: 1,
    title: 'Delete', message: `Delete "${n}"?` 
  });
  if (res === 1) { 
    fs.unlinkSync(path.join(drawingsPath, n)); 
    console.log(`🗑 Deleted: ${n}`);
    return true; 
  }
  return false;
});

ipcMain.handle('rename-file', async (e, o, n) => {
  const op = path.join(drawingsPath, o);
  const np = path.join(drawingsPath, n.endsWith('.excalidraw') ? n : n + '.excalidraw');
  if (fs.existsSync(np)) { dialog.showErrorBox('Error', 'Exists'); return false; }
  try {
    fs.renameSync(op, np);
    console.log(`✏️ Renamed: ${o} -> ${n}`);
    return true;
  } catch(e) { return false; }
});

ipcMain.handle('copy-file', async (e, n) => {
  const op = path.join(drawingsPath, n);
  const ext = path.extname(n);
  const base = path.basename(n, ext);
  let count = 1;
  let np = path.join(drawingsPath, `${base}_copy${ext}`);
  while (fs.existsSync(np)) {
    np = path.join(drawingsPath, `${base}_copy${count}${ext}`);
    count++;
  }
  try {
    fs.copyFileSync(op, np);
    console.log(`📋 Copied: ${n} -> ${path.basename(np)}`);
    return true;
  } catch(e) { return false; }
});

ipcMain.on('open-finder', () => require('electron').shell.openPath(drawingsPath));

ipcMain.on('open-file', (e, n) => {
  const raw = fs.readFileSync(path.join(drawingsPath, n), 'utf8');
  const d = JSON.parse(raw);
  if (!d.appState) d.appState = {};
  d.appState.name = n.replace('.excalidraw', '');
  mainWindow.webContents.send('load-file', JSON.stringify(d));
  console.log(`📖 Opening: ${n}`);
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
