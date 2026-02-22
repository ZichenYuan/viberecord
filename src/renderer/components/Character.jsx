import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
const { ipcRenderer } = window.require('electron');

function Character() {
  const [leftArmRaised, setLeftArmRaised] = useState(false);
  const [rightArmRaised, setRightArmRaised] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [moveDirection, setMoveDirection] = useState(null);
  const [characterStyle, setCharacterStyle] = useState('bubble');
  const [isRecording, setIsRecording] = useState(false);
  const [characterSize, setCharacterSize] = useState(100);
  const [webcamError, setWebcamError] = useState(false);
  const videoRef = useRef(null);
  const moveTimeoutRef = useRef(null);
  const streamRef = useRef(null);
  const leftArmRef = useRef(null);
  const rightArmRef = useRef(null);

  // Spring-animated angles using SVG native rotate(angle, cx, cy)
  const leftArmAngle = useSpring(-45, { stiffness: 300, damping: 20 });
  const rightArmAngle = useSpring(45, { stiffness: 300, damping: 20 });

  useEffect(() => {
    leftArmAngle.set(leftArmRaised ? 35 : -45);
  }, [leftArmRaised]);

  useEffect(() => {
    rightArmAngle.set(rightArmRaised ? -35 : 45);
  }, [rightArmRaised]);

  useEffect(() => {
    const unsubLeft = leftArmAngle.on('change', v => {
      if (leftArmRef.current) {
        leftArmRef.current.setAttribute('transform', `rotate(${v}, 40, 55)`);
      }
    });
    const unsubRight = rightArmAngle.on('change', v => {
      if (rightArmRef.current) {
        rightArmRef.current.setAttribute('transform', `rotate(${v}, 60, 55)`);
      }
    });
    return () => { unsubLeft(); unsubRight(); };
  }, []);

  useEffect(() => {
    // Initialize webcam immediately on mount
    const initWebcam = async () => {
      try {
        console.log('Requesting webcam access...');

        // First request basic camera access to trigger permission prompt
        const initialStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        // Stop initial stream so we can re-open with preferred device
        initialStream.getTracks().forEach(track => track.stop());

        // Now enumerate devices (labels are available after permission is granted)
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        console.log('Available cameras:', videoDevices);

        // Find built-in camera (avoid iPhone/Continuity camera)
        const builtInCamera = videoDevices.find(device =>
          device.label.toLowerCase().includes('facetime') ||
          device.label.toLowerCase().includes('built-in') ||
          (device.label.toLowerCase().includes('integrated') && !device.label.toLowerCase().includes('iphone'))
        ) || videoDevices[0];

        console.log('Using camera:', builtInCamera?.label);

        // Re-open camera with preferred device
        const videoConstraints = {
          width: { ideal: 320 },
          height: { ideal: 240 }
        };
        if (builtInCamera && builtInCamera.deviceId) {
          videoConstraints.deviceId = { exact: builtInCamera.deviceId };
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false
        });

        console.log('Webcam access granted!');
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Ensure video plays
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(err => {
              console.error('Error playing video:', err);
            });
          };
        }

        setWebcamError(false);
      } catch (error) {
        console.error('Error accessing webcam:', error);
        setWebcamError(true);

        // Show error to user
        if (error.name === 'NotAllowedError') {
          alert('Camera permission denied! Please allow camera access and reload the app.');
        } else if (error.name === 'NotFoundError') {
          alert('No camera found! Please connect a camera and reload the app.');
        } else {
          alert(`Camera error: ${error.message}. Please check camera permissions in System Preferences.`);
        }
      }
    };

    // Start webcam immediately
    initWebcam();

    // Set up IPC listeners
    ipcRenderer.on('move', (event, direction) => {
      setIsMoving(true);
      setMoveDirection(direction);

      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = setTimeout(() => {
        setIsMoving(false);
        setMoveDirection(null);
      }, 200);
    });

    ipcRenderer.on('gesture', (event, gesture) => {
      if (gesture === 'leftArm') {
        setLeftArmRaised(true);
        setTimeout(() => setLeftArmRaised(false), 1000);
      } else if (gesture === 'rightArm') {
        setRightArmRaised(true);
        setTimeout(() => setRightArmRaised(false), 1000);
      }
    });

    ipcRenderer.on('update-style', (event, style) => {
      setCharacterStyle(style);
    });

    ipcRenderer.on('recording-status', (event, status) => {
      setIsRecording(status);
    });

    ipcRenderer.on('update-size', (event, size) => {
      setCharacterSize(size);
    });

    // Cleanup
    return () => {
      ipcRenderer.removeAllListeners('move');
      ipcRenderer.removeAllListeners('gesture');
      ipcRenderer.removeAllListeners('update-style');
      ipcRenderer.removeAllListeners('recording-status');
      ipcRenderer.removeAllListeners('update-size');

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const bodyColor = '#4A5568';

  const renderHead = () => {
    const headScale = characterSize / 100;
    // Make head smaller in character mode for better proportions
    const headSizeMultiplier = characterStyle === 'character' ? 0.7 : 1;
    const headSize = 80 * headScale * headSizeMultiplier;

    const headStyle = {
      width: `${headSize}px`,
      height: `${headSize}px`,
      marginBottom: characterStyle === 'character' ? `-${35 * headScale}px` : '0'
    };

    return (
      <div className="character-head" style={headStyle}>
        {!webcamError ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="webcam-feed"
          />
        ) : (
          <div
            className="webcam-error"
            onClick={() => window.location.reload()}
            style={{ cursor: 'pointer', fontSize: `${30 * headScale}px` }}
            title="Click to retry camera"
          >
            📷
          </div>
        )}
      </div>
    );
  };

  const renderBubble = () => renderHead();

  const renderCharacter = () => {
    const bodyScale = characterSize / 100;
    return (
      <>
        {renderHead()}
        <svg
          className="character-body"
          viewBox="0 0 100 150"
          width={100 * bodyScale}
          height={150 * bodyScale}
          style={{ marginTop: `-${15 * bodyScale}px` }}
        >
        <g className="torso">
          <rect
            x="40"
            y="50"
            width="20"
            height="40"
            fill={bodyColor}
            rx="2"
          />
        </g>

        <line
          ref={leftArmRef}
          className="left-arm"
          x1="40"
          y1="55"
          x2="15"
          y2="55"
          stroke={bodyColor}
          strokeWidth="4"
          strokeLinecap="round"
          transform="rotate(-45, 40, 55)"
        />

        <line
          ref={rightArmRef}
          className="right-arm"
          x1="60"
          y1="55"
          x2="85"
          y2="55"
          stroke={bodyColor}
          strokeWidth="4"
          strokeLinecap="round"
          transform="rotate(45, 60, 55)"
        />

        <g className="legs">
          <rect
            x="42"
            y="90"
            width="6"
            height="25"
            fill={bodyColor}
            rx="2"
          />
          <rect
            x="52"
            y="90"
            width="6"
            height="25"
            fill={bodyColor}
            rx="2"
          />
        </g>
      </svg>
    </>
    );
  };

  // Add new modes here
  const modes = {
    bubble: renderBubble,
    character: renderCharacter,
  };

  const renderMode = modes[characterStyle] || modes.bubble;

  return (
    <div className="character-container">
      <AnimatePresence>
        {isRecording && (
          <motion.div
            className="recording-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="recording-dot" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="character"
        animate={{
          y: isMoving ? [0, -5, 0] : 0,
        }}
        transition={{
          duration: 0.3,
          repeat: isMoving ? Infinity : 0,
        }}
      >
        {renderMode()}
      </motion.div>
    </div>
  );
}

export default Character;