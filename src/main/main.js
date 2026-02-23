const { app, BrowserWindow, ipcMain, globalShortcut, desktopCapturer, dialog, systemPreferences } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');

let characterWindow = null;
let controlWindow = null;
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];

function createCharacterWindow() {
  characterWindow = new BrowserWindow({
    width: 1200,  // Fixed large size to accommodate max scale (300 * 4)
    height: 1600, // Fixed large size to accommodate max scale (400 * 4)
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  });

  characterWindow.setIgnoreMouseEvents(true, { forward: true });
  characterWindow.setVisibleOnAllWorkspaces(true);

  // Handle permission requests - properly handle camera permission
  characterWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    console.log('Permission requested:', permission);
    callback(true); // Grant all permissions
  });

  // Set permission check handler for better permission management
  characterWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    console.log('Permission check:', permission, requestingOrigin);
    return true;
  });

  const characterUrl = isDev
    ? 'http://localhost:3000/character.html'
    : `file://${path.join(__dirname, '../../dist/character.html')}`;

  characterWindow.loadURL(characterUrl);

  characterWindow.on('closed', () => {
    characterWindow = null;
  });
}

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 400,
    height: 500,
    minWidth: 350,
    minHeight: 400,
    frame: true,
    alwaysOnTop: false,
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const controlUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../../dist/index.html')}`;

  controlWindow.loadURL(controlUrl);

  controlWindow.on('closed', () => {
    controlWindow = null;
    if (characterWindow) {
      characterWindow.close();
    }
    app.quit();
  });
}

app.whenReady().then(async () => {
  // Request camera and microphone access for macOS
  if (process.platform === 'darwin') {
    const cameraStatus = systemPreferences.getMediaAccessStatus('camera');
    const micStatus = systemPreferences.getMediaAccessStatus('microphone');

    console.log('Camera access status:', cameraStatus);
    console.log('Microphone access status:', micStatus);

    if (cameraStatus !== 'granted') {
      const granted = await systemPreferences.askForMediaAccess('camera');
      console.log('Camera access granted:', granted);
    }

    if (micStatus !== 'granted') {
      const granted = await systemPreferences.askForMediaAccess('microphone');
      console.log('Microphone access granted:', granted);
    }
  }

  createControlWindow();
  createCharacterWindow();

  // Show permission info after windows are created
  setTimeout(() => {
    if (process.platform === 'darwin') {
      dialog.showMessageBox(controlWindow, {
        type: 'info',
        title: 'Welcome to GamiRecorder!',
        message: 'Quick Setup:',
        detail: '1. Camera should be working (check the character head)\n2. Use Arrow Keys to move the character\n3. Press Z/X for arm gestures\n4. For screen recording, enable in System Preferences > Privacy & Security > Screen Recording',
        buttons: ['Got it!']
      });
    }
  }, 2000);

  // Register global shortcuts for character movement - using simple arrow keys!
  globalShortcut.register('Left', () => {
    if (characterWindow) {
      const [x, y] = characterWindow.getPosition();
      characterWindow.setPosition(x - 20, y);
      characterWindow.webContents.send('move', 'left');
    }
  });

  globalShortcut.register('Right', () => {
    if (characterWindow) {
      const [x, y] = characterWindow.getPosition();
      characterWindow.setPosition(x + 20, y);
      characterWindow.webContents.send('move', 'right');
    }
  });

  globalShortcut.register('Up', () => {
    if (characterWindow) {
      const [x, y] = characterWindow.getPosition();
      characterWindow.setPosition(x, y - 20);
      characterWindow.webContents.send('move', 'up');
    }
  });

  globalShortcut.register('Down', () => {
    if (characterWindow) {
      const [x, y] = characterWindow.getPosition();
      characterWindow.setPosition(x, y + 20);
      characterWindow.webContents.send('move', 'down');
    }
  });

  // Arm gestures
  globalShortcut.register('Z', () => {
    if (characterWindow) {
      characterWindow.webContents.send('gesture', 'leftArm');
    }
  });

  globalShortcut.register('X', () => {
    if (characterWindow) {
      characterWindow.webContents.send('gesture', 'rightArm');
    }
  });

  // Toggle UI visibility
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    if (controlWindow) {
      if (controlWindow.isVisible()) {
        controlWindow.hide();
      } else {
        controlWindow.show();
      }
    }
  });
});

// IPC handlers
ipcMain.handle('get-sources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 1920, height: 1080 }
  });
  return sources;
});

ipcMain.on('start-recording', (event, sourceId) => {
  if (controlWindow) {
    controlWindow.webContents.send('recording-started');
  }
  if (characterWindow) {
    characterWindow.webContents.send('recording-status', true);
  }
});

ipcMain.on('stop-recording', (event, videoData) => {
  const videoBuffer = Buffer.from(videoData);

  dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `gamirecorder-${Date.now()}.webm`,
    filters: [
      { name: 'WebM Video', extensions: ['webm'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  }).then(result => {
    if (!result.canceled) {
      fs.writeFile(result.filePath, videoBuffer, (err) => {
        if (err) {
          console.error('Error saving video:', err);
          dialog.showErrorBox('Save Failed', 'Could not save the video: ' + err.message);
        } else {
          console.log('Video saved successfully');
          dialog.showMessageBox({
            type: 'info',
            title: 'Success',
            message: 'Recording saved successfully!',
            detail: `Video saved to: ${result.filePath}`,
            buttons: ['OK']
          });
        }
      });
    }
  });

  if (controlWindow) {
    controlWindow.webContents.send('recording-stopped');
  }
  if (characterWindow) {
    characterWindow.webContents.send('recording-status', false);
  }
});

ipcMain.on('update-character-style', (event, style) => {
  if (characterWindow) {
    characterWindow.webContents.send('update-style', style);
  }
});

ipcMain.on('update-character-size', (event, size) => {
  if (characterWindow) {
    // Use a fixed large window size that can accommodate the largest scale
    const maxScale = 4; // 400%
    const baseWidth = 300;
    const baseHeight = 400;

    // Set window to maximum size to accommodate all scales
    const windowWidth = baseWidth * maxScale;
    const windowHeight = baseHeight * maxScale;

    // Only resize if window size is different
    const [currentWidth, currentHeight] = characterWindow.getSize();
    if (currentWidth !== windowWidth || currentHeight !== windowHeight) {
      characterWindow.setSize(windowWidth, windowHeight);
    }

    // Send the size update to the character component
    characterWindow.webContents.send('update-size', size);
  }
});

ipcMain.on('update-character-skin', (event, skin) => {
  if (characterWindow) {
    characterWindow.webContents.send('update-skin', skin);
  }
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createControlWindow();
    createCharacterWindow();
  }
});