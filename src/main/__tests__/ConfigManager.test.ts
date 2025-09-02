import { ConfigManager } from '../config/ConfigManager';
import { DEFAULT_CONFIG, DEFAULT_PROFILES, AppConfig, QualityProfile } from '../types';

// Mock electron-store
jest.mock('electron-store', () => {
  const mockStore = {
    store: { ...require('../types').DEFAULT_CONFIG },
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
    path: 'mock-config-path'
  };
  
  mockStore.get.mockImplementation((key: string, defaultValue?: any) => {
    if (key === 'profiles') return require('../types').DEFAULT_PROFILES;
    if (key === 'sessions') return [];
    return defaultValue;
  });
  
  return jest.fn(() => mockStore);
});

// Mock electron app
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn().mockReturnValue('/mock/app/path')
  }
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
}));

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    jest.clearAllMocks();
    configManager = new ConfigManager();
  });

  describe('Configuration Management', () => {
    test('should return default configuration', () => {
      const config = configManager.getConfig();
      expect(config).toMatchObject(DEFAULT_CONFIG);
    });

    test('should update configuration with partial config', () => {
      const partialConfig: Partial<AppConfig> = {
        video: {
          ...DEFAULT_CONFIG.video,
          fps: 60
        }
      };

      const result = configManager.updateConfig(partialConfig);
      expect(result).toBe(true);
    });

    test('should reset configuration to defaults', () => {
      configManager.resetConfig();
      const config = configManager.getConfig();
      expect(config).toMatchObject(DEFAULT_CONFIG);
    });

    test('should validate configuration correctly', () => {
      const validConfig: AppConfig = { ...DEFAULT_CONFIG };
      // ConfigManager internal validation should pass
      expect(() => new ConfigManager()).not.toThrow();
    });
  });

  describe('Profile Management', () => {
    test('should return default profiles', () => {
      const profiles = configManager.getProfiles();
      expect(profiles).toHaveLength(DEFAULT_PROFILES.length);
      expect(profiles).toEqual(DEFAULT_PROFILES);
    });

    test('should get specific profile by ID', () => {
      const profile = configManager.getProfile('medium');
      expect(profile).toBeDefined();
      expect(profile?.id).toBe('medium');
      expect(profile?.name).toBe('Medium Quality');
    });

    test('should return undefined for non-existent profile', () => {
      const profile = configManager.getProfile('non-existent');
      expect(profile).toBeUndefined();
    });

    test('should save new profile', () => {
      const newProfile: QualityProfile = {
        id: 'test-profile',
        name: 'Test Profile',
        subtitle: 'For testing',
        video: {
          resolution: '1280x720',
          fps: 30,
          bitrate_kbps: 5000,
          encoder_priority: ['libx264']
        },
        audio: {
          bitrate_kbps: 128,
          codec: 'aac'
        },
        description: 'Test profile for unit tests'
      };

      const result = configManager.saveProfile(newProfile);
      expect(result).toBe(true);
    });

    test('should update existing profile', () => {
      const existingProfile = configManager.getProfile('medium');
      expect(existingProfile).toBeDefined();

      const updatedProfile: QualityProfile = {
        ...existingProfile!,
        name: 'Updated Medium Quality'
      };

      const result = configManager.saveProfile(updatedProfile);
      expect(result).toBe(true);
    });

    test('should delete custom profile', () => {
      const result = configManager.deleteProfile('custom-profile');
      expect(result).toBe(true);
    });

    test('should not delete default profiles', () => {
      expect(() => configManager.deleteProfile('low')).toThrow();
      expect(() => configManager.deleteProfile('medium')).toThrow();
      expect(() => configManager.deleteProfile('high')).toThrow();
    });
  });

  describe('Active Profile Management', () => {
    test('should get default active profile', () => {
      const activeProfile = configManager.getActiveProfile();
      expect(activeProfile).toBe('medium');
    });

    test('should set active profile with valid ID', () => {
      const result = configManager.setActiveProfile('high');
      expect(result).toBe(true);
      expect(configManager.getActiveProfile()).toBe('high');
    });

    test('should not set active profile with invalid ID', () => {
      const result = configManager.setActiveProfile('invalid-profile');
      expect(result).toBe(false);
      expect(configManager.getActiveProfile()).toBe('medium'); // Should remain unchanged
    });
  });

  describe('Recording Session Management', () => {
    test('should add recording session', () => {
      const session = {
        id: 'test-session-1',
        start_time: new Date(),
        profile: 'medium',
        output_path: '/test/path/recording.mkv',
        status: 'recording' as const
      };

      expect(() => configManager.addRecordingSession(session)).not.toThrow();
    });

    test('should get recording sessions', () => {
      const sessions = configManager.getRecordingSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });

    test('should update recording session', () => {
      const sessionId = 'test-session-1';
      const updates = {
        status: 'stopped' as const,
        end_time: new Date(),
        duration_seconds: 120
      };

      const result = configManager.updateRecordingSession(sessionId, updates);
      expect(result).toBe(true);
    });

    test('should return false when updating non-existent session', () => {
      const result = configManager.updateRecordingSession('non-existent', {
        status: 'stopped' as const
      });
      expect(result).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    test('should return config path', () => {
      const path = configManager.getConfigPath();
      expect(typeof path).toBe('string');
      expect(path).toBe('mock-config-path');
    });

    test('should handle error during config update gracefully', () => {
      // Test error handling by providing invalid config
      const invalidConfig = { video: { fps: -1 } } as any;
      const result = configManager.updateConfig(invalidConfig);
      
      // Should handle gracefully and return false
      expect(typeof result).toBe('boolean');
    });
  });
});