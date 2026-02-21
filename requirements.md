# GamiRecorder (MVP)

## Objective
A gamified screen recording tool for "Build in Public" creators. It features a floating, keyboard-controllable avatar frame that embeds the user's webcam, allowing for interactive and eye-catching presentations.

## 1. Technical Stack

- **Framework:** Electron (Required for "Always on Top" and cross-window functionality)
- **Frontend:** React + Tailwind CSS
- **Animation:** Framer Motion (For smooth arm/leg movements)
- **Recording API:** desktopCapturer (Electron) + MediaRecorder API
- **Communication:** Inter-Process Communication (IPC) for global shortcuts

## 2. Core Feature Requirements (MVP)

### A. The "Character" Overlay (Floating Window)

**Always on Top:** The webcam frame must float above all other apps (VS Code, Chrome, etc.).

**Visual Structure:**
- **Head:** A circular mask containing the live webcam feed
- **Body:** A minimalist, slim 2D body (SVG-based) attached below the head
- **Limbs:** Two arms (left/right) that can be triggered by keys

**Movement (Gamified):**
- Use Arrow Keys (Up, Down, Left, Right) to move the character window across the screen
- **Animation:** Implement a slight "bobbing" or "waddle" effect when moving to simulate walking

### B. Interactive Actions

**Pointing/Gestures:**
- **Z Key:** Raise Left Arm (Pointing up/sideways)
- **X Key:** Raise Right Arm
- **Toggle UI:** A shortcut to hide/show the main control panel so it doesn't appear in the final recording

### C. Recording Engine

- **Source:** Capture the entire primary display
- **Resolution:** Standard HD (720p/1080p) default for MVP
- **Format:** Export immediately as .mp4 to local storage upon stopping
- **Countdown:** A clear 3-second visual countdown before recording starts

## 3. UI/UX Specifications

**Minimalist Control Panel:** A small, sleek window with:
- Start/Stop Toggle
- Skin Selection (Simple toggle between 2-3 minimalist SVG styles)
- Mic Toggle

**Transparency:** The area around the character must be transparent and support "click-through" so the user can still click buttons in the apps behind the character.

## 4. Implementation Details for AI Agent

### Window Configuration (Electron)

```javascript
// Main Process Hint
const characterWindow = new BrowserWindow({
  transparent: true,
  frame: false,
  alwaysOnTop: true,
  hasShadow: false,
  webPreferences: { nodeIntegration: true }
});
characterWindow.setIgnoreMouseEvents(true, { forward: true }); // Enable click-through
```

### Avatar Logic (React)

- **Component:** Avatar.jsx
- **Style:** Use a slim, stick-figure aesthetic to avoid distracting from the content
- **Motion:** Use AnimatePresence from Framer Motion for the arm transitions

## 5. Development Roadmap (The "Prompts" to use)

1. **Phase 1:** Set up Electron + React boilerplate with a transparent, "always-on-top" circular webcam window
2. **Phase 2:** Implement keydown listeners to update window coordinates (x, y) for movement
3. **Phase 3:** Create the SVG body skeleton and link Z/X keys to arm rotation animations
4. **Phase 4:** Integrate desktopCapturer to record the screen and save the buffer as an MP4 file
