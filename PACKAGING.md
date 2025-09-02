# Packaging Sideo

This document explains how to build and package Sideo for distribution.

## Prerequisites

1. **Node.js** (v18 or later)
2. **FFmpeg Binary** - Required for bundling
3. **Windows 10/11** - For Windows builds

## Quick Start

### 1. Prepare FFmpeg Binary

Before building, you need to download FFmpeg:

```bash
cd assets/ffmpeg
download-ffmpeg.bat
```

Or manually place `ffmpeg.exe` in `assets/ffmpeg/`

### 2. Build Application

```bash
# Install dependencies
npm install

# Build the application
npm run build
```

### 3. Package Distribution

Choose your packaging option:

```bash
# Create both installer and portable versions
npm run pack:all

# Create only installer (.exe)
npm run pack:installer

# Create only portable (.zip)
npm run pack:portable

# Create all Windows variants
npm run pack:win
```

## Build Outputs

Builds are created in the `release/` directory:

- **Installer**: `Sideo Setup 0.1.0.exe` - Full installer with shortcuts
- **Portable**: `Sideo-0.1.0-win.zip` - Portable version

## Build Configuration

Build settings are defined in `package.json` under the `build` section:

- **App ID**: `com.sideo.app`
- **Target**: Windows x64
- **Installer**: NSIS-based
- **Portable**: ZIP archive

## Troubleshooting

### FFmpeg Not Found

If you get an error about missing FFmpeg:

1. Check `assets/ffmpeg/ffmpeg.exe` exists
2. Run the requirement check: `npm run check:build`
3. Download FFmpeg manually if the script fails

### Build Fails

1. Clear build cache: `rm -rf dist/ release/`
2. Reinstall dependencies: `rm -rf node_modules/ && npm install`
3. Check Node.js version: `node --version`

### Icon Issues

If the app icon doesn't appear correctly:

1. Ensure `assets/icon.png` exists
2. Icon should be 256x256 pixels
3. For production, convert to ICO format

## Distribution

### Security

- Code signing is not configured (for production, add code signing certificates)
- Antivirus software may flag unsigned executables

### Requirements

Packaged applications require:
- Windows 10/11 x64
- No additional runtime dependencies (FFmpeg is bundled)

### Installation

- **Installer**: Runs installation wizard, creates shortcuts
- **Portable**: Extract and run `Sideo.exe` directly

## Advanced Configuration

### Custom FFmpeg Build

To use a custom FFmpeg build:

1. Replace `assets/ffmpeg/ffmpeg.exe`
2. Update licenses in `assets/licenses/`
3. Rebuild: `npm run pack:all`

### Icon Customization

1. Replace `assets/icon.png` (256x256)
2. For ICO format: Convert PNG to ICO with multiple sizes
3. Update `package.json` build.win.icon path

### Installer Options

Modify NSIS options in `package.json`:

```json
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true
}
```

## CI/CD Integration

For automated builds:

```bash
# In CI pipeline
npm ci
npm run check:build
npm run pack:all
```

Note: Ensure FFmpeg binary is available in CI environment.