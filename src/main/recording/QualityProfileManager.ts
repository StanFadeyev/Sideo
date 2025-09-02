import { EventEmitter } from 'events';
import { QualityProfile, VideoProfileConfig, AudioProfileConfig } from '../types';
import { ConfigManager } from '../config/ConfigManager';
import { DeviceManager } from '../devices/DeviceManager';
import { EncoderCapabilityDetector } from '../devices/EncoderCapabilityDetector';

/**
 * Quality Profile Events
 */
export enum QualityProfileEvent {
  PROFILE_CREATED = 'profile-created',
  PROFILE_UPDATED = 'profile-updated',
  PROFILE_DELETED = 'profile-deleted',
  PROFILE_OPTIMIZED = 'profile-optimized'
}

/**
 * Profile Performance Metrics
 */
export interface ProfilePerformance {
  profileId: string;
  estimatedCpuUsage: number; // percentage
  estimatedMemoryUsage: number; // MB
  estimatedFileSize: number; // MB per hour
  recommendedFor: string[]; // use cases
  hardwareRequirements: {
    minCpu: string;
    minRam: string;
    recommendedGpu?: string;
  };
}

/**
 * Profile Optimization Suggestions
 */
export interface OptimizationSuggestion {
  type: 'encoder' | 'bitrate' | 'framerate' | 'resolution';
  current: string | number;
  suggested: string | number;
  reason: string;
  impact: 'performance' | 'quality' | 'compatibility';
}

/**
 * Quality Profile Manager
 * Manages video quality profiles with intelligent optimization
 */
export class QualityProfileManager extends EventEmitter {
  private configManager: ConfigManager;
  // private _deviceManager: DeviceManager; // Reserved for future use
  private encoderDetector: EncoderCapabilityDetector;

  constructor(
    configManager: ConfigManager,
    _deviceManager: DeviceManager, // Reserved for future use
    encoderDetector: EncoderCapabilityDetector
  ) {
    super();
    this.configManager = configManager;
    // this._deviceManager = deviceManager; // Reserved for future use
    this.encoderDetector = encoderDetector;
  }

  /**
   * Get all available quality profiles
   */
  getProfiles(): QualityProfile[] {
    return this.configManager.getProfiles();
  }

  /**
   * Get a specific profile by ID
   */
  getProfile(id: string): QualityProfile | undefined {
    return this.configManager.getProfile(id);
  }

  /**
   * Create a new custom quality profile
   */
  createProfile(
    name: string,
    subtitle: string,
    videoConfig: VideoProfileConfig,
    audioConfig: AudioProfileConfig,
    description: string
  ): boolean {
    try {
      const profile: QualityProfile = {
        id: this.generateProfileId(name),
        name,
        subtitle,
        video: videoConfig,
        audio: audioConfig,
        description
      };

      // Validate profile configuration
      const validation = this.validateProfile(profile);
      if (!validation.isValid) {
        throw new Error(`Invalid profile: ${validation.errors.join(', ')}`);
      }

      // Optimize profile for current hardware
      const optimizedProfile = this.optimizeProfileForHardware(profile);

      // Save profile
      const success = this.configManager.saveProfile(optimizedProfile);
      if (success) {
        this.emit(QualityProfileEvent.PROFILE_CREATED, optimizedProfile);
        console.log('Quality profile created:', optimizedProfile.id);
      }

      return success;

    } catch (error) {
      console.error('Failed to create profile:', error);
      return false;
    }
  }

  /**
   * Update an existing quality profile
   */
  updateProfile(id: string, updates: Partial<QualityProfile>): boolean {
    try {
      const existingProfile = this.getProfile(id);
      if (!existingProfile) {
        throw new Error(`Profile not found: ${id}`);
      }

      // Merge updates
      const updatedProfile: QualityProfile = {
        ...existingProfile,
        ...updates,
        id // Ensure ID doesn't change
      };

      // Validate updated profile
      const validation = this.validateProfile(updatedProfile);
      if (!validation.isValid) {
        throw new Error(`Invalid profile update: ${validation.errors.join(', ')}`);
      }

      // Save updated profile
      const success = this.configManager.saveProfile(updatedProfile);
      if (success) {
        this.emit(QualityProfileEvent.PROFILE_UPDATED, updatedProfile);
        console.log('Quality profile updated:', id);
      }

      return success;

    } catch (error) {
      console.error('Failed to update profile:', error);
      return false;
    }
  }

