const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  requestPermissions: async () => {
    // Request camera permission
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      return true;
    } catch (err) {
      console.error('Camera permission denied:', err);
      return false;
    }
  }
});