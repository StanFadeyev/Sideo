# Packaging Configuration

This directory contains assets needed for building and distributing Sideo.

## Icons
- `icon.png` - Application icon (256x256)
- `icon.ico` - Windows icon file
- `tray-icon.png` - System tray icon (idle state)
- `tray-icon-recording.png` - System tray icon (recording state)

## Build Resources
- `ffmpeg/` - FFmpeg binaries for bundling
- `licenses/` - Third-party licenses

## Icon Requirements
For proper Windows packaging, icons should be:
- 256x256 PNG for electron-builder
- ICO format containing multiple sizes (16, 32, 48, 64, 128, 256)