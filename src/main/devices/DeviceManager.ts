import { EventEmitter } from 'events';
import { AudioDevice, VideoCapability } from '../types';
import { FFmpegManager } from '../ffmpeg/FFmpegManager';
import { DeviceListResult } from '../ffmpeg/FFmpegOutputParser';

/**
 * Device Manager Events
 */
export enum DeviceManagerEvent {
  DEVICES_UPDATED = 'devices-updated',
  DEVICE_CONNECTED = 'device-connected',
  DEVICE_DISCONNECTED = 'device-disconnected',
  CAPABILITIES_UPDATED = 'capabilities-updated'
}

/**
 * Device validation result
 */
interface DeviceValidationResult {
  isValid: boolean;
  error?: string;
  latency?: number;
}

/**
 * Device Manager
 * Handles discovery, validation, and monitoring of audio/video devices
 */
export class DeviceManager extends EventEmitter {
  private audioDevices: AudioDevice[] = [];
  private videoCapabilities: VideoCapability[] = [];
  private ffmpegManager: FFmpegManager;
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;

  // Device monitoring settings
  private readonly MONITORING_INTERVAL = 30000; // 30 seconds

  constructor(ffmpegManager: FFmpegManager) {
    super();
    this.ffmpegManager = ffmpegManager;
  }

  /**
   * Initialize device manager and discover devices
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing device manager...');
      
      // Discover initial devices
      await this.refreshDevices();
      
      // Start monitoring for device changes
      this.startMonitoring();
      
      console.log('Device manager initialized successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to initialize device manager:', error);
      return false;
    }
  }

  /**
   * Refresh device list
   */
  async refreshDevices(): Promise<void> {
    try {
      console.log('Refreshing device list...');
      
      // Get devices from FFmpeg
      const devices = this.ffmpegManager.getDetectedDevices();
      if (!devices) {
        console.warn('No devices detected from FFmpeg');
        return;
      }

      // Convert to our format and validate
      const newAudioDevices = await this.processAudioDevices(devices);
      const newVideoCapabilities = await this.processVideoCapabilities();

      // Check for changes
      const audioChanged = this.hasAudioDevicesChanged(newAudioDevices);
      const videoChanged = this.hasVideoCapabilitiesChanged(newVideoCapabilities);

      if (audioChanged || videoChanged) {
        this.audioDevices = newAudioDevices;
        this.videoCapabilities = newVideoCapabilities;
        
        this.emit(DeviceManagerEvent.DEVICES_UPDATED, {
          audio: this.audioDevices,
          video: this.videoCapabilities
        });
        
        console.log(`Devices updated: ${this.audioDevices.length} audio, ${this.videoCapabilities.length} video`);
      }

    } catch (error) {
      console.error('Error refreshing devices:', error);
    }
  }

  /**
   * Get current audio devices
   */
  getAudioDevices(): AudioDevice[] {
    return [...this.audioDevices];
  }

  /**
   * Get current video capabilities
   */
  getVideoCapabilities(): VideoCapability[] {
    return [...this.videoCapabilities];
  }

  /**
   * Get audio device by name
   */
  getAudioDevice(deviceName: string): AudioDevice | undefined {
    return this.audioDevices.find(device => 
      device.name === deviceName || 
      device.id === deviceName
    );
  }

  /**
   * Get default audio input device
   */
  getDefaultAudioInput(): AudioDevice | undefined {
    return this.audioDevices.find(device => 
      device.type === 'input' && device.is_default
    );
  }

  /**
   * Get default audio output device (for system audio capture)
   */
  getDefaultAudioOutput(): AudioDevice | undefined {
    return this.audioDevices.find(device => 
      device.type === 'output' && device.is_default
    );
  }

  /**
   * Validate if an audio device is working
   */
  async validateAudioDevice(deviceName: string): Promise<DeviceValidationResult> {
    try {
      console.log(`Validating audio device: ${deviceName}`);
      
      const device = this.getAudioDevice(deviceName);
      if (!device) {
        return {
          isValid: false,
          error: 'Device not found'
        };
      }

      if (!device.is_available) {
        return {
          isValid: false,
          error: 'Device not available'
        };
      }

      // Test the device with FFmpeg
      const startTime = Date.now();
      const testResult = await this.testAudioDevice(deviceName);
      const latency = Date.now() - startTime;

      return {
        isValid: testResult.success,
        error: testResult.error,
        latency
      };

    } catch (error) {
      return {
        isValid: false,
        error: `Validation failed: ${error}`
      };
    }
  }

