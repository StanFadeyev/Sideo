# Changelog

All notable changes to Sideo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Local AI transcription using Whisper.cpp
- Video summarization with local LLM
- Multi-monitor support improvements
- Custom hotkey configuration

### Changed
- Improved encoder detection reliability
- Better error messages and user feedback

### Fixed
- FFmpeg process cleanup on application exit
- Memory leaks in long recording sessions

## [0.1.0] - 2025-01-XX

### Added
- **Core Recording Engine**
  - Screen recording with FFmpeg integration
  - Audio capture from system and microphone
  - Hardware encoder detection (NVIDIA/Intel/AMD)
  - Quality profiles (Low/Medium/High)
  - Recording segmentation for long sessions

- **User Interface**
  - System tray interface with status indicators
  - Settings window with tabbed configuration
  - Global hotkeys (Ctrl+Alt+R)
  - Recording status notifications

- **Configuration Management**
  - JSON-based settings storage
  - User-configurable output paths
  - Custom FFmpeg path support
  - Safety controls (disk space, duration limits)

- **Device Management**
  - Audio device discovery via DirectShow
  - Hardware encoder capability detection
  - Automatic fallback to software encoding

- **Safety & Monitoring**
  - Disk space monitoring
  - Recording duration limits
  - Automatic process cleanup
  - Error recovery mechanisms

- **Testing & Quality**
  - Comprehensive unit test suite
  - Integration tests for recording pipeline
  - Performance and stress testing
  - Build automation and packaging

- **Distribution**
  - Windows installer (NSIS-based)
  - Portable ZIP distribution
  - FFmpeg bundling and dependency management
  - Code signing preparation

### Technical Details
- **Architecture**: Electron + React + TypeScript
- **Video Processing**: FFmpeg with DirectShow
- **Build System**: Vite + electron-builder
- **Testing**: Jest with ts-jest
- **Code Quality**: ESLint + TypeScript strict mode

### Known Issues
- Hardware encoder detection may fail on some systems
- Long recordings (>4 hours) may encounter memory issues
- Some antivirus software may flag unsigned executable

### System Requirements
- Windows 10/11 (64-bit)
- 4 GB RAM minimum (8 GB recommended)
- 500 MB storage for application
- FFmpeg binary (bundled or system-installed)

### Breaking Changes
- N/A (initial release)

---

## Version History Format

Each version entry should include:

### Added
- New features and capabilities

### Changed
- Changes to existing functionality

### Deprecated
- Features that will be removed in future versions

### Removed
- Features that have been removed

### Fixed
- Bug fixes and corrections

### Security
- Security-related improvements