  /**
   * Delete a quality profile
   */
  deleteProfile(id: string): boolean {
    try {
      // Prevent deletion of default profiles
      if (['low', 'medium', 'high'].includes(id)) {
        throw new Error('Cannot delete default profiles');
      }

      const success = this.configManager.deleteProfile(id);
      if (success) {
        this.emit(QualityProfileEvent.PROFILE_DELETED, id);
        console.log('Quality profile deleted:', id);
      }

      return success;

    } catch (error) {
      console.error('Failed to delete profile:', error);
      return false;
    }
  }

  /**
   * Get profile performance metrics
   */
  getProfilePerformance(profileId: string): ProfilePerformance | null {
    const profile = this.getProfile(profileId);
    if (!profile) return null;

    // Calculate estimated metrics based on profile settings
    const cpuUsage = this.estimateCpuUsage(profile);
    const memoryUsage = this.estimateMemoryUsage(profile);
    const fileSize = this.estimateFileSize(profile);

    return {
      profileId,
      estimatedCpuUsage: cpuUsage,
      estimatedMemoryUsage: memoryUsage,
      estimatedFileSize: fileSize,
      recommendedFor: this.getRecommendedUseCases(profile),
      hardwareRequirements: this.getHardwareRequirements(profile)
    };
  }

  /**
   * Get optimization suggestions for a profile
   */
  getOptimizationSuggestions(profileId: string): OptimizationSuggestion[] {
    const profile = this.getProfile(profileId);
    if (!profile) return [];

    const suggestions: OptimizationSuggestion[] = [];
    // const videoCapabilities = this.deviceManager.getVideoCapabilities();
    const encoderResults = this.encoderDetector.getTestResults();

    // Check encoder optimization
    const encoderSuggestion = this.suggestBetterEncoder(profile, encoderResults);
    if (encoderSuggestion) {
      suggestions.push(encoderSuggestion);
    }

    // Check bitrate optimization
    const bitrateSuggestion = this.suggestBetterBitrate(profile);
    if (bitrateSuggestion) {
      suggestions.push(bitrateSuggestion);
    }

    // Check framerate optimization
    const framerateSuggestion = this.suggestBetterFramerate(profile);
    if (framerateSuggestion) {
      suggestions.push(framerateSuggestion);
    }

    // Check resolution optimization
    const resolutionSuggestion = this.suggestBetterResolution(profile);
    if (resolutionSuggestion) {
      suggestions.push(resolutionSuggestion);
    }

    return suggestions;
  }

  /**
   * Auto-optimize a profile for current hardware
   */
  optimizeProfileForHardware(profile: QualityProfile): QualityProfile {
    const optimizedProfile = { ...profile };
    const suggestions = this.getOptimizationSuggestions(profile.id);

    // Apply performance-related suggestions
    for (const suggestion of suggestions) {
      if (suggestion.impact === 'performance') {
        switch (suggestion.type) {
          case 'encoder':
            if (typeof suggestion.suggested === 'string') {
              optimizedProfile.video.encoder_priority = [
                suggestion.suggested,
                ...optimizedProfile.video.encoder_priority.filter(e => e !== suggestion.suggested)
              ];
            }
            break;
          case 'bitrate':
            if (typeof suggestion.suggested === 'number') {
              optimizedProfile.video.bitrate_kbps = suggestion.suggested;
            }
            break;
          case 'framerate':
            if (typeof suggestion.suggested === 'number') {
              optimizedProfile.video.fps = suggestion.suggested;
            }
            break;
        }
      }
    }

    this.emit(QualityProfileEvent.PROFILE_OPTIMIZED, optimizedProfile);
    return optimizedProfile;
  }

  /**
   * Generate unique profile ID
   */
  private generateProfileId(name: string): string {
    const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const timestamp = Date.now().toString(36);
    return `${baseId}_${timestamp}`;
  }

