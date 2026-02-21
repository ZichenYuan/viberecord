# GamiRecorder MVP

A gamified screen recording tool with a floating, keyboard-controllable avatar that embeds your webcam feed.

## Features

- 🎮 **Floating Character**: Always-on-top avatar with your webcam as the head
- ⌨️ **Simple Controls**: Arrow keys to move, Z/X for arm gestures
- 🎬 **Screen Recording**: Full screen capture with optional microphone
- 🎨 **Character Styles**: Choose between Basic, Robot, and Ninja styles
- 👻 **Transparent Overlay**: Click-through character that doesn't interfere with your work

## Installation

```bash
npm install
```

## Running the App

```bash
npm start
```

## Controls

- **Arrow Keys**: Move the character around the screen
- **Z**: Raise left arm
- **X**: Raise right arm
- **Cmd+Shift+H**: Hide/show control panel

## Building for Production

```bash
npm run build
npm run dist
```

## Tech Stack

- Electron
- React
- Framer Motion
- Webpack

## Notes

This is an MVP version. The recording saves as .webm format, which works in most modern browsers and video players.

### Converting WebM to MP4

If you need MP4 format, you can convert using ffmpeg:

```bash
# Install ffmpeg if you don't have it
brew install ffmpeg

# Convert WebM to MP4
ffmpeg -i your-recording.webm -c:v libx264 -c:a aac output.mp4

# For better quality/compression
ffmpeg -i your-recording.webm -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k output.mp4
```

WebM files work directly in:
- Chrome, Firefox, Edge browsers
- VLC Media Player
- QuickTime Player (on newer macOS versions)
- Most video editing software