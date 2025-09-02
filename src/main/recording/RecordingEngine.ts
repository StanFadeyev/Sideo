import { EventEmitter } from 'events';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { FFmpegManager } from '../ffmpeg/FFmpegManager';
// import { FFmpegCommandBuilder } from '../ffmpeg/FFmpegCommandBuilder'; // Reserved for future use
import { DeviceManager } from '../devices/DeviceManager';
import { AppStateManager, AppStateEvent } from '../core/AppStateManager';
import { SafetyManager } from '../core/SafetyManager';
import { ConfigManager } from '../config/ConfigManager';
import { RecordingSession, QualityProfile, AppConfig } from '../types';

/**
 * Recording Engine Events
 */
export enum RecordingEngineEvent {
  SESSION_STARTED = 'session-started',
  SESSION_STOPPED = 'session-stopped',
  SESSION_ERROR = 'session-error',
  SESSION_PROGRESS = 'session-progress',
  SEGMENT_CREATED = 'segment-created',
  QUALITY_CHANGED = 'quality-changed'
}

/**
 * Recording Configuration for a session
 */
export interface RecordingConfig {
  profile: QualityProfile;
  outputPath: string;
  segmentEnabled: boolean;
  segmentDuration: number; // minutes
  audioDevices: {
    systemDevice?: string;
    micDevice?: string;
    mixAudio: boolean;
  };
  videoSource: {
    type: 'desktop' | 'region' | 'window' | 'secondary';
    region?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    windowTitle?: string;
  };
}

/**
 * Recording Statistics
 */
export interface RecordingStats {
  duration: number; // seconds
  fileSize: number; // bytes
  frameRate: number;
  bitrate: number; // kbps
  droppedFrames: number;
  segmentCount: number;
}

/**
 * Recording Engine
 * Orchestrates the recording process using FFmpeg and device management
 */
export class RecordingEngine extends EventEmitter {
  private ffmpegManager: FFmpegManager;
  private deviceManager: DeviceManager;
  private stateManager: AppStateManager;
  private safetyManager: SafetyManager;
  private configManager: ConfigManager;
  
  private currentSession?: RecordingSession;
  private currentConfig?: RecordingConfig;
  private recordingStats: RecordingStats;
  private segmentTimer?: NodeJS.Timeout;
  private progressTimer?: NodeJS.Timeout;
  
  constructor(
    ffmpegManager: FFmpegManager,
    deviceManager: DeviceManager,
    stateManager: AppStateManager,
    safetyManager: SafetyManager,
    configManager: ConfigManager
  ) {
    super();
    
    this.ffmpegManager = ffmpegManager;
    this.deviceManager = deviceManager;
    this.stateManager = stateManager;
    this.safetyManager = safetyManager;
    this.configManager = configManager;
    
    this.recordingStats = this.initializeStats();
    
    this.setupEventListeners();
  }

  /**
   * Initialize recording engine
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing recording engine...');
      
      // Verify FFmpeg is available
      if (!this.ffmpegManager.isManagerInitialized()) {
        console.warn('FFmpeg manager not initialized');
        return false;
      }
      
      // Verify devices are available
      const audioDevices = this.deviceManager.getAudioDevices();
      if (audioDevices.length === 0) {
        console.warn('No audio devices detected');
      }
      
      console.log('Recording engine initialized successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to initialize recording engine:', error);
      return false;
    }
  }

  /**
   * Start a new recording session
   */
  async startRecording(outputPath?: string): Promise<boolean> {
    try {
      if (this.currentSession) {
        throw new Error('Recording already in progress');
      }
      
      // Check safety conditions
      const safetyCheck = this.safetyManager.canStartRecording();
      if (!safetyCheck.canStart) {
        throw new Error(safetyCheck.reason || 'Safety check failed');
      }
      
      // Build recording configuration
      const config = await this.buildRecordingConfig(outputPath);
      
      // Create recording session
      const session = this.createRecordingSession(config);
      
      // Ensure output directory exists
      this.ensureOutputDirectory(config.outputPath);
      
      // Build FFmpeg command
      // const command = this.buildFFmpegCommand(config);
      
      // Start FFmpeg process
      const appConfig = this.configManager.getConfig();
      const success = await this.ffmpegManager.startRecording(appConfig, config.profile, config.outputPath);
      if (!success) {
        throw new Error('Failed to start FFmpeg process');
      }
      
      // Update state
      this.currentSession = session;
      this.currentConfig = config;
      this.recordingStats = this.initializeStats();
      
      // Start monitoring
      this.startProgressMonitoring();
      this.startSegmentTimer(config);
      
      // Update application state
      this.stateManager.startRecording(config.outputPath);
      
      // Emit event
      this.emit(RecordingEngineEvent.SESSION_STARTED, session);
      
      console.log('Recording started successfully:', session.id);
      return true;
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.emit(RecordingEngineEvent.SESSION_ERROR, String(error));
      return false;
    }
  }

