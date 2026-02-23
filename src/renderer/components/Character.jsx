import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { applySkin } from '../assets/skins/square-skins.js';
import { applyCharacterSkin, renderCharacterEffect } from '../assets/skins/character-skins.js';
const { ipcRenderer } = window.require('electron');

function Character() {
  const [leftArmRaised, setLeftArmRaised] = useState(false);
  const [rightArmRaised, setRightArmRaised] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [moveDirection, setMoveDirection] = useState(null);
  const [characterStyle, setCharacterStyle] = useState('bubble');
  const [isRecording, setIsRecording] = useState(false);
  const [characterSize, setCharacterSize] = useState(100);
  const [selectedSkin, setSelectedSkin] = useState('default');
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

    ipcRenderer.on('update-skin', (event, skin) => {
      setSelectedSkin(skin);
    });

    // Cleanup
    return () => {
      ipcRenderer.removeAllListeners('move');
      ipcRenderer.removeAllListeners('gesture');
      ipcRenderer.removeAllListeners('update-style');
      ipcRenderer.removeAllListeners('recording-status');
      ipcRenderer.removeAllListeners('update-size');
      ipcRenderer.removeAllListeners('update-skin');

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

    // Get skin-specific head frame colors for Square Man and Character
    const squareSkin = isSquare ? applySkin(selectedSkin) : null;
    const characterSkin = isCharacter ? applyCharacterSkin(selectedSkin) : null;

    const headFrameColor = isSquare ? squareSkin.colors.torsoStroke :
                          isCharacter ? characterSkin.colors.headFrame : null;
    const headBackgroundColor = isSquare ? squareSkin.colors.torso :
                               isCharacter ? characterSkin.colors.headBackground : null;

    const headStyle = {
      width: `${headSize}px`,
      height: `${headSize}px`,
      marginBottom: (isCharacter || isSquare) ? `-${35 * headScale}px` : '0',
      borderRadius: isSquare ? '0' : '50%', // Square for square, circle for others
      ...((isSquare || isCharacter) && headFrameColor && {
        border: `${isSquare ? '4px' : '3px'} solid ${headFrameColor}`,
        backgroundColor: headBackgroundColor,
        ...(isSquare && {
          boxShadow: `
            inset 2px 2px 0 rgba(255,255,255,0.3),
            inset -2px -2px 0 rgba(0,0,0,0.3),
            0 0 0 1px ${headFrameColor}
          `
        }),
        ...(isCharacter && {
          boxShadow: `
            inset 1px 1px 0 rgba(255,255,255,0.2),
            inset -1px -1px 0 rgba(0,0,0,0.2)
          `
        })
      })
    };

    const headClasses = `character-head ${isSquare ? 'square-head-dynamic' : ''}`;

    return (
      <div style={{ position: 'relative' }}>
        {/* Character head extras (like Mickey ears) */}
        {isCharacter && characterSkin?.extras?.head && (
          <svg
            width={headSize + 80}
            height={headSize + 100}
            style={{
              position: 'absolute',
              top: -50,
              left: -40,
              pointerEvents: 'none',
              zIndex: 0
            }}
          >
            {characterSkin.extras.head.map((extra, i) => (
              extra.type === 'circle' ? (
                selectedSkin === 'cat' ? (
                  <polygon
                    key={`head-${i}`}
                    points={`${headSize/2 + 40 + (extra.x * headScale)},${headSize/2 + 50 + (extra.y * headScale) + (extra.radius * headScale)} ${headSize/2 + 40 + (extra.x * headScale) - (extra.radius * headScale * 0.8)},${headSize/2 + 50 + (extra.y * headScale) - (extra.radius * headScale * 0.5)} ${headSize/2 + 40 + (extra.x * headScale) + (extra.radius * headScale * 0.8)},${headSize/2 + 50 + (extra.y * headScale) - (extra.radius * headScale * 0.5)}`}
                    fill={extra.color}
                    transform={`rotate(${extra.x < 0 ? 15 : -15}, ${headSize/2 + 40 + (extra.x * headScale)}, ${headSize/2 + 50 + (extra.y * headScale)})`}
                  />
                ) : (
                  <circle
                    key={`head-${i}`}
                    cx={headSize/2 + 40 + (extra.x * headScale)}
                    cy={headSize/2 + 50 + (extra.y * headScale)}
                    r={extra.radius * headScale}
                    fill={extra.color}
                  />
                )
              ) : null
            ))}
          </svg>
        )}

        <div className={headClasses} style={{...headStyle, position: 'relative', zIndex: 1}}>
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
      </div>
    );
  };

  const renderBubble = () => renderHead();

  const renderSquare = () => {
    const bodyScale = characterSize / 100;
    const skin = applySkin(selectedSkin);

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
          {/* Pattern definitions for textures */}
          <defs>
            {selectedSkin === 'lumberjack' && (
              <pattern id="plaid-pattern" patternUnits="userSpaceOnUse" width="8" height="8">
                <rect width="8" height="8" fill={skin.colors.torso}/>
                <rect x="0" y="0" width="4" height="8" fill={skin.colors.torsoStroke}/>
                <rect x="0" y="0" width="8" height="4" fill={skin.colors.torsoStroke}/>
              </pattern>
            )}
            {selectedSkin === 'robot' && (
              <pattern id="circuit-pattern" patternUnits="userSpaceOnUse" width="6" height="6">
                <rect width="6" height="6" fill={skin.colors.torso}/>
                <line x1="1" y1="2" x2="5" y2="2" stroke="#00FF88" strokeWidth="0.3"/>
                <line x1="1" y1="4" x2="5" y2="4" stroke="#00FF88" strokeWidth="0.3"/>
                <circle cx="3" cy="2" r="0.5" fill="#00FF88"/>
              </pattern>
            )}
          </defs>

          <g className="square-torso">
            {/* Main torso with skin-specific styling */}
            <rect
              x="35"
              y="50"
              width="50"
              height="60"
              fill={selectedSkin === 'lumberjack' ? 'url(#plaid-pattern)' :
                    selectedSkin === 'robot' ? 'url(#circuit-pattern)' :
                    skin.colors.torso}
              stroke={skin.colors.torsoStroke}
              strokeWidth="2"
            />

            {/* Torso detail lines - varies by skin */}
            {selectedSkin !== 'ninja' && (
              <>
                <rect x="37" y="52" width="46" height="4" fill={skin.colors.torsoDetail} />
                <rect x="37" y="58" width="46" height="2" fill={skin.colors.torsoDetail} />
              </>
            )}

            {/* Skin-specific extras on torso */}
            {skin.extras?.torso?.map((extra, i) => (
              <g key={i}>
                {extra.type === 'rect' && (
                  <rect x={extra.x} y={extra.y} width={extra.width} height={extra.height} fill={extra.color} />
                )}
                {extra.type === 'circle' && (
                  <circle cx={extra.x} cy={extra.y} r={extra.radius} fill={extra.color} />
                )}
                {extra.type === 'cross' && (
                  <>
                    <rect x={extra.x + extra.width/2 - 1} y={extra.y} width="2" height={extra.height} fill={extra.color}/>
                    <rect x={extra.x} y={extra.y + extra.height/2 - 1} width={extra.width} height="2" fill={extra.color}/>
                  </>
                )}
              </g>
            ))}
          </g>

          {/* Left arm with individual styling */}
          <rect
            ref={leftArmRef}
            x="15"
            y="55"
            width="18"
            height="35"
            fill={skin.colors.leftArm}
            stroke={skin.colors.armStroke}
            strokeWidth="2"
            transform="rotate(-10, 33, 55)"
          />

          {/* Left arm extras */}
          {skin.extras?.leftArm?.map((extra, i) => (
            <g key={`left-${i}`} transform="rotate(-10, 33, 55)">
              {extra.type === 'circle' && (
                <circle cx={extra.x} cy={extra.y} r={extra.radius} fill={extra.color} />
              )}
            </g>
          ))}

          {/* Right arm with potentially different styling */}
          <rect
            ref={rightArmRef}
            x="87"
            y="55"
            width="18"
            height="35"
            fill={skin.colors.rightArm}
            stroke={selectedSkin === 'lumberjack' ? '#8B4513' : skin.colors.armStroke}
            strokeWidth="2"
            transform="rotate(10, 87, 55)"
          />

          {/* Legs with skin-specific styling */}
          <g className="square-legs">
            <rect
              x="42"
              y="110"
              width="15"
              height="40"
              fill={skin.colors.legs}
              stroke={skin.colors.legStroke}
              strokeWidth="2"
            />
            <rect
              x="63"
              y="110"
              width="15"
              height="40"
              fill={skin.colors.legs}
              stroke={skin.colors.legStroke}
              strokeWidth="2"
            />

            {/* Leg details - varies by skin */}
            {selectedSkin !== 'ninja' && (
              <>
                <rect x="44" y="112" width="11" height="3" fill={skin.colors.legDetail} />
                <rect x="65" y="112" width="11" height="3" fill={skin.colors.legDetail} />
              </>
            )}

            {/* Special leg features for certain skins */}
            {selectedSkin === 'knight' && (
              <>
                {/* Chain mail texture simulation */}
                <rect x="44" y="120" width="11" height="1" fill="#C0C0C0" />
                <rect x="65" y="120" width="11" height="1" fill="#C0C0C0" />
                <rect x="44" y="130" width="11" height="1" fill="#C0C0C0" />
                <rect x="65" y="130" width="11" height="1" fill="#C0C0C0" />
              </>
            )}
          </g>
        </svg>
      </>
    );
  };

  const renderCharacter = () => {
    const bodyScale = characterSize / 100;
    const skin = applyCharacterSkin(selectedSkin);

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
          {/* Gradient definitions for special skins */}
          <defs>
            {skin.gradient && (
              <>
                <linearGradient id="body-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={skin.colors.body} />
                  <stop offset="100%" stopColor={skin.colors.headBackground} />
                </linearGradient>
                <linearGradient id="arm-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={skin.colors.leftArm} />
                  <stop offset="100%" stopColor={skin.colors.body} />
                </linearGradient>
              </>
            )}
          </defs>

          <g className="torso">
            <rect
              x="40"
              y="50"
              width="20"
              height="30"
              fill={skin.gradient ? 'url(#body-gradient)' : skin.colors.body}
              rx="2"
            />

            {/* Render skin-specific body effects */}
            {skin.extras?.body?.map((extra, i) => (
              <g key={i} dangerouslySetInnerHTML={{
                __html: renderCharacterEffect(extra, 40, 50, 20, 30)
              }} />
            ))}
          </g>

          <line
            ref={leftArmRef}
            className="left-arm"
            x1="40"
            y1="55"
            x2="15"
            y2="55"
            stroke={skin.gradient ? 'url(#arm-gradient)' : skin.colors.leftArm}
            strokeWidth="4"
            strokeLinecap="round"
            transform="rotate(-45, 40, 55)"
          />

          {/* Left arm extras */}
          {skin.extras?.leftArm?.map((extra, i) => (
            <g key={`left-arm-${i}`} dangerouslySetInnerHTML={{
              __html: renderCharacterEffect(extra, 15, 55, 25, 10)
            }} />
          ))}

          <line
            ref={rightArmRef}
            className="right-arm"
            x1="60"
            y1="55"
            x2="85"
            y2="55"
            stroke={skin.gradient ? 'url(#arm-gradient)' : skin.colors.rightArm}
            strokeWidth="4"
            strokeLinecap="round"
            transform="rotate(45, 60, 55)"
          />

          {/* Right arm extras */}
          {skin.extras?.rightArm?.map((extra, i) => (
            <g key={`right-arm-${i}`} dangerouslySetInnerHTML={{
              __html: renderCharacterEffect(extra, 60, 55, 25, 10)
            }} />
          ))}

          <g className="legs">
            <rect
              x="42"
              y="80"
              width="6"
              height={selectedSkin === 'bumblebee' ? "12" : "20"}
              fill={skin.colors.legs}
              rx="2"
            />
            <rect
              x="52"
              y="80"
              width="6"
              height={selectedSkin === 'bumblebee' ? "12" : "20"}
              fill={skin.colors.legs}
              rx="2"
            />

            {/* Leg extras */}
            {skin.extras?.legs?.map((extra, i) => (
              <g key={`legs-${i}`} dangerouslySetInnerHTML={{
                __html: renderCharacterEffect(extra, 42, 80, 16, selectedSkin === 'bumblebee' ? 12 : 20)
              }} />
            ))}
          </g>

          {/* Wings - only for bumblebee */}
          {selectedSkin === 'bumblebee' && skin.extras?.wings && (
            <g className="wings" style={{ zIndex: -1 }}>
              {skin.extras.wings.map((wing, i) => (
                <g key={`wing-${i}`} dangerouslySetInnerHTML={{
                  __html: renderCharacterEffect(wing, 0, 0, 0, 0)
                }} />
              ))}
            </g>
          )}

          {/* Feet - only for Mickey */}
          {selectedSkin === 'mickey' && (
            <g className="feet">
              <ellipse
                cx="45"
                cy="102"
                rx="6"
                ry="3"
                fill="#8B4513"
              />
              <ellipse
                cx="55"
                cy="102"
                rx="6"
                ry="3"
                fill="#8B4513"
              />
            </g>
          )}

          {/* Tail - only for cat */}
          {selectedSkin === 'cat' && skin.extras?.tail && (
            <g className="tail">
              {skin.extras.tail.map((tailPart, i) => (
                <g key={`tail-${i}`} dangerouslySetInnerHTML={{
                  __html: renderCharacterEffect(tailPart, 0, 0, 0, 0)
                }} />
              ))}
            </g>
          )}
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