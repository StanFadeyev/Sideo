# Sideo - Screen Recording Application

**Open-source, free screen and audio recording application for Windows 11**

Sideo is a lightweight, offline screen recording application designed to provide silent recording capabilities that remain undetected during video calls. It serves as an optimized wrapper around FFmpeg, designed for reliable operation on low-end hardware while maintaining professional recording quality.

## 🎯 Core Objectives

- **Offline Operation**: No internet connectivity required
- **Silent Recording**: Undetectable during video calls 
- **Local Storage**: All recordings saved to configurable local paths
- **Performance Optimized**: Designed for low-resource systems
- **Reliability First**: MKV default format with optional MP4 post-processing

## ✨ Features

### Current (MVP - Version 0.1.0)
- 🎥 **Screen Recording**: Full desktop, region, or specific window capture
- 🎵 **Audio Capture**: System audio, microphone, or mixed sources
- 🎛️ **Quality Profiles**: Low/Medium/High presets optimized for different hardware
- ⚙️ **Hardware Acceleration**: Automatic detection of NVIDIA/Intel/AMD encoders
- 📁 **Flexible Output**: Configurable output paths and file naming
- 🔥 **System Tray**: Minimal, non-intrusive interface
- ⌨️ **Global Hotkeys**: Quick start/stop recording
- 🛡️ **Safety Controls**: Disk space monitoring, duration limits
- 📂 **Segmentation**: Split long recordings into manageable files

### Planned (Version 0.2.0)
- 🤖 **AI Transcription**: Local speech-to-text using Whisper.cpp
- 📝 **Content Summarization**: Generate summaries using local LLMs
- 🔒 **Full Privacy**: All AI processing happens offline

## 🛠 Technology Stack

- **Framework**: Electron with TypeScript
- **Frontend**: React 18.2.0 with TypeScript 5.2.2
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 3.4+ with PostCSS
- **Icons**: Lucide React
- **Video Processing**: FFmpeg (external binary)
- **Audio Processing**: DirectShow (Windows)
- **Configuration**: electron-store (JSON-based)
- **Build System**: Vite 4.4.9 + electron-builder 24.6.4
- **Testing**: Jest 29.7.0 with ts-jest
- **Linting**: ESLint 8.49.0 with TypeScript ESLint

### UI Architecture

**shadcn/ui Integration**: The project uses shadcn/ui as the primary component library, providing:
- Accessible, unstyled UI primitives from Radix UI
- Consistent design system with Tailwind CSS
- Dark mode support (configurable)
- Professional, modern interface components
- Type-safe component props with TypeScript

**Key UI Components**:
- `Button`, `Card`, `Badge` - Core interface elements
- `Tabs`, `Select`, `Switch` - Settings interface
- `Dialog`, `Tooltip`, `Progress` - Interactive elements
- `Label`, `Input`, `Checkbox` - Form controls

## 🏗 Project Structure

```
Sideo/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # Application entry point
│   │   └── preload.ts     # Secure IPC bridge
│   └── renderer/          # React frontend
│       ├── src/
│       │   ├── components/    # React components
│       │   │   ├── ui/        # shadcn/ui components
│       │   │   └── tabs/      # Settings tabs
│       │   ├── lib/           # Utilities & helpers
│       │   └── App.tsx       # Main application
│       └── index.html
├── assets/                # Icons and resources
├── scripts/               # Build and utility scripts
├── dist/                  # Compiled output
├── release/               # Distribution packages
├── tailwind.config.js     # Tailwind CSS configuration
├── components.json        # shadcn/ui configuration
└── postcss.config.js      # PostCSS configuration
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ 
- **Windows 11** (primary target)
- **FFmpeg** binary (auto-detected or manually configured)

### Installation for Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sideo.git
   cd sideo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Build for production**
   ```bash
   npm run build
   npm run electron:dist
   ```

### FFmpeg Setup
Sideo requires FFmpeg for video processing. You can:

1. **Download from official site**: Place `ffmpeg.exe` in `C:\ffmpeg\bin\`
2. **Use package manager**: `winget install ffmpeg`
3. **Configure path**: Set custom path in Advanced Settings

## ⚙️ Configuration

Settings are stored in JSON format at:
```
%APPDATA%\Sideo\config.json
```

### Quality Profiles

| Profile | Resolution | FPS | Video Bitrate | Audio Bitrate | Use Case |
|---------|------------|-----|---------------|---------------|----------|
| Low     | 1280x720   | 24  | 4 Mbps        | 128 kbps      | Weak PCs |
| Medium  | 1920x1080  | 30  | 8 Mbps        | 160 kbps      | Recommended |
| High    | 1920x1080  | 60  | 12 Mbps       | 192 kbps      | Best Quality |

### Hardware Encoder Priority
1. **NVIDIA**: `h264_nvenc` (CUDA)
2. **Intel**: `h264_qsv` (Quick Sync)
3. **AMD**: `h264_amf` (AMF)
4. **Fallback**: `libx264` (CPU)

## 🎮 Usage

### Quick Start
1. Launch Sideo (starts in system tray)
2. Right-click tray icon → "Start Recording"
3. Or press **Ctrl+Alt+R** hotkey
4. Record your content
5. Press hotkey again or tray menu to stop

### System Tray Menu
```
┌─ Sideo ─────────────────┐
├─ ● Start Recording      │
├─ ■ Stop Recording       │
├─ ─────────────────────  │
├─ Profile: Medium ▸      │
├─ ─────────────────────  │
├─ ⚠ Transcribe Video    │ (disabled in v0.1)
├─ ⚠ Summarize Video     │ (disabled in v0.1)
├─ ─────────────────────  │
├─ Open Settings          │
├─ Open Recordings Folder │
├─ ─────────────────────  │
└─ Exit                   │
```

### Settings Window
- **General**: Output folder, file naming, hotkeys
- **Video**: Quality, encoder selection, region capture
- **Audio**: Device selection, mixing, quality
- **Profiles**: Quality preset management
- **AI Features**: Transcription and summarization (coming soon)
- **Advanced**: FFmpeg path, logging, safety limits

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Type checking
npm run type-check

# Linting
npm run lint
```

