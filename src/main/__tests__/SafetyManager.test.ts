import { SafetyManager } from '../core/SafetyManager';
import { AppStateManager } from '../core/AppStateManager';
import { SafetyConfig } from '../types';
import { EventEmitter } from 'events';

// Mock file system functions
jest.mock('fs', () => ({}));

// Mock os module
jest.mock('os', () => ({
  platform: jest.fn().mockReturnValue('win32')
}));

describe('SafetyManager', () => {
  let safetyManager: SafetyManager;
  let mockStateManager: jest.Mocked<AppStateManager>;
  let mockSafetyConfig: SafetyConfig;

  beforeEach(() => {
    mockStateManager = {
      isRecording: jest.fn().mockReturnValue(false),
      getCurrentSession: jest.fn().mockReturnValue(undefined),
      stopRecording: jest.fn().mockResolvedValue(true),
      getRecordingDuration: jest.fn().mockReturnValue(0),
      getState: jest.fn().mockReturnValue({ config: { output: { folder: '/test' } } }),
      on: jest.fn(),
      emit: jest.fn()
    } as any;

    mockSafetyConfig = {
      min_free_space_mb: 1024, // 1GB minimum
      prevent_sleep_while_recording: true,
      max_duration_minutes: 240 // 4 hours max
    };

    safetyManager = new SafetyManager(mockStateManager, mockSafetyConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
    safetyManager.destroy();
  });

  describe('Initialization', () => {
    test('should initialize with provided config', () => {
      expect(safetyManager).toBeInstanceOf(EventEmitter);
    });

    test('should set up event listeners', () => {
      expect(mockStateManager.on).toHaveBeenCalled();
    });
  });

  describe('Recording Safety Checks', () => {
    test('should allow recording when conditions are safe', () => {
      const result = safetyManager.canStartRecording();
      
      expect(result.canStart).toBe(true);
    });

    test('should get safety status', () => {
      const status = safetyManager.getSafetyStatus();
      
      expect(status).toHaveProperty('diskSpace');
      expect(status).toHaveProperty('duration');
      expect(status).toHaveProperty('system');
    });
  });

  describe('Configuration Updates', () => {
    test('should update safety configuration', () => {
      const newConfig: SafetyConfig = {
        min_free_space_mb: 2048,
        prevent_sleep_while_recording: false,
        max_duration_minutes: 120
      };

      expect(() => {
        safetyManager.updateConfig(newConfig);
      }).not.toThrow();
    });
  });

  describe('Emergency Stop', () => {
    test('should trigger emergency stop when recording', () => {
      mockStateManager.isRecording.mockReturnValue(true);
      
      let eventEmitted = false;
      safetyManager.on('auto-stop-triggered', () => {
        eventEmitted = true;
      });

      safetyManager.emergencyStop('Test reason');
      
      expect(eventEmitted).toBe(true);
      expect(mockStateManager.stopRecording).toHaveBeenCalled();
    });

    test('should not trigger emergency stop when not recording', () => {
      mockStateManager.isRecording.mockReturnValue(false);
      
      safetyManager.emergencyStop('Test reason');
      
      expect(mockStateManager.stopRecording).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    test('should remove all event listeners on destroy', () => {
      const removeAllListenersSpy = jest.spyOn(safetyManager, 'removeAllListeners');
      
      safetyManager.destroy();
      
      expect(removeAllListenersSpy).toHaveBeenCalled();
    });
  });
});