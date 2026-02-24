import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
const { ipcRenderer } = window.require('electron');

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('bubble');
  const [micEnabled, setMicEnabled] = useState(true);
  const [characterSize, setCharacterSize] = useState(100);
  const [selectedSkin, setSelectedSkin] = useState('default');
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    ipcRenderer.on('recording-started', () => {
      setIsRecording(true);
      setCountdown(null);
    });

    ipcRenderer.on('recording-stopped', () => {
      setIsRecording(false);
    });

    return () => {
      ipcRenderer.removeAllListeners('recording-started');
      ipcRenderer.removeAllListeners('recording-stopped');
    };
  }, []);

  const startCountdown = () => {
    let count = 3;
    setCountdown(count);

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        setCountdown(null);
        startRecording();
      }
    }, 1000);
  };

  const startRecording = async () => {
    try {
      console.log('Starting recording...');

      // Set recording state IMMEDIATELY for UI feedback
      setIsRecording(true);

      const sources = await ipcRenderer.invoke('get-sources');
      const primaryScreen = sources[0];

      if (!primaryScreen) {
        alert('No screen source available. Please grant screen recording permission in System Preferences > Privacy & Security > Screen Recording');
        setIsRecording(false);
        return;
      }

      // Get microphone stream if enabled
      let audioStream = null;
      if (micEnabled) {
        try {
          audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100
            }
          });
        } catch (err) {
          console.error('Microphone access denied:', err);
        }
      }

      const videoStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: primaryScreen.id,
            minWidth: 1280,
            maxWidth: 1920,
            minHeight: 720,
            maxHeight: 1080
          }
        }
      });

      // Combine video and audio streams
      const tracks = [...videoStream.getTracks()];
      if (audioStream) {
        tracks.push(...audioStream.getTracks());
      }
      const stream = new MediaStream(tracks);

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'video/webm'
      });

      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: 'video/webm'
        });

        const buffer = await blob.arrayBuffer();
        ipcRenderer.send('stop-recording', buffer);

        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      mediaRecorderRef.current.start();
      console.log('MediaRecorder started successfully');
      ipcRenderer.send('start-recording', primaryScreen.id);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please grant screen recording permission in System Preferences > Privacy & Security > Screen Recording');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startCountdown();
    }
  };

  const handleStyleChange = (style) => {
    setSelectedStyle(style);
    ipcRenderer.send('update-character-style', style);
  };

  const handleSizeChange = (size) => {
    setCharacterSize(size);
    ipcRenderer.send('update-character-size', size);
  };

  const handleSkinChange = (skin) => {
    setSelectedSkin(skin);
    ipcRenderer.send('update-character-skin', skin);
  };

  return (
    <div className="control-panel">
      {countdown && (
        <div className="countdown-overlay">
          <motion.div
            className="countdown-number"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            key={countdown}
          >
            {countdown}
          </motion.div>
        </div>
      )}

      <div className="panel-content">
        <h1 className="title">GamiRecorder</h1>

        <motion.button
          className={`record-button ${isRecording ? 'recording' : ''}`}
          onClick={handleRecordToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isRecording ? '⬜ Stop' : '🔴 Record'}
        </motion.button>

        <div className="controls">
          <div className="style-selector">
            <label>Character Style:</label>
            <select
              className="style-dropdown"
              value={selectedStyle}
              onChange={(e) => handleStyleChange(e.target.value)}
            >
              <option value="bubble">Bubble</option>
              <option value="character">Character</option>
              <option value="square">Square Man</option>
            </select>
          </div>

          {selectedStyle === 'square' && (
            <div className="skin-selector">
              <label>Square Man Skin:</label>
              <select
                className="style-dropdown"
                value={selectedSkin}
                onChange={(e) => handleSkinChange(e.target.value)}
                disabled={isRecording}
              >
                <option value="default">Default</option>
                <option value="knight">Knight</option>
                <option value="robot">Robot</option>
                <option value="lumberjack">Lumberjack</option>
                <option value="ninja">Ninja</option>
                <option value="pirate">Pirate</option>
              </select>
            </div>
          )}

          {selectedStyle === 'character' && (
            <div className="skin-selector">
              <label>Character Skin:</label>
              <select
                className="style-dropdown"
                value={selectedSkin}
                onChange={(e) => handleSkinChange(e.target.value)}
                disabled={isRecording}
              >
                <option value="default">Default</option>
                <option value="mickey">Mickey</option>
                <option value="bumblebee">Bee</option>
                <option value="bear">Bear</option>
                <option value="cat">Cat</option>
              </select>
            </div>
          )}

          {selectedStyle === 'bubble' && (
            <div className="skin-selector">
              <label>Bubble Skin:</label>
              <select
                className="style-dropdown"
                value={selectedSkin}
                onChange={(e) => handleSkinChange(e.target.value)}
                disabled={isRecording}
              >
                <option value="default">Default</option>
                <option value="crown">Royal Crown</option>
                <option value="graduationCap">Graduation Cap</option>
                <option value="cowboyHat">Cowboy Hat</option>
                <option value="wizard">Wizard</option>
              </select>
            </div>
          )}

          <div className="size-control">
            <label>Character Size:</label>
            <input
              type="range"
              className="size-slider"
              min="100"
              max="400"
              value={characterSize}
              onChange={(e) => handleSizeChange(parseInt(e.target.value))}
              disabled={isRecording}
            />
            <span className="size-value">{characterSize}%</span>
          </div>

          <div className="mic-toggle">
            <label>
              <input
                type="checkbox"
                checked={micEnabled}
                onChange={(e) => setMicEnabled(e.target.checked)}
                disabled={isRecording}
              />
              <span>🎤 Microphone</span>
            </label>
          </div>
        </div>

        <div className="instructions">
          <p>Controls:</p>
          <ul>
            <li>Arrow Keys - Move character</li>
            <li>Z - Left arm gesture</li>
            <li>X - Right arm gesture</li>
            <li>Cmd+Shift+H - Hide/Show panel</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;