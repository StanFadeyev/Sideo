import { EventEmitter } from 'events';
import { AudioDevice } from '../types';
import { DeviceManager } from './DeviceManager';
import { EncoderCapabilityDetector } from './EncoderCapabilityDetector';
import { VideoEncoder } from '../ffmpeg/FFmpegCommandBuilder';

/**
 * Fallback strategy for devices
 */
export interface FallbackStrategy {
  priority: number;
  description: string;
  apply: () => Promise<boolean>;
  rollback?: () => Promise<void>;
}

/**
 * Device configuration with fallbacks
 */
export interface DeviceConfiguration {
  video: {
    primary: VideoEncoder;
    fallbacks: VideoEncoder[];
  };
  audio: {
    system: {
      primary?: AudioDevice;
      fallbacks: AudioDevice[];
    };
    microphone: {
      primary?: AudioDevice;
      fallbacks: AudioDevice[];
    };
  };
}

/**
 * Validation result for device configuration
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  appliedFallbacks: string[];
  finalConfiguration: DeviceConfiguration;
}

/**
 * Device Fallback Manager
 * Handles device validation and automatic fallback to working alternatives
 */
export class DeviceFallbackManager extends EventEmitter {
  private deviceManager: DeviceManager;
  private encoderDetector: EncoderCapabilityDetector;
  private fallbackStrategies: Map<string, FallbackStrategy[]> = new Map();
  private currentConfiguration?: DeviceConfiguration;

  constructor(deviceManager: DeviceManager, encoderDetector: EncoderCapabilityDetector) {
    super();
    this.deviceManager = deviceManager;
    this.encoderDetector = encoderDetector;
    
    this.initializeFallbackStrategies();
  }

  /**
   * Validate and configure devices with fallbacks
   */
  async validateAndConfigureDevices(
    preferredVideoEncoder: string,
    preferredSystemAudio?: string,
    preferredMicrophone?: string
  ): Promise<ValidationResult> {
    
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      appliedFallbacks: [],
      finalConfiguration: {
        video: {
          primary: this.createDummyEncoder(preferredVideoEncoder),
          fallbacks: []
        },
        audio: {
          system: { fallbacks: [] },
          microphone: { fallbacks: [] }
        }
      }
    };

