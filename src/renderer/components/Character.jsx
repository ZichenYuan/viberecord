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
    if (characterStyle === 'square') {
      // Square Man angles: more horizontal positioning
      leftArmAngle.set(leftArmRaised ? 40 : -10);
    } else {
      // Character mode angles
      leftArmAngle.set(leftArmRaised ? 35 : -45);
    }
  }, [leftArmRaised, characterStyle]);

  useEffect(() => {
    if (characterStyle === 'square') {
      // Square Man angles: more horizontal positioning
      rightArmAngle.set(rightArmRaised ? -40 : 10);
    } else {
      // Character mode angles
      rightArmAngle.set(rightArmRaised ? -35 : 45);
    }
  }, [rightArmRaised, characterStyle]);

  useEffect(() => {
    const unsubLeft = leftArmAngle.on('change', v => {
      if (leftArmRef.current) {
        // Different pivot points based on character mode
        if (characterStyle === 'square') {
          // Square Man: pivot from shoulder connection (right edge of left arm)
          leftArmRef.current.setAttribute('transform', `rotate(${v}, 33, 55)`);
        } else {
          // Character mode: original pivot
          leftArmRef.current.setAttribute('transform', `rotate(${v}, 40, 55)`);
        }
      }
    });
    const unsubRight = rightArmAngle.on('change', v => {
      if (rightArmRef.current) {
        // Different pivot points based on character mode
        if (characterStyle === 'square') {
          // Square Man: pivot from shoulder connection (left edge of right arm)
          rightArmRef.current.setAttribute('transform', `rotate(${v}, 87, 55)`);
        } else {
          // Character mode: original pivot
          rightArmRef.current.setAttribute('transform', `rotate(${v}, 60, 55)`);
        }
      }
    });
    return () => { unsubLeft(); unsubRight(); };
  }, [characterStyle]);

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
    const headSizeMultiplier = (characterStyle === 'character' || characterStyle === 'square') ? 0.7 : 1;
    const headSize = 80 * headScale * headSizeMultiplier;

    // Different styling for square mode
    const isSquare = characterStyle === 'square';
    const isCharacter = characterStyle === 'character';

    const headStyle = {
      width: `${headSize}px`,
      height: `${headSize}px`,
      marginBottom: (isCharacter || isSquare) ? `-${35 * headScale}px` : '0',
      borderRadius: isSquare ? '0' : '50%' // Square for square, circle for others
    };

    const headClasses = `character-head ${isSquare ? 'square-head' : ''}`;

    return (
      <div className={headClasses} style={headStyle}>
        {!webcamError ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="webcam-feed"
            style={{
              imageRendering: isSquare ? 'pixelated' : 'auto',
              filter: isSquare ? 'contrast(1.1) saturate(1.2)' : 'none'
            }}
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

  const renderSquare = () => {
    const bodyScale = characterSize / 100;
    return (
      <>
        {renderHead()}
        <svg
          className="square-body"
          viewBox="0 0 120 160"
          width={120 * bodyScale}
          height={160 * bodyScale}
          style={{ marginTop: `-${15 * bodyScale}px` }}
        >
        <g className="square-torso">
          {/* Main body - more rectangular/blocky */}
          <rect
            x="35"
            y="50"
            width="50"
            height="60"
            fill="#4A90E2"
            stroke="#2D5A87"
            strokeWidth="2"
          />
          {/* Body detail lines for 3D effect */}
          <rect x="37" y="52" width="46" height="4" fill="#5BA0F2" />
          <rect x="37" y="58" width="46" height="2" fill="#3A7BC8" />
        </g>

        {/* Animated left arm */}
        <rect
          ref={leftArmRef}
          x="15"
          y="55"
          width="18"
          height="35"
          fill="#4A90E2"
          stroke="#2D5A87"
          strokeWidth="2"
          transform="rotate(-10, 33, 55)"
        />

        {/* Animated right arm */}
        <rect
          ref={rightArmRef}
          x="87"
          y="55"
          width="18"
          height="35"
          fill="#4A90E2"
          stroke="#2D5A87"
          strokeWidth="2"
          transform="rotate(10, 87, 55)"
        />

        {/* Blocky legs */}
        <g className="square-legs">
          <rect
            x="42"
            y="110"
            width="15"
            height="40"
            fill="#654321"
            stroke="#4A3218"
            strokeWidth="2"
          />
          <rect
            x="63"
            y="110"
            width="15"
            height="40"
            fill="#654321"
            stroke="#4A3218"
            strokeWidth="2"
          />
          {/* Leg details */}
          <rect x="44" y="112" width="11" height="3" fill="#7A5228" />
          <rect x="65" y="112" width="11" height="3" fill="#7A5228" />
        </g>
      </svg>
    </>
    );
  };

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
    square: renderSquare,
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