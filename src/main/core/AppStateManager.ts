import { EventEmitter } from 'events';
import { AppState, RecordingSession, AudioDevice, VideoCapability } from '../types';
import { ConfigManager } from '../config/ConfigManager';

/**
 * Events emitted by AppStateManager
 */
export enum AppStateEvent {
  RECORDING_STARTED = 'recording-started',
  RECORDING_STOPPED = 'recording-stopped',
  RECORDING_ERROR = 'recording-error',
  RECORDING_PROGRESS = 'recording-progress',
  CONFIG_CHANGED = 'config-changed',
  CONFIG_UPDATED = 'config-updated',
  PROFILE_CHANGED = 'profile-changed',
  DEVICES_UPDATED = 'devices-updated',
  APP_STATE_CHANGED = 'app-state-changed'
}

/**
 * Centralized application state management
 * Handles recording state, configuration, and device management
 */
export class AppStateManager extends EventEmitter {
  private state: AppState;
  private configManager: ConfigManager;
  private recordingStartTime?: Date;
  private recordingTimer?: NodeJS.Timeout;

  constructor(configManager: ConfigManager) {
    super();
    this.configManager = configManager;
    
    // Initialize state
    this.state = {
      isRecording: false,
      recordingSession: undefined,
      activeProfile: configManager.getActiveProfile(),
      audioDevices: [],
      videoCapabilities: [],
      config: configManager.getConfig()
    };
  }

  /**
   * Get current application state
   */
  getState(): AppState {
    return { ...this.state };
  }

  /**
   * Recording state management
   */
  startRecording(outputPath: string): boolean {
    try {
      if (this.state.isRecording) {
        throw new Error('Recording is already in progress');
      }

      // Create new recording session
      const session: RecordingSession = {
        id: Date.now().toString(),
        start_time: new Date(),
        profile: this.state.activeProfile,
        output_path: outputPath,
        status: 'recording'
      };

      // Update state
      this.state.isRecording = true;
      this.state.recordingSession = session;
      this.recordingStartTime = new Date();

      // Start recording timer for progress updates
      this.startRecordingTimer();

      // Save session to config
      this.configManager.addRecordingSession(session);

      // Emit events
      this.emit(AppStateEvent.RECORDING_STARTED, session);
      this.emit(AppStateEvent.APP_STATE_CHANGED, this.state);

      console.log('AppStateManager: Recording started', session.id);
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.emit(AppStateEvent.RECORDING_ERROR, error);
      return false;
    }
  }

  stopRecording(): boolean {
    try {
      if (!this.state.isRecording || !this.state.recordingSession) {
        throw new Error('No recording in progress');
      }

      // Stop the timer
      this.stopRecordingTimer();

      // Update session
      const session = this.state.recordingSession;
      session.end_time = new Date();
      session.status = 'stopped';
      
      if (this.recordingStartTime) {
        session.duration_seconds = Math.floor(
          (session.end_time.getTime() - this.recordingStartTime.getTime()) / 1000
        );
      }

      // Update state
      this.state.isRecording = false;
      
      // Update session in config
      this.configManager.updateRecordingSession(session.id, {
        end_time: session.end_time,
        status: session.status,
        duration_seconds: session.duration_seconds
      });

      // Emit events
      this.emit(AppStateEvent.RECORDING_STOPPED, session);
      this.emit(AppStateEvent.APP_STATE_CHANGED, this.state);

      // Clear session after emitting events
      this.state.recordingSession = undefined;
      this.recordingStartTime = undefined;

      return true;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.emit(AppStateEvent.RECORDING_ERROR, error);
      return false;
    }
  }