    try {
      // Validate and configure video encoder
      const videoConfig = await this.configureVideoEncoder(preferredVideoEncoder);
      if (videoConfig.success) {
        result.finalConfiguration.video = videoConfig.configuration;
        result.appliedFallbacks.push(...videoConfig.appliedFallbacks);
        result.warnings.push(...videoConfig.warnings);
      } else {
        result.isValid = false;
        result.errors.push(`Video encoder configuration failed: ${videoConfig.error}`);
      }

      // Validate and configure system audio
      if (preferredSystemAudio) {
        const systemAudioConfig = await this.configureSystemAudio(preferredSystemAudio);
        if (systemAudioConfig.success) {
          result.finalConfiguration.audio.system = systemAudioConfig.configuration;
          result.appliedFallbacks.push(...systemAudioConfig.appliedFallbacks);
          result.warnings.push(...systemAudioConfig.warnings);
        } else {
          result.warnings.push(`System audio configuration failed: ${systemAudioConfig.error}`);
        }
      }

      // Validate and configure microphone
      if (preferredMicrophone) {
        const micConfig = await this.configureMicrophone(preferredMicrophone);
        if (micConfig.success) {
          result.finalConfiguration.audio.microphone = micConfig.configuration;
          result.appliedFallbacks.push(...micConfig.appliedFallbacks);
          result.warnings.push(...micConfig.warnings);
        } else {
          result.warnings.push(`Microphone configuration failed: ${micConfig.error}`);
        }
      }

      // Store current configuration
      this.currentConfiguration = result.finalConfiguration;

      return result;

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Configuration validation failed: ${error}`);
      return result;
    }
  }

  /**
   * Get automatic device recommendations
   */
  async getRecommendedConfiguration(): Promise<DeviceConfiguration> {
    const audioDevices = this.deviceManager.getAudioDevices();
    const encoderResults = this.encoderDetector.getTestResults();
    
    // Get best video encoder
    const availableEncoders = encoderResults
      .filter(result => result.isAvailable)
      .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0));

    const primaryEncoder = availableEncoders[0]?.encoder || this.createDummyEncoder('libx264');
    const fallbackEncoders = availableEncoders.slice(1).map(result => result.encoder);

    // Get recommended audio devices
    const recommended = this.deviceManager.getRecommendedAudioDevices();
    
    const systemAudioFallbacks = audioDevices
      .filter(device => device.type === 'output' && device.is_available)
      .filter(device => device.id !== recommended.systemAudio?.id);

    const microphoneFallbacks = audioDevices
      .filter(device => device.type === 'input' && device.is_available)
      .filter(device => device.id !== recommended.microphone?.id);

    return {
      video: {
        primary: primaryEncoder,
        fallbacks: fallbackEncoders
      },
      audio: {
        system: {
          primary: recommended.systemAudio || undefined,
          fallbacks: systemAudioFallbacks
        },
        microphone: {
          primary: recommended.microphone || undefined,
          fallbacks: microphoneFallbacks
        }
      }
    };
  }

  /**
   * Test current configuration
   */
  async testCurrentConfiguration(): Promise<{ success: boolean; issues: string[] }> {
    if (!this.currentConfiguration) {
      return { success: false, issues: ['No configuration to test'] };
    }

    const issues: string[] = [];

    // Test video encoder
    const encoderTest = this.encoderDetector.getTestResults()
      .find(result => result.encoder.name === this.currentConfiguration!.video.primary.name);
    
    if (!encoderTest || !encoderTest.isAvailable) {
      issues.push(`Video encoder ${this.currentConfiguration.video.primary.name} is not available`);
    }

    // Test audio devices
    if (this.currentConfiguration.audio.system.primary) {
      const systemAudioTest = await this.deviceManager.validateAudioDevice(
        this.currentConfiguration.audio.system.primary.name
      );
      if (!systemAudioTest.isValid) {
        issues.push(`System audio device is not working: ${systemAudioTest.error}`);
      }
    }

    if (this.currentConfiguration.audio.microphone.primary) {
      const micTest = await this.deviceManager.validateAudioDevice(
        this.currentConfiguration.audio.microphone.primary.name
      );
      if (!micTest.isValid) {
        issues.push(`Microphone device is not working: ${micTest.error}`);
      }
    }

    return {
      success: issues.length === 0,
      issues
    };
  }

  /**
   * Apply fallback for a specific component
   */
  async applyFallback(component: 'video' | 'system-audio' | 'microphone'): Promise<boolean> {
    if (!this.currentConfiguration) {
      return false;
    }

    try {
      switch (component) {
        case 'video':
          return await this.applyVideoFallback();
        case 'system-audio':
          return await this.applySystemAudioFallback();
        case 'microphone':
          return await this.applyMicrophoneFallback();
        default:
          return false;
      }
    } catch (error) {
      console.error(`Failed to apply fallback for ${component}:`, error);
      return false;
    }
  }

  /**
   * Configure video encoder with fallbacks
   */
  private async configureVideoEncoder(preferredEncoder: string) {
    const result = {
      success: false,
      configuration: { primary: this.createDummyEncoder(preferredEncoder), fallbacks: [] as VideoEncoder[] },
      appliedFallbacks: [] as string[],
      warnings: [] as string[],
      error: ''
    };

    const encoderResults = this.encoderDetector.getTestResults();
    const preferred = encoderResults.find(r => r.encoder.name === preferredEncoder);

    if (preferred && preferred.isAvailable) {
      result.configuration.primary = preferred.encoder;
      result.success = true;
    } else {
      // Apply fallback
      const fallback = encoderResults.find(r => r.isAvailable);
      if (fallback) {
        result.configuration.primary = fallback.encoder;
        result.appliedFallbacks.push(`Video encoder fallback: ${preferredEncoder} → ${fallback.encoder.name}`);
        result.warnings.push(`Preferred encoder ${preferredEncoder} not available, using ${fallback.encoder.name}`);
        result.success = true;
      } else {
        result.error = 'No working video encoders found';
      }
    }

    // Add additional fallbacks
    result.configuration.fallbacks = encoderResults
      .filter(r => r.isAvailable && r.encoder.name !== result.configuration.primary.name)
      .map(r => r.encoder);

    return result;
  }

  /**
   * Configure system audio with fallbacks
   */
  private async configureSystemAudio(preferredDevice: string) {
    const result = {
      success: false,
      configuration: { primary: undefined as AudioDevice | undefined, fallbacks: [] as AudioDevice[] },
      appliedFallbacks: [] as string[],
      warnings: [] as string[],
      error: ''
    };

    const audioDevices = this.deviceManager.getAudioDevices();
    const preferred = audioDevices.find(d => d.name === preferredDevice || d.id === preferredDevice);

    if (preferred && preferred.is_available) {
      const validation = await this.deviceManager.validateAudioDevice(preferred.name);
      if (validation.isValid) {
        result.configuration.primary = preferred;
        result.success = true;
      } else {
        result.warnings.push(`Preferred system audio device failed validation: ${validation.error}`);
      }
    }

    if (!result.success) {
      // Try fallbacks
      const systemDevices = audioDevices.filter(d => 
        d.type === 'output' && 
        d.is_available && 
        d.name !== preferredDevice
      );

      for (const device of systemDevices) {
        const validation = await this.deviceManager.validateAudioDevice(device.name);
        if (validation.isValid) {
          result.configuration.primary = device;
          result.appliedFallbacks.push(`System audio fallback: ${preferredDevice} → ${device.name}`);
          result.success = true;
          break;
        }
      }

      if (!result.success) {
        result.error = 'No working system audio devices found';
      }
    }

    // Add fallback devices
    result.configuration.fallbacks = audioDevices
      .filter(d => d.type === 'output' && d.is_available && d.id !== result.configuration.primary?.id);

    return result;
  }

  /**
   * Configure microphone with fallbacks
   */
  private async configureMicrophone(preferredDevice: string) {
    const result = {
      success: false,
      configuration: { primary: undefined as AudioDevice | undefined, fallbacks: [] as AudioDevice[] },
      appliedFallbacks: [] as string[],
      warnings: [] as string[],
      error: ''
    };

    const audioDevices = this.deviceManager.getAudioDevices();
    const preferred = audioDevices.find(d => d.name === preferredDevice || d.id === preferredDevice);

    if (preferred && preferred.is_available) {
      const validation = await this.deviceManager.validateAudioDevice(preferred.name);
      if (validation.isValid) {
        result.configuration.primary = preferred;
        result.success = true;
      } else {
        result.warnings.push(`Preferred microphone failed validation: ${validation.error}`);
      }
    }

    if (!result.success) {
      // Try fallbacks
      const micDevices = audioDevices.filter(d => 
        d.type === 'input' && 
        d.is_available && 
        d.name !== preferredDevice
      );

      for (const device of micDevices) {
        const validation = await this.deviceManager.validateAudioDevice(device.name);
        if (validation.isValid) {
          result.configuration.primary = device;
          result.appliedFallbacks.push(`Microphone fallback: ${preferredDevice} → ${device.name}`);
          result.success = true;
          break;
        }
      }

      if (!result.success) {
        result.error = 'No working microphone devices found';
      }
    }

    // Add fallback devices
    result.configuration.fallbacks = audioDevices
      .filter(d => d.type === 'input' && d.is_available && d.id !== result.configuration.primary?.id);

    return result;
  }

  /**
   * Apply video encoder fallback
   */
  private async applyVideoFallback(): Promise<boolean> {
    if (!this.currentConfiguration || this.currentConfiguration.video.fallbacks.length === 0) {
      return false;
    }

    const nextFallback = this.currentConfiguration.video.fallbacks[0];
    const encoderResults = this.encoderDetector.getTestResults();
    const fallbackResult = encoderResults.find(r => r.encoder.name === nextFallback.name);

    if (fallbackResult && fallbackResult.isAvailable) {
      this.currentConfiguration.video.primary = nextFallback;
      this.currentConfiguration.video.fallbacks = this.currentConfiguration.video.fallbacks.slice(1);
      return true;
    }

    return false;
  }

  /**
   * Apply system audio fallback
   */
  private async applySystemAudioFallback(): Promise<boolean> {
    if (!this.currentConfiguration || this.currentConfiguration.audio.system.fallbacks.length === 0) {
      return false;
    }

    const nextFallback = this.currentConfiguration.audio.system.fallbacks[0];
    const validation = await this.deviceManager.validateAudioDevice(nextFallback.name);

    if (validation.isValid) {
      this.currentConfiguration.audio.system.primary = nextFallback;
      this.currentConfiguration.audio.system.fallbacks = 
        this.currentConfiguration.audio.system.fallbacks.slice(1);
      return true;
    }

    return false;
  }

  /**
   * Apply microphone fallback
   */
  private async applyMicrophoneFallback(): Promise<boolean> {
    if (!this.currentConfiguration || this.currentConfiguration.audio.microphone.fallbacks.length === 0) {
      return false;
    }

    const nextFallback = this.currentConfiguration.audio.microphone.fallbacks[0];
    const validation = await this.deviceManager.validateAudioDevice(nextFallback.name);

    if (validation.isValid) {
      this.currentConfiguration.audio.microphone.primary = nextFallback;
      this.currentConfiguration.audio.microphone.fallbacks = 
        this.currentConfiguration.audio.microphone.fallbacks.slice(1);
      return true;
    }

    return false;
  }

  /**
   * Initialize fallback strategies
   */
  private initializeFallbackStrategies(): void {
    // Video encoder fallback strategies
    this.fallbackStrategies.set('video-encoder', [
      {
        priority: 1,
        description: 'Switch to next hardware encoder',
        apply: async () => this.applyVideoFallback()
      },
      {
        priority: 2,
        description: 'Switch to software encoder',
        apply: async () => {
          if (this.currentConfiguration) {
            const softwareEncoder = this.createDummyEncoder('libx264');
            this.currentConfiguration.video.primary = softwareEncoder;
            return true;
          }
          return false;
        }
      }
    ]);

    // Audio device fallback strategies
    this.fallbackStrategies.set('audio-device', [
      {
        priority: 1,
        description: 'Switch to next available device',
        apply: async () => this.applySystemAudioFallback() || this.applyMicrophoneFallback()
      },
      {
        priority: 2,
        description: 'Use default system device',
        apply: async () => {
          const defaultDevice = this.deviceManager.getDefaultAudioInput() || 
                               this.deviceManager.getDefaultAudioOutput();
          return defaultDevice !== undefined;
        }
      }
    ]);
  }

  /**
   * Create dummy encoder for fallback
   */
  private createDummyEncoder(name: string): VideoEncoder {
    return {
      name,
      displayName: name,
      isHardware: name !== 'libx264',
      vendor: name === 'libx264' ? 'software' : 'nvidia',
      testCommand: [],
      isAvailable: true
    };
  }
}