### Test Coverage
- Configuration management
- FFmpeg command building
- Device detection and validation
- Recording session management
- UI component functionality

## 📦 Distribution

### Portable Version
Self-contained executable with all dependencies included.

### Build Commands
```bash
# Development build
npm run build

# Portable package (recommended)
npm run electron:pack

# Alternative electron-builder (if code signing issues resolved)
npm run electron:pack-builder

# Check build requirements
npm run check:build

# Production release scripts
npm run build:release
npm run build:release:portable
npm run build:release:installer
```

### Build Notes
- The project includes workarounds for Windows symbolic link creation issues during packaging
- Code signing is disabled by default for development builds
- FFmpeg binary is automatically included in the portable package
- Build output is saved to the `release/` directory

### Troubleshooting

**Build Issues on Windows**:
- If you encounter "symbolic link creation" errors during packaging, use `npm run electron:pack` instead of electron-builder directly
- Ensure Windows Developer Mode is enabled for symbolic link support (optional)
- Clear electron-builder cache if builds fail: `Remove-Item -Path "$env:LOCALAPPDATA\electron-builder\Cache" -Recurse -Force`

**FFmpeg Not Found**:
- Download FFmpeg from [official site](https://ffmpeg.org/download.html)
- Place `ffmpeg.exe` in `C:\ffmpeg\bin\` or configure custom path in Advanced Settings
- Verify FFmpeg is accessible: `ffmpeg -version`

## 🛡 Privacy & Security

- **Offline First**: No internet connectivity required
- **Local Processing**: All recording and future AI features run locally
- **No Telemetry**: No usage data collection
- **Open Source**: Full transparency of functionality
- **Silent Mode**: Designed to be undetectable during video calls

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### UI Development
- Components use shadcn/ui with Tailwind CSS for styling
- Follow the existing component patterns in `src/renderer/src/components/`
- Use Lucide React for icons: `import { IconName } from 'lucide-react'`
- Maintain accessibility with Radix UI primitives
- Test components in both light and dark modes

### Reporting Issues
- Use GitHub Issues for bug reports
- Include system information and logs
- Provide steps to reproduce

## 📋 Roadmap

### Version 0.1.0 (Current) - Core Recording
- [x] Basic screen recording
- [x] Audio capture and mixing
- [x] Quality profiles
- [x] System tray interface
- [x] Settings management
- [x] shadcn/ui component integration
- [x] Tailwind CSS styling system
- [x] Build process optimization
- [ ] Hardware encoder detection
- [ ] Recording session management
- [ ] Performance monitoring

### Version 0.2.0 - AI Features
- [ ] Local speech transcription (Whisper.cpp)
- [ ] Content summarization (Local LLMs)
- [ ] Batch processing workflows
- [ ] Advanced export options

### Version 0.3.0 - Enhanced Features  
- [ ] Multi-monitor support
- [ ] Advanced region selection
- [ ] Live streaming capabilities
- [ ] Plugin system

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FFmpeg Team** - For the powerful video processing engine
- **Electron Team** - For the cross-platform framework
- **shadcn** - For the excellent UI component library
- **Radix UI Team** - For accessible, unstyled UI primitives
- **Tailwind CSS Team** - For the utility-first CSS framework
- **Lucide** - For the beautiful icon library
- **OpenAI Whisper** - For offline speech recognition
- **Open Source Community** - For inspiration and tools

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/yourusername/sideo/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/sideo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/sideo/discussions)

---

**Made with ❤️ for the open source community**

*Sideo - Silent, Reliable, Offline Screen Recording*