  /**
   * Stop current recording session
   */
  async stopRecording(): Promise<boolean> {
    try {
      if (!this.currentSession) {
        throw new Error('No recording in progress');
      }
      
      const session = this.currentSession;
      
      // Stop monitoring timers
      this.stopProgressMonitoring();
      this.stopSegmentTimer();
      
      // Stop FFmpeg process
      const success = await this.ffmpegManager.stopRecording();
      if (!success) {
        console.warn('FFmpeg stop may have failed, but continuing cleanup');
      }
      
      // Finalize session
      session.end_time = new Date();
      session.status = 'stopped';
      session.duration_seconds = Math.floor(
        (session.end_time.getTime() - session.start_time.getTime()) / 1000
      );
      
      // Update stats
      this.recordingStats.duration = session.duration_seconds;
      
      // Update configuration with session info
      this.configManager.updateRecordingSession(session.id, {
        end_time: session.end_time,
        status: session.status,
        duration_seconds: session.duration_seconds,
        file_size_bytes: this.recordingStats.fileSize
      });
      
      // Update application state
      this.stateManager.stopRecording();
      
      // Emit event
      this.emit(RecordingEngineEvent.SESSION_STOPPED, session);
      
      // Clean up
      this.currentSession = undefined;
      this.currentConfig = undefined;
      
      console.log('Recording stopped successfully:', session.id);
      return true;
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.emit(RecordingEngineEvent.SESSION_ERROR, String(error));
      return false;
    }
  }

  /**
   * Get current recording status
   */
  getRecordingStatus(): {
    isRecording: boolean;
    session?: RecordingSession;
    stats?: RecordingStats;
    config?: RecordingConfig;
  } {
    return {
      isRecording: !!this.currentSession,
      session: this.currentSession,
      stats: this.recordingStats,
      config: this.currentConfig
    };
  }

  /**
   * Switch quality profile during recording
   */
  async switchQualityProfile(profileId: string): Promise<boolean> {
    try {
      if (!this.currentSession || !this.currentConfig) {
        throw new Error('No recording in progress');
      }
      
      const newProfile = this.configManager.getProfile(profileId);
      if (!newProfile) {
        throw new Error(`Profile not found: ${profileId}`);
      }
      
      // For now, quality switching requires stopping and restarting
      // In a more advanced implementation, we could use FFmpeg's dynamic reconfiguration
      console.log('Quality profile switching requires restart for this version');
      
      // Update profile for next recording
      this.stateManager.setActiveProfile(profileId);
      this.emit(RecordingEngineEvent.QUALITY_CHANGED, newProfile);
      
      return true;
      
    } catch (error) {
      console.error('Failed to switch quality profile:', error);
      return false;
    }
  }

  /**
   * Create a new recording segment (for segmented recording)
   */
  private async createNewSegment(): Promise<boolean> {
    try {
      if (!this.currentSession || !this.currentConfig) {
        return false;
      }
      
      console.log('Creating new recording segment...');
      
      // For this implementation, we'll use FFmpeg's segment muxer
      // which handles segmentation automatically
      this.recordingStats.segmentCount++;
      
      this.emit(RecordingEngineEvent.SEGMENT_CREATED, {
        sessionId: this.currentSession.id,
        segmentNumber: this.recordingStats.segmentCount,
        timestamp: new Date()
      });
      
      return true;
      
    } catch (error) {
      console.error('Failed to create new segment:', error);
      return false;
    }
  }

  /**
   * Build recording configuration from current application state
   */
  private async buildRecordingConfig(outputPath?: string): Promise<RecordingConfig> {
    const appConfig = this.configManager.getConfig();
    const activeProfileId = this.stateManager.getActiveProfile();
    const profile = this.configManager.getProfile(activeProfileId);
    
    if (!profile) {
      throw new Error(`Active profile not found: ${activeProfileId}`);
    }
    
    // Generate output path if not provided
    const finalOutputPath = outputPath || this.generateOutputPath(appConfig, profile);
    
    // Get recommended audio devices
    const recommendedDevices = this.deviceManager.getRecommendedAudioDevices();
    
    return {
      profile,
      outputPath: finalOutputPath,
      segmentEnabled: appConfig.output.segment_enabled,
      segmentDuration: appConfig.output.segment_minutes,
      audioDevices: {
        systemDevice: appConfig.audio.system_device || recommendedDevices.systemAudio?.name,
        micDevice: appConfig.audio.mic_device || recommendedDevices.microphone?.name,
        mixAudio: appConfig.audio.mix_mic_with_system
      },
      videoSource: {
        type: appConfig.video.source === 'secondary' ? 'desktop' : appConfig.video.source,
        region: appConfig.video.region?.enabled ? {
          x: appConfig.video.region.offset_x,
          y: appConfig.video.region.offset_y,
          width: appConfig.video.region.width,
          height: appConfig.video.region.height
        } : undefined
      }
    };
  }

  /**
   * Create a new recording session object
   */
  private createRecordingSession(config: RecordingConfig): RecordingSession {
    const session: RecordingSession = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      start_time: new Date(),
      profile: config.profile.id,
      output_path: config.outputPath,
      status: 'recording'
    };
    
    // Add to configuration
    this.configManager.addRecordingSession(session);
    