  /**
   * Validate profile configuration
   */
  private validateProfile(profile: QualityProfile): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate basic fields
    if (!profile.name || profile.name.trim().length === 0) {
      errors.push('Profile name is required');
    }

    if (!profile.id || profile.id.trim().length === 0) {
      errors.push('Profile ID is required');
    }

    // Validate video configuration
    if (profile.video.bitrate_kbps <= 0 || profile.video.bitrate_kbps > 100000) {
      errors.push('Video bitrate must be between 1 and 100000 kbps');
    }

    if (profile.video.fps <= 0 || profile.video.fps > 120) {
      errors.push('Video framerate must be between 1 and 120 fps');
    }

    if (!profile.video.resolution || !this.isValidResolution(profile.video.resolution)) {
      errors.push('Invalid video resolution format');
    }

    if (!profile.video.encoder_priority || profile.video.encoder_priority.length === 0) {
      errors.push('At least one video encoder must be specified');
    }

    // Validate audio configuration
    if (profile.audio.bitrate_kbps <= 0 || profile.audio.bitrate_kbps > 1000) {
      errors.push('Audio bitrate must be between 1 and 1000 kbps');
    }

    if (!profile.audio.codec) {
      errors.push('Audio codec is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if resolution format is valid
   */
  private isValidResolution(resolution: string): boolean {
    const resolutionRegex = /^\d+x\d+$/;
    return resolutionRegex.test(resolution);
  }

  /**
   * Estimate CPU usage for profile
   */
  private estimateCpuUsage(profile: QualityProfile): number {
    let baseCpuUsage = 20; // Base CPU usage percentage

    // Factor in resolution
    const [width, height] = profile.video.resolution.split('x').map(Number);
    const pixelCount = width * height;
    baseCpuUsage += (pixelCount / 1000000) * 5; // ~5% per megapixel

    // Factor in framerate
    baseCpuUsage += (profile.video.fps / 30) * 10; // Reference 30fps

    // Factor in bitrate
    baseCpuUsage += (profile.video.bitrate_kbps / 8000) * 5; // Reference 8Mbps

    // Hardware encoder reduces CPU usage
    const hasHardwareEncoder = profile.video.encoder_priority.some(encoder => 
      ['h264_nvenc', 'h264_qsv', 'h264_amf'].includes(encoder)
    );
    if (hasHardwareEncoder) {
      baseCpuUsage *= 0.6; // 40% reduction with hardware encoding
    }

    return Math.min(Math.max(baseCpuUsage, 5), 95);
  }

  /**
   * Estimate memory usage for profile
   */
  private estimateMemoryUsage(profile: QualityProfile): number {
    let baseMemory = 100; // Base memory usage in MB

    // Factor in resolution
    const [width, height] = profile.video.resolution.split('x').map(Number);
    const pixelCount = width * height;
    baseMemory += (pixelCount / 1000000) * 50; // ~50MB per megapixel

    // Factor in framerate
    baseMemory += (profile.video.fps / 30) * 20; // Reference 30fps

    return Math.max(baseMemory, 50);
  }

  /**
   * Estimate file size per hour for profile
   */
  private estimateFileSize(profile: QualityProfile): number {
    // Video size: bitrate * duration / 8 (convert bits to bytes)
    const videoBitsPerHour = profile.video.bitrate_kbps * 1000 * 3600;
    const videoMBPerHour = videoBitsPerHour / (8 * 1024 * 1024);

    // Audio size
    const audioBitsPerHour = profile.audio.bitrate_kbps * 1000 * 3600;
    const audioMBPerHour = audioBitsPerHour / (8 * 1024 * 1024);

    // Container overhead (~5%)
    const totalMBPerHour = (videoMBPerHour + audioMBPerHour) * 1.05;

    return Math.round(totalMBPerHour);
  }

  /**
   * Get recommended use cases for profile
   */
  private getRecommendedUseCases(profile: QualityProfile): string[] {
    const useCases: string[] = [];
    const bitrate = profile.video.bitrate_kbps;
    const fps = profile.video.fps;

    if (bitrate <= 4000) {
      useCases.push('Screen sharing', 'Low bandwidth streaming', 'Long recordings');
    } else if (bitrate <= 8000) {
      useCases.push('General recording', 'Video calls', 'Tutorials');
    } else {
      useCases.push('High quality content', 'Gaming', 'Professional recording');
    }

    if (fps >= 60) {
      useCases.push('Gaming', 'Smooth motion');
    }

    return useCases;
  }

  /**
   * Get hardware requirements for profile
   */
  private getHardwareRequirements(profile: QualityProfile): ProfilePerformance['hardwareRequirements'] {
    const cpuUsage = this.estimateCpuUsage(profile);
    // const memoryUsage = this.estimateMemoryUsage(profile);

    let minCpu = 'Intel i3 / AMD Ryzen 3';
    let minRam = '4GB';
    let recommendedGpu = undefined;

    if (cpuUsage > 50) {
      minCpu = 'Intel i5 / AMD Ryzen 5';
      minRam = '8GB';
    }

    if (cpuUsage > 70) {
      minCpu = 'Intel i7 / AMD Ryzen 7';
      minRam = '16GB';
    }

    if (profile.video.encoder_priority.includes('h264_nvenc')) {
      recommendedGpu = 'NVIDIA GTX 10-series or newer';
    } else if (profile.video.encoder_priority.includes('h264_qsv')) {
      recommendedGpu = 'Intel integrated graphics (HD 4000+)';
    } else if (profile.video.encoder_priority.includes('h264_amf')) {
      recommendedGpu = 'AMD Radeon HD 7000-series or newer';
    }

    return { minCpu, minRam, recommendedGpu };
  }

  /**
   * Suggest better encoder based on available hardware
   */
  private suggestBetterEncoder(profile: QualityProfile, encoderResults: any[]): OptimizationSuggestion | null {
    const currentEncoder = profile.video.encoder_priority[0];
    
    // Find best available hardware encoder
    const bestEncoder = encoderResults
      .filter(result => result.isAvailable)
      .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))[0];

    if (bestEncoder && bestEncoder.encoder.name !== currentEncoder) {
      return {
        type: 'encoder',
        current: currentEncoder,
        suggested: bestEncoder.encoder.name,
        reason: `${bestEncoder.encoder.name} provides better performance on your hardware`,
        impact: 'performance'
      };
    }

    return null;
  }