  recordingError(error: string): void {
    if (this.state.recordingSession) {
      this.state.recordingSession.status = 'error';
      this.state.recordingSession.error_message = error;
      this.state.recordingSession.end_time = new Date();
      
      // Update in config
      this.configManager.updateRecordingSession(this.state.recordingSession.id, {
        status: 'error',
        error_message: error,
        end_time: this.state.recordingSession.end_time
      });
    }

    this.state.isRecording = false;
    this.stopRecordingTimer();

    this.emit(AppStateEvent.RECORDING_ERROR, error);
    this.emit(AppStateEvent.APP_STATE_CHANGED, this.state);

    this.state.recordingSession = undefined;
    this.recordingStartTime = undefined;
  }

  /**
   * Configuration management
   */
  updateConfig(partialConfig: Partial<AppState['config']>): boolean {
    const success = this.configManager.updateConfig(partialConfig);
    if (success) {
      this.state.config = this.configManager.getConfig();
      this.emit(AppStateEvent.CONFIG_CHANGED, this.state.config);
      this.emit(AppStateEvent.APP_STATE_CHANGED, this.state);
    }
    return success;
  }

  /**
   * Profile management
   */
  getActiveProfile(): string {
    return this.state.activeProfile;
  }

  setActiveProfile(profileId: string): boolean {
    const success = this.configManager.setActiveProfile(profileId);
    if (success) {
      this.state.activeProfile = profileId;
      this.emit(AppStateEvent.PROFILE_CHANGED, profileId);
      this.emit(AppStateEvent.APP_STATE_CHANGED, this.state);
    }
    return success;
  }

  getActiveProfileData() {
    return this.configManager.getProfile(this.state.activeProfile);
  }

  /**
   * Device management
   */
  updateAudioDevices(devices: AudioDevice[]): void {
    this.state.audioDevices = devices;
    this.emit(AppStateEvent.DEVICES_UPDATED, { audio: devices });
    this.emit(AppStateEvent.APP_STATE_CHANGED, this.state);
  }

  updateVideoCapabilities(capabilities: VideoCapability[]): void {
    this.state.videoCapabilities = capabilities;
    this.emit(AppStateEvent.DEVICES_UPDATED, { video: capabilities });
    this.emit(AppStateEvent.APP_STATE_CHANGED, this.state);
  }

  /**
   * Session information
   */
  getCurrentSession(): RecordingSession | undefined {
    return this.state.recordingSession;
  }

  getRecordingDuration(): number {
    if (!this.recordingStartTime) return 0;
    return Math.floor((Date.now() - this.recordingStartTime.getTime()) / 1000);
  }

  getRecordingSessions(): RecordingSession[] {
    return this.configManager.getRecordingSessions();
  }

  /**
   * Utility methods
   */
  isRecording(): boolean {
    return this.state.isRecording;
  }

  canStartRecording(): boolean {
    return !this.state.isRecording && 
           this.state.audioDevices.length > 0 && 
           this.state.videoCapabilities.length > 0;
  }

  getOutputPath(): string {
    const config = this.state.config;
    const profile = this.getActiveProfileData();
    const now = new Date();
    
    let filename = config.output.filename_template;
    filename = filename.replace('{date}', now.toISOString().split('T')[0]);
    filename = filename.replace('{time}', now.toTimeString().split(' ')[0].replace(/:/g, '-'));
    filename = filename.replace('{profile}', profile?.name || this.state.activeProfile);
    
    return `${config.output.folder}\\${filename}.${config.output.container}`;
  }

  /**
   * Private helper methods
   */
  private startRecordingTimer(): void {
    this.recordingTimer = setInterval(() => {
      if (this.state.recordingSession && this.recordingStartTime) {
        const duration = this.getRecordingDuration();
        this.emit(AppStateEvent.RECORDING_PROGRESS, {
          sessionId: this.state.recordingSession.id,
          duration,
          isRecording: this.state.isRecording
        });
      }
    }, 1000); // Update every second
  }

  private stopRecordingTimer(): void {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = undefined;
    }
  }

  /**
   * Cleanup on app exit
   */
  destroy(): void {
    this.stopRecordingTimer();
    this.removeAllListeners();
  }
}