    return session;
  }

  /**
   * Build FFmpeg command for recording
   * Note: Currently unused but kept for future reference
   */
  /*
  private buildFFmpegCommand(config: RecordingConfig): string[] {
    const appConfig = this.configManager.getConfig();
    
    // Create FFmpeg recording config
    const ffmpegConfig = {
      video: {
        source: config.videoSource.type,
        region: config.videoSource.region ? {
          offset_x: config.videoSource.region.x,
          offset_y: config.videoSource.region.y,
          width: config.videoSource.region.width,
          height: config.videoSource.region.height,
          enabled: true
        } : appConfig.video.region,
        fps: config.profile.video.fps,
        encoder_priority: config.profile.video.encoder_priority,
        bitrate_kbps: config.profile.video.bitrate_kbps,
        maxrate_kbps: appConfig.video.maxrate_kbps,
        bufsize_kbps: appConfig.video.bufsize_kbps,
        draw_mouse: appConfig.video.draw_mouse
      },
      audio: {
        system_device: config.audioDevices.systemDevice || '',
        mic_device: config.audioDevices.micDevice || '',
        enable_system_audio: !!config.audioDevices.systemDevice,
        enable_mic_audio: !!config.audioDevices.micDevice,
        mix_mic_with_system: config.audioDevices.mixAudio,
        aac_bitrate_kbps: config.profile.audio.bitrate_kbps,
        mic_volume: appConfig.audio.mic_volume,
        system_volume: appConfig.audio.system_volume
      },
      output: {
        folder: appConfig.output.folder,
        container: appConfig.output.container,
        filename_template: appConfig.output.filename_template,
        segment_enabled: config.segmentEnabled,
        segment_minutes: config.segmentDuration
      },
      outputPath: config.outputPath,
      profile: config.profile
    };
    
    const builder = new FFmpegCommandBuilder();
    return builder.buildRecordingCommand(ffmpegConfig);
  }
  */

  /**
   * Generate output file path
   */
  private generateOutputPath(config: AppConfig, profile: QualityProfile): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    let filename = config.output.filename_template;
    filename = filename.replace('{date}', dateStr);
    filename = filename.replace('{time}', timeStr);
    filename = filename.replace('{profile}', profile.name.replace(/\s+/g, '_'));
    
    const extension = config.output.container;
    return join(config.output.folder, `${filename}.${extension}`);
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDirectory(outputPath: string): void {
    const directory = join(outputPath, '..');
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }
  }

  /**
   * Initialize recording statistics
   */
  private initializeStats(): RecordingStats {
    return {
      duration: 0,
      fileSize: 0,
      frameRate: 0,
      bitrate: 0,
      droppedFrames: 0,
      segmentCount: 0
    };
  }

  /**
   * Start progress monitoring
   */
  private startProgressMonitoring(): void {
    this.progressTimer = setInterval(() => {
      this.updateRecordingStats();
    }, 1000); // Update every second
  }

  /**
   * Stop progress monitoring
   */
  private stopProgressMonitoring(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = undefined;
    }
  }

  /**
   * Start segment timer for segmented recording
   */
  private startSegmentTimer(config: RecordingConfig): void {
    if (!config.segmentEnabled) return;
    
    const segmentDurationMs = config.segmentDuration * 60 * 1000;
    this.segmentTimer = setInterval(() => {
      this.createNewSegment();
    }, segmentDurationMs);
  }

  /**
   * Stop segment timer
   */
  private stopSegmentTimer(): void {
    if (this.segmentTimer) {
      clearInterval(this.segmentTimer);
      this.segmentTimer = undefined;
    }
  }

  /**
   * Update recording statistics from FFmpeg progress
   */
  private updateRecordingStats(): void {
    if (!this.currentSession) return;
    
    const status = this.ffmpegManager.getRecordingStatus();
    const progress = status.progress;
    
    if (progress) {
      this.recordingStats.frameRate = progress.fps;
      this.recordingStats.duration = Math.floor(
        (Date.now() - this.currentSession.start_time.getTime()) / 1000
      );
      
      // Parse bitrate from progress
      const bitrateMatch = progress.bitrate.match(/(\d+(?:\.\d+)?)kbits\/s/);
      if (bitrateMatch) {
        this.recordingStats.bitrate = parseFloat(bitrateMatch[1]);
      }
    }
    
    this.emit(RecordingEngineEvent.SESSION_PROGRESS, {
      sessionId: this.currentSession.id,
      stats: this.recordingStats,
      timestamp: new Date()
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen to application state changes
    this.stateManager.on(AppStateEvent.PROFILE_CHANGED, (profileId: string) => {
      console.log('Active profile changed:', profileId);
    });
    
    // Listen to safety events
    this.safetyManager.on('auto-stop-triggered', (reason: string) => {
      console.log('Auto-stop triggered by safety manager:', reason);
      this.stopRecording();
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    console.log('Destroying recording engine...');
    
    // Stop any active recording
    if (this.currentSession) {
      this.stopRecording();
    }
    
    // Clean up timers
    this.stopProgressMonitoring();
    this.stopSegmentTimer();
    
    // Remove event listeners
    this.removeAllListeners();
    
    console.log('Recording engine destroyed');
  }
}