  /**
   * Get recommended audio devices for recording
   */
  getRecommendedAudioDevices(): {
    systemAudio: AudioDevice | null;
    microphone: AudioDevice | null;
  } {
    // Find system audio devices (usually "Stereo Mix" or similar)
    const systemAudio = this.audioDevices.find(device => 
      device.type === 'output' && 
      device.is_available &&
      (device.name.toLowerCase().includes('stereo mix') ||
       device.name.toLowerCase().includes('what u hear') ||
       device.name.toLowerCase().includes('wave out mix'))
    ) || this.getDefaultAudioOutput();

    // Find microphone devices
    const microphone = this.audioDevices.find(device => 
      device.type === 'input' && 
      device.is_available &&
      (device.name.toLowerCase().includes('microphone') ||
       device.name.toLowerCase().includes('mic'))
    ) || this.getDefaultAudioInput();

    return {
      systemAudio: systemAudio || null,
      microphone: microphone || null
    };
  }

  /**
   * Start monitoring device changes
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.refreshDevices();
    }, this.MONITORING_INTERVAL);
  }

  /**
   * Stop monitoring device changes
   */
  private stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
  }

  /**
   * Process raw audio devices from FFmpeg
   */
  private async processAudioDevices(devices: DeviceListResult): Promise<AudioDevice[]> {
    const processedDevices: AudioDevice[] = [];

    // Process audio inputs
    for (const device of devices.audioInputs) {
      const audioDevice: AudioDevice = {
        id: this.generateDeviceId(device.name),
        name: device.name,
        type: 'input',
        is_default: device.isDefault,
        is_available: true // Will be validated separately
      };

      // Quick availability check
      audioDevice.is_available = await this.quickTestDevice(device.name);
      
      processedDevices.push(audioDevice);
    }

    // For system audio capture, we need output devices (like Stereo Mix)
    // These are usually not in the DirectShow output devices list
    // Add common system audio devices if they exist
    const commonSystemDevices = [
      'Stereo Mix',
      'What U Hear',
      'Wave Out Mix',
      'Loopback'
    ];

    for (const deviceName of commonSystemDevices) {
      // Check if already added
      if (processedDevices.find(d => d.name.includes(deviceName))) {
        continue;
      }

      // Test if device exists
      const isAvailable = await this.quickTestDevice(deviceName);
      if (isAvailable) {
        processedDevices.push({
          id: this.generateDeviceId(deviceName),
          name: deviceName,
          type: 'output',
          is_default: false,
          is_available: true
        });
      }
    }

    return processedDevices;
  }

  /**
   * Process video capabilities from FFmpeg encoders
   */
  private async processVideoCapabilities(): Promise<VideoCapability[]> {
    const encoders = this.ffmpegManager.getAvailableEncoders();
    const capabilities: VideoCapability[] = [];

    for (const encoder of encoders) {
      capabilities.push({
        encoder: encoder.name,
        hardware_accelerated: encoder.isHardware,
        max_resolution: encoder.isHardware ? '4096x2160' : '1920x1080',
        supported_formats: ['h264', 'mp4', 'mkv']
      });
    }

    return capabilities;
  }

  /**
   * Quick test if a device is available
   */
  private async quickTestDevice(_deviceName: string): Promise<boolean> {
    try {
      // This would use FFmpeg to quickly test the device
      // For now, return true as a placeholder
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test audio device with FFmpeg
   */
  private async testAudioDevice(_deviceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      // This would use FFmpeg to test recording from the device
      // For now, return success as a placeholder
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Device test failed: ${error}`
      };
    }
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(deviceName: string): string {
    return deviceName.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Check if audio devices list has changed
   */
  private hasAudioDevicesChanged(newDevices: AudioDevice[]): boolean {
    if (this.audioDevices.length !== newDevices.length) {
      return true;
    }

    for (const newDevice of newDevices) {
      const existing = this.audioDevices.find(d => d.id === newDevice.id);
      if (!existing || existing.is_available !== newDevice.is_available) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if video capabilities have changed
   */
  private hasVideoCapabilitiesChanged(newCapabilities: VideoCapability[]): boolean {
    if (this.videoCapabilities.length !== newCapabilities.length) {
      return true;
    }

    for (const newCap of newCapabilities) {
      const existing = this.videoCapabilities.find(c => c.encoder === newCap.encoder);
      if (!existing) {
        return true;
      }
    }

    return false;
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    this.stopMonitoring();
    this.removeAllListeners();
  }
}