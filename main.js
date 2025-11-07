
const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  desktopCapturer,
} = require('electron');
const path = require('path');
const Tesseract = require('tesseract.js');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile('index.html');
}


ipcMain.handle('capture-and-ocr', async () => {
  try {
   
    const result = await Tesseract.recognize(pngBuffer, 'eng', {
      logger: (m) => console.log(m), 
    });

    const text = result.data && result.data.text ? result.data.text : '';

    return { ok: true, text };
  } catch (err) {
    console.error('capture-and-ocr error in main process:', err);
    return {
      ok: false,
      error: err.message || String(err),
    };
  }
});



app.whenReady().then(() => {
  createWindow();

  
  const success = globalShortcut.register('F8', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (!win) return;

    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
  });

  if (!success) {
    console.warn('Failed to register global shortcut F8');
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});


app.on('window-all-closed', () => {
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('will-quit', () => {
  
  globalShortcut.unregisterAll();
});

