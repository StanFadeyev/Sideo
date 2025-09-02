import { join } from 'path';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { ConfigManager } from '../../config/ConfigManager';
import { AppStateManager } from '../../core/AppStateManager';
import { SafetyManager } from '../../core/SafetyManager';
import { DeviceManager } from '../../devices/DeviceManager';
import { FFmpegManager } from '../../ffmpeg/FFmpegManager';
import { RecordingEngine } from '../../recording/RecordingEngine';
import { DEFAULT_CONFIG, SafetyConfig } from '../../types';

// Integration test timeout (longer for real operations)
const INTEGRATION_TIMEOUT = 30000;

describe('Recording Pipeline Integration', () => {
  let tempDir: string;
  let configManager: ConfigManager;
  let stateManager: AppStateManager;
  let safetyManager: SafetyManager;
  let deviceManager: DeviceManager;
  let ffmpegManager: FFmpegManager;
  let recordingEngine: RecordingEngine;

  beforeAll(async () => {
    // Create temporary directory for test recordings
    tempDir = join(__dirname, 'temp-recordings');
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    mkdirSync(tempDir, { recursive: true });
  }, INTEGRATION_TIMEOUT);

  beforeEach(() => {
    // Initialize managers in dependency order
    configManager = new ConfigManager();
    stateManager = new AppStateManager(configManager);
    
    const safetyConfig: SafetyConfig = {
      min_free_space_mb: 100, // Lower requirement for tests
      prevent_sleep_while_recording: false, // Disable for tests
      max_duration_minutes: 1 // Short duration for tests
    };
    safetyManager = new SafetyManager(stateManager, safetyConfig);
    
    ffmpegManager = new FFmpegManager();
    deviceManager = new DeviceManager(ffmpegManager);
    recordingEngine = new RecordingEngine(
      ffmpegManager,
      deviceManager,
      stateManager,
      safetyManager,
      configManager
    );
  });

  afterEach(() => {
    // Cleanup
    recordingEngine.destroy();
    safetyManager.destroy();
    stateManager.destroy();
    deviceManager.destroy();
    ffmpegManager.destroy();
  });

  afterAll(() => {
    // Clean up temporary directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Component Initialization', () => {
    test('should initialize all components successfully', async () => {
      // Test FFmpeg manager initialization
      const ffmpegInit = await ffmpegManager.initialize();
      expect(ffmpegInit).toBe(true);

      // Test device manager initialization
      const deviceInit = await deviceManager.initialize();
      expect(deviceInit).toBe(true);

      // Test recording engine initialization
      const recordingInit = await recordingEngine.initialize();
      expect(recordingInit).toBe(true);

      console.log('✓ All components initialized successfully');
    }, INTEGRATION_TIMEOUT);

    test('should detect audio devices', async () => {
      await deviceManager.initialize();
      
      const audioDevices = deviceManager.getAudioDevices();
      expect(Array.isArray(audioDevices)).toBe(true);
      
      console.log(`✓ Found ${audioDevices.length} audio devices`);
    }, INTEGRATION_TIMEOUT);

    test('should detect video capabilities', async () => {
      await deviceManager.initialize();
      
      const videoCapabilities = deviceManager.getVideoCapabilities();
      expect(Array.isArray(videoCapabilities)).toBe(true);
      
      console.log(`✓ Found ${videoCapabilities.length} video capabilities`);
    }, INTEGRATION_TIMEOUT);
  });

  describe('Configuration Management Integration', () => {
    test('should update and persist configuration changes', () => {
      const originalConfig = configManager.getConfig();
      
      const updates = {
        output: {
          ...originalConfig.output,
          folder: tempDir
        }
      };

      const success = configManager.updateConfig(updates);
      expect(success).toBe(true);

      const updatedConfig = configManager.getConfig();
      expect(updatedConfig.output.folder).toBe(tempDir);
      
      console.log('✓ Configuration updated successfully');
    });

    test('should manage quality profiles', () => {
      const profiles = configManager.getProfiles();
      expect(profiles.length).toBeGreaterThan(0);

      const mediumProfile = configManager.getProfile('medium');
      expect(mediumProfile).toBeDefined();
      expect(mediumProfile?.name).toBe('Medium Quality');
      
      console.log(`✓ Found ${profiles.length} quality profiles`);
    });
  });

  describe('State Management Integration', () => {
    test('should coordinate state between components', () => {
      // Test initial state
      expect(stateManager.isRecording()).toBe(false);
      expect(stateManager.getActiveProfile()).toBe('medium');

      // Test profile change
      const success = stateManager.setActiveProfile('high');
      expect(success).toBe(true);
      expect(stateManager.getActiveProfile()).toBe('high');
      
      console.log('✓ State management working correctly');
    });

    test('should handle recording state transitions', () => {
      const outputPath = join(tempDir, 'test-recording.mkv');
      
      // Start recording
      const startSuccess = stateManager.startRecording(outputPath);
      expect(startSuccess).toBe(true);
      expect(stateManager.isRecording()).toBe(true);

      const session = stateManager.getCurrentSession();
      expect(session).toBeDefined();
      expect(session?.output_path).toBe(outputPath);

      // Stop recording
      const stopSuccess = stateManager.stopRecording();
      expect(stopSuccess).toBe(true);
      expect(stateManager.isRecording()).toBe(false);
      
      console.log('✓ Recording state transitions working');
    });
  });

  describe('Safety System Integration', () => {
    test('should perform safety checks', () => {
      const canStart = safetyManager.canStartRecording();
      expect(canStart).toHaveProperty('canStart');
      expect(typeof canStart.canStart).toBe('boolean');
      
      console.log(`✓ Safety check result: ${canStart.canStart ? 'SAFE' : 'UNSAFE'}`);
      if (canStart.reason) {
        console.log(`  Reason: ${canStart.reason}`);
      }
    });

    test('should monitor system resources', () => {
      const safetyStatus = safetyManager.getSafetyStatus();
      
      expect(safetyStatus).toHaveProperty('diskSpace');
      expect(safetyStatus).toHaveProperty('duration');
      expect(safetyStatus).toHaveProperty('system');
      
      console.log('✓ Safety monitoring operational');
      console.log(`  Disk space: ${Math.round(safetyStatus.diskSpace.free / 1024 / 1024)} MB free`);
    });
  });

  describe('FFmpeg Integration', () => {
    test('should test FFmpeg availability', async () => {
      const testResult = await ffmpegManager.testFFmpeg();
      
      expect(testResult).toHaveProperty('success');
      
      if (testResult.success) {
        console.log(`✓ FFmpeg available: ${testResult.version || 'version unknown'}`);
      } else {
        console.log(`⚠ FFmpeg not available: ${testResult.error}`);
      }
    }, INTEGRATION_TIMEOUT);

    test('should detect available encoders', async () => {
      await ffmpegManager.initialize();
      
      const encoders = ffmpegManager.getAvailableEncoders();
      expect(Array.isArray(encoders)).toBe(true);
      
      const availableEncoders = encoders.filter(e => e.isAvailable);
      console.log(`✓ Available encoders: ${availableEncoders.map(e => e.name).join(', ') || 'none'}`);
    }, INTEGRATION_TIMEOUT);
  });

  describe('Device Manager Integration', () => {
    test('should provide device recommendations', async () => {
      await deviceManager.initialize();
      
      const recommendations = deviceManager.getRecommendedAudioDevices();
      expect(recommendations).toHaveProperty('systemAudio');
      expect(recommendations).toHaveProperty('microphone');
      
      console.log('✓ Device recommendations available');
      if (recommendations.systemAudio) {
        console.log(`  System audio: ${recommendations.systemAudio.name}`);
      }
      if (recommendations.microphone) {
        console.log(`  Microphone: ${recommendations.microphone.name}`);
      }
    }, INTEGRATION_TIMEOUT);

    test('should validate audio devices', async () => {
      await deviceManager.initialize();
      
      const devices = deviceManager.getAudioDevices();
      if (devices.length > 0) {
        const validation = await deviceManager.validateAudioDevice(devices[0].name);
        expect(validation).toHaveProperty('isValid');
        expect(typeof validation.isValid).toBe('boolean');
        
        console.log(`✓ Device validation working: ${devices[0].name} is ${validation.isValid ? 'valid' : 'invalid'}`);
      } else {
        console.log('⚠ No audio devices found for validation test');
      }
    }, INTEGRATION_TIMEOUT);
  });

  describe('Recording Engine Integration', () => {
    test('should initialize recording engine components', async () => {
      await ffmpegManager.initialize();
      await deviceManager.initialize();
      
      const success = await recordingEngine.initialize();
      expect(success).toBe(true);
      
      console.log('✓ Recording engine initialized successfully');
    }, INTEGRATION_TIMEOUT);

    test('should handle recording configuration errors gracefully', async () => {
      await recordingEngine.initialize();
      
      // Test with invalid output path
      const invalidPath = '/invalid/path/that/does/not/exist/recording.mkv';
      
      // This should not throw but should handle gracefully
      expect(() => {
        recordingEngine.startRecording(invalidPath);
      }).not.toThrow();
      
      console.log('✓ Recording engine handles errors gracefully');
    }, INTEGRATION_TIMEOUT);
  });

  describe('End-to-End Integration', () => {
    test('should initialize complete application stack', async () => {
      console.log('Initializing complete application stack...');
      
      // Initialize in dependency order
      const ffmpegInit = await ffmpegManager.initialize();
      const deviceInit = await deviceManager.initialize();
      const recordingInit = await recordingEngine.initialize();
      
      expect(ffmpegInit).toBe(true);
      expect(deviceInit).toBe(true);
      expect(recordingInit).toBe(true);
      
      // Test inter-component communication
      const profiles = configManager.getProfiles();
      const devices = deviceManager.getAudioDevices();
      const encoders = ffmpegManager.getAvailableEncoders();
      
      expect(profiles.length).toBeGreaterThan(0);
      expect(Array.isArray(devices)).toBe(true);
      expect(Array.isArray(encoders)).toBe(true);
      
      console.log('✓ Complete application stack initialized');
      console.log(`  Profiles: ${profiles.length}`);
      console.log(`  Audio devices: ${devices.length}`);
      console.log(`  Encoders: ${encoders.length}`);
    }, INTEGRATION_TIMEOUT);

    test('should handle component lifecycle correctly', async () => {
      // Initialize all components
      await ffmpegManager.initialize();
      await deviceManager.initialize();
      await recordingEngine.initialize();
      
      // Test recording preparation
      const canStart = safetyManager.canStartRecording();
      console.log(`Safety check: ${canStart.canStart ? 'PASS' : 'FAIL'}`);
      
      // Test configuration access
      const config = configManager.getConfig();
      expect(config).toBeDefined();
      expect(config.video).toBeDefined();
      expect(config.audio).toBeDefined();
      
      // Test state management
      expect(stateManager.isRecording()).toBe(false);
      
      console.log('✓ Component lifecycle working correctly');
    }, INTEGRATION_TIMEOUT);
  });
});