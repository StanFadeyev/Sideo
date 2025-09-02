import { app } from 'electron';
import { ConfigManager } from './config/ConfigManager';
import { AppStateManager } from './core/AppStateManager';
import { SafetyManager } from './core/SafetyManager';
import { FFmpegManager } from './ffmpeg/FFmpegManager';
import { DeviceManager } from './devices/DeviceManager';
import { UIManager } from './ui/UIManager';
import { RecordingEngine } from './recording/RecordingEngine';
import { QualityProfileManager } from './recording/QualityProfileManager';
import { RecordingSessionManager } from './recording/RecordingSessionManager';
import { EncoderCapabilityDetector } from './devices/EncoderCapabilityDetector';

/**
 * Sideo Application Main Process
 * Orchestrates all application components and services
 */
class SideoApp {
  private configManager: ConfigManager;
  private stateManager: AppStateManager;
  private safetyManager: SafetyManager;
  private ffmpegManager: FFmpegManager;
  private deviceManager: DeviceManager;
  private uiManager: UIManager;
  private recordingEngine: RecordingEngine;
  private qualityProfileManager: QualityProfileManager;
  private sessionManager: RecordingSessionManager;
  private encoderDetector: EncoderCapabilityDetector;

  constructor() {
    // Initialize core managers in dependency order
    this.configManager = new ConfigManager();
    this.stateManager = new AppStateManager(this.configManager);
    this.safetyManager = new SafetyManager(this.stateManager, this.configManager.getConfig().safety);
    this.ffmpegManager = new FFmpegManager();
    this.deviceManager = new DeviceManager(this.ffmpegManager);
    this.encoderDetector = new EncoderCapabilityDetector();
    
    // Initialize recording-related managers
    this.qualityProfileManager = new QualityProfileManager(
      this.configManager, 
      this.deviceManager, 
      this.encoderDetector
    );
    this.sessionManager = new RecordingSessionManager(this.configManager);
    this.recordingEngine = new RecordingEngine(
      this.ffmpegManager,
      this.deviceManager,
      this.stateManager,
      this.safetyManager,
      this.configManager
    );
    
    // Initialize UI manager last
    this.uiManager = new UIManager(this.configManager, this.stateManager, this.deviceManager);
    
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    try {
      console.log('Starting Sideo application...');
      
      // Wait for Electron app to be ready
      if (!app.isReady()) {
        await app.whenReady();
      }
      
      // Initialize core services in order
      console.log('Initializing core services...');
      
      // SafetyManager doesn't have an initialize method - it starts automatically in constructor
      console.log('Safety manager initialized');
      
      // Initialize FFmpeg manager
      const ffmpegSuccess = await this.ffmpegManager.initialize();
      if (!ffmpegSuccess) {
        console.warn('FFmpeg manager initialization failed - recording may not work');
      }
      
      // Initialize device manager
      const deviceSuccess = await this.deviceManager.initialize();
      if (!deviceSuccess) {
        console.warn('Device manager initialization failed - device detection may not work');
      }
      
      // Initialize recording engine
      const recordingSuccess = await this.recordingEngine.initialize();
      if (!recordingSuccess) {
        console.warn('Recording engine initialization failed - recording may not work');
      }
      
      // Initialize UI manager (tray, windows, hotkeys)
      const uiSuccess = await this.uiManager.initialize();
      if (!uiSuccess) {
        throw new Error('Failed to initialize UI manager');
      }
      
      // Setup app event handlers
      this.setupAppEventHandlers();
      
      // Setup cross-component event handling
      this.setupEventHandlers();
      
      console.log('Sideo application initialized successfully');
      
      // Show tray notification
      console.log('Sideo is running in the system tray. Use Ctrl+Alt+R to start recording.');
      
    } catch (error) {
      console.error('Failed to initialize Sideo application:', error);
      
      // Show error dialog and exit
      const { dialog } = require('electron');
      await dialog.showErrorBox('Initialization Error', `Failed to start Sideo: ${error}`);
      app.exit(1);
    }
  }

  /**
   * Setup cross-component event handling
   */
  private setupEventHandlers(): void {
    // The UI Manager handles most of the event coordination
    // Additional app-level event handling can be added here
    
    // Example: Use the recording components for demonstration
    console.log('Available profiles:', this.qualityProfileManager.getProfiles().length);
    console.log('Session manager ready:', !!this.sessionManager);
  }

  private setupAppEventHandlers(): void {
    app.on('window-all-closed', () => {
      // Keep app running in tray
    });

    app.on('activate', () => {
      // Don't create window on activate for tray app  
    });

    app.on('before-quit', () => {
      this.cleanup();
    });

    app.on('will-quit', () => {
      this.cleanup();
    });
  }

  /**
   * Get recording engine for external access
   */
  getRecordingEngine(): RecordingEngine {
    return this.recordingEngine;
  }

  /**
   * Get quality profile manager for external access
   */
  getQualityProfileManager(): QualityProfileManager {
    return this.qualityProfileManager;
  }

  /**
   * Get session manager for external access
   */
  getSessionManager(): RecordingSessionManager {
    return this.sessionManager;
  }

  /**
   * Cleanup resources on app exit
   */
  private cleanup(): void {
    console.log('Cleaning up application resources...');
    
    try {
      // Stop any ongoing recording
      if (this.stateManager.isRecording()) {
        this.stateManager.stopRecording();
      }
      
      // Cleanup managers in reverse order
      this.uiManager.cleanup();
      this.recordingEngine?.destroy();
      this.deviceManager?.destroy();
      this.ffmpegManager?.destroy();
      this.safetyManager?.destroy();
      this.stateManager?.destroy();
      
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
    
    console.log('Application cleanup completed');
  }
}

// Start the application
try {
  new SideoApp();
} catch (error) {
  console.error('Failed to start Sideo application:', error);
  process.exit(1);
}