  /**
   * Suggest better bitrate based on profile purpose
   */
  private suggestBetterBitrate(profile: QualityProfile): OptimizationSuggestion | null {
    const currentBitrate = profile.video.bitrate_kbps;
    const [width, height] = profile.video.resolution.split('x').map(Number);
    
    // Calculate recommended bitrate based on resolution and framerate
    const pixelsPerFrame = width * height;
    const pixelsPerSecond = pixelsPerFrame * profile.video.fps;
    
    // Rule of thumb: 0.1-0.2 bits per pixel per second for good quality
    const recommendedBitrate = Math.round((pixelsPerSecond * 0.15) / 1000);

    if (Math.abs(currentBitrate - recommendedBitrate) > recommendedBitrate * 0.3) {
      return {
        type: 'bitrate',
        current: currentBitrate,
        suggested: recommendedBitrate,
        reason: `Recommended bitrate for ${profile.video.resolution} at ${profile.video.fps}fps`,
        impact: currentBitrate > recommendedBitrate ? 'performance' : 'quality'
      };
    }

    return null;
  }

  /**
   * Suggest better framerate based on use case
   */
  private suggestBetterFramerate(profile: QualityProfile): OptimizationSuggestion | null {
    const currentFps = profile.video.fps;
    
    // For high resolution + high bitrate, suggest 30fps for better compatibility
    if (currentFps > 30 && profile.video.bitrate_kbps < 8000) {
      return {
        type: 'framerate',
        current: currentFps,
        suggested: 30,
        reason: 'Lower framerate improves quality at this bitrate',
        impact: 'quality'
      };
    }

    return null;
  }

  /**
   * Suggest better resolution based on system capabilities
   */
  private suggestBetterResolution(_profile: QualityProfile): OptimizationSuggestion | null {
    // For now, we'll keep the resolution suggestions simple
    // In a full implementation, this would check screen resolution and system capabilities
    return null;
  }
}