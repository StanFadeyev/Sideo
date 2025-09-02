# Contributing to Sideo

Thank you for your interest in contributing to Sideo! We welcome contributions from the community to help make this screen recording application better for everyone.

## 🤝 How to Contribute

### Reporting Bugs

1. **Check existing issues** first to avoid duplicates
2. **Use the bug report template** when creating new issues
3. **Include system information**:
   - Windows version
   - Node.js version
   - FFmpeg version (if applicable)
   - Hardware specifications (GPU, RAM)
4. **Provide reproduction steps** with detailed descriptions
5. **Include logs** from the application if available

### Suggesting Features

1. **Check the roadmap** in README.md to see if it's already planned
2. **Open a discussion** before creating an issue for large features
3. **Describe the use case** and why it would be valuable
4. **Consider implementation complexity** and maintenance burden

### Code Contributions

#### Prerequisites

- Node.js 18+ installed
- Git configured with your GitHub account
- Familiarity with TypeScript, React, and Electron
- Understanding of FFmpeg basics (helpful but not required)

#### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sideo.git
   cd sideo
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

#### Development Guidelines

##### Code Style

- **TypeScript**: Use strict typing, avoid `any`
- **ESLint**: Zero warnings policy
- **Prettier**: Automatic formatting on save
- **Naming**: Use descriptive names, prefer verbose over cryptic

##### Architecture Principles

- **Separation of Concerns**: Keep main and renderer processes separate
- **Single Responsibility**: Each class/function should have one purpose
- **Dependency Injection**: Use constructor injection for testability
- **Error Handling**: Always handle errors gracefully with user feedback

##### File Organization

```
src/
├── main/                  # Electron main process
│   ├── core/             # Core business logic
│   ├── ffmpeg/           # FFmpeg integration
│   ├── devices/          # Device management
│   ├── recording/        # Recording engine
│   ├── ui/               # System UI (tray, hotkeys)
│   └── __tests__/        # Unit and integration tests
└── renderer/             # React frontend
    └── src/
        ├── components/   # Reusable UI components
        └── tabs/         # Settings page tabs
```

##### Testing Requirements

- **Unit Tests**: Required for all business logic
- **Integration Tests**: Required for complex workflows
- **Test Coverage**: Aim for >80% coverage
- **Test Naming**: Descriptive test names explaining what is being tested

Example test structure:
```typescript
describe('ConfigManager', () => {
  describe('updateConfig', () => {
    test('should merge partial configuration updates', () => {
      // Test implementation
    });
    
    test('should validate configuration before saving', () => {
      // Test implementation
    });
  });
});
```

#### Making Changes

1. **Write tests first** (TDD approach preferred)
2. **Implement your changes** following the style guide
3. **Run tests** to ensure nothing is broken:
   ```bash
   npm test
   npm run type-check
   npm run lint
   ```
4. **Test manually** by running the application:
   ```bash
   npm start
   ```
5. **Update documentation** if needed

#### Commit Guidelines

- **Use conventional commits**: `type(scope): description`
- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Keep commits focused**: One logical change per commit
- **Write descriptive messages**: Explain what and why, not how

Examples:
```
feat(recording): add support for custom region capture
fix(ffmpeg): resolve encoder detection on AMD GPUs
docs(readme): update installation instructions
test(config): add tests for profile management
```

#### Pull Request Process

1. **Update your branch** with the latest main:
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Create a pull request** with:
   - **Clear title** describing the change
   - **Detailed description** of what was changed and why
   - **Screenshots** for UI changes
   - **Testing instructions** for reviewers
   - **Breaking changes** clearly marked

3. **Review process**:
   - All tests must pass
   - Code review by maintainers
   - Address feedback promptly
   - Squash commits if requested

#### Code Review Guidelines

##### For Authors
- **Self-review** your code before submitting
- **Test thoroughly** on different scenarios
- **Document complex logic** with comments
- **Keep PRs focused** and reasonably sized

##### For Reviewers
- **Be constructive** and respectful
- **Focus on code quality**, not personal preferences
- **Test the changes** locally when possible
- **Approve promptly** when satisfied

## 🏗️ Development Areas

### High Priority
- **Performance Optimization**: Reduce memory usage and CPU overhead
- **Error Handling**: Better error messages and recovery mechanisms
- **Device Detection**: Improve hardware encoder detection reliability
- **Testing**: Increase test coverage, especially integration tests

### Medium Priority
- **UI/UX Improvements**: Better user experience and accessibility
- **Documentation**: More comprehensive guides and examples
- **Cross-platform**: Prepare for macOS and Linux support
- **Localization**: Multi-language support

### Advanced/Expert Level
- **FFmpeg Integration**: Advanced video processing features
- **AI Features**: Local transcription and summarization
- **Plugin System**: Extensibility framework
- **Performance Profiling**: Advanced optimization techniques

## 🐛 Debugging

### Local Development
```bash
# Enable debug mode
npm start -- --debug

# View Electron dev tools
# Press Ctrl+Shift+I in the application

# Check main process logs
# Available in terminal running npm start

# Check renderer process logs
# Available in Electron dev tools console
```

### Production Debugging
```bash
# Enable verbose logging
# Set environment variable: SIDEO_LOG_LEVEL=debug

# Check application logs
# Windows: %APPDATA%\Sideo\logs\
```

## 📖 Resources

### Documentation
- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)

### Tools
- [Electron DevTools](https://github.com/MarshallOfSound/electron-devtools-installer)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [FFmpeg Explorer](https://ffmpeg.guide/) - Interactive FFmpeg command builder

## 📞 Getting Help

- **GitHub Discussions**: General questions and ideas
- **GitHub Issues**: Bugs and specific technical problems
- **Code Review**: Ask for feedback during development

## 🏆 Recognition

Contributors will be:
- **Listed in CONTRIBUTORS.md** with their contributions
- **Mentioned in release notes** for significant contributions
- **Credited in documentation** for major features or improvements

## 📜 License

By contributing to Sideo, you agree that your contributions will be licensed under the same MIT License that covers the project.