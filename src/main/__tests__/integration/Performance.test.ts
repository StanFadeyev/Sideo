import { ConfigManager } from '../../config/ConfigManager';
import { AppStateManager } from '../../core/AppStateManager';
import { SafetyManager } from '../../core/SafetyManager';
import { DeviceManager } from '../../devices/DeviceManager';
import { FFmpegManager } from '../../ffmpeg/FFmpegManager';
import { RecordingEngine } from '../../recording/RecordingEngine';
import { FFmpegCommandBuilder } from '../../ffmpeg/FFmpegCommandBuilder';
import { DEFAULT_CONFIG, SafetyConfig } from '../../types';

// Performance test timeout
const PERFORMANCE_TIMEOUT = 60000;

interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage: {
    initial: NodeJS.MemoryUsage;
    peak: NodeJS.MemoryUsage;
    final: NodeJS.MemoryUsage;
  };
  operations: number;
}

describe('Performance and Stress Testing', () => {
  let configManager: ConfigManager;
  let stateManager: AppStateManager;
  let safetyManager: SafetyManager;
  let deviceManager: DeviceManager;
  let ffmpegManager: FFmpegManager;
  let recordingEngine: RecordingEngine;

  beforeEach(() => {
    // Initialize components for performance testing
    configManager = new ConfigManager();
    stateManager = new AppStateManager(configManager);
    
    const safetyConfig: SafetyConfig = {
      min_free_space_mb: 100,
      prevent_sleep_while_recording: false,
      max_duration_minutes: 60
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
    // Cleanup after each test
    recordingEngine.destroy();
    safetyManager.destroy();
    stateManager.destroy();
    deviceManager.destroy();
    ffmpegManager.destroy();
  });

  /**
   * Measure performance metrics for a function
   */
  async function measurePerformance<T>(
    operation: () => Promise<T> | T,
    iterations: number = 1
  ): Promise<PerformanceMetrics> {
    const initialMemory = process.memoryUsage();
    let peakMemory = initialMemory;
    
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      await operation();
      
      const currentMemory = process.memoryUsage();
      if (currentMemory.heapUsed > peakMemory.heapUsed) {
        peakMemory = currentMemory;
      }
    }
    
    const endTime = performance.now();
    const finalMemory = process.memoryUsage();
    
    return {
      startTime,
      endTime,
      duration: endTime - startTime,
      memoryUsage: {
        initial: initialMemory,
        peak: peakMemory,
        final: finalMemory
      },
      operations: iterations
    };
  }

  /**
   * Format memory usage for readable output
   */
  function formatMemory(memory: NodeJS.MemoryUsage): string {
    const mb = (bytes: number) => Math.round(bytes / 1024 / 1024);
    return `Heap: ${mb(memory.heapUsed)}MB, RSS: ${mb(memory.rss)}MB`;
  }

  describe('Component Initialization Performance', () => {
    test('should initialize ConfigManager quickly', async () => {
      const metrics = await measurePerformance(() => {
        const config = new ConfigManager();
        config.destroy();
      }, 100);

      expect(metrics.duration).toBeLessThan(1000); // Should complete in under 1 second
      
      console.log(`✓ ConfigManager initialization: ${metrics.duration.toFixed(2)}ms for ${metrics.operations} operations`);
      console.log(`  Memory usage: ${formatMemory(metrics.memoryUsage.final)}`);
    }, PERFORMANCE_TIMEOUT);

    test('should initialize AppStateManager efficiently', async () => {
      const metrics = await measurePerformance(() => {
        const config = new ConfigManager();
        const state = new AppStateManager(config);
        state.destroy();
        config.destroy();
      }, 50);

      expect(metrics.duration).toBeLessThan(2000);
      
      console.log(`✓ AppStateManager initialization: ${metrics.duration.toFixed(2)}ms for ${metrics.operations} operations`);
    }, PERFORMANCE_TIMEOUT);

    test('should handle multiple manager creation/destruction', async () => {
      const metrics = await measurePerformance(() => {
        const config = new ConfigManager();
        const state = new AppStateManager(config);
        const safety = new SafetyManager(state, {
          min_free_space_mb: 100,
          prevent_sleep_while_recording: false,
          max_duration_minutes: 60
        });
        
        safety.destroy();
        state.destroy();
        config.destroy();
      }, 25);

      expect(metrics.duration).toBeLessThan(5000);
      
      console.log(`✓ Multiple manager lifecycle: ${metrics.duration.toFixed(2)}ms for ${metrics.operations} cycles`);
      console.log(`  Peak memory: ${formatMemory(metrics.memoryUsage.peak)}`);
    }, PERFORMANCE_TIMEOUT);
  });

  describe('Configuration Performance', () => {
    test('should handle rapid configuration updates', async () => {
      const metrics = await measurePerformance(() => {
        const updates = {
          video: {
            ...DEFAULT_CONFIG.video,
            fps: Math.floor(Math.random() * 60) + 1
          }
        };
        configManager.updateConfig(updates);
      }, 1000);

      expect(metrics.duration).toBeLessThan(5000); // 1000 updates in under 5 seconds
      
      console.log(`✓ Configuration updates: ${metrics.duration.toFixed(2)}ms for ${metrics.operations} updates`);
      console.log(`  Average per update: ${(metrics.duration / metrics.operations).toFixed(2)}ms`);
    }, PERFORMANCE_TIMEOUT);

    test('should efficiently manage quality profiles', async () => {
      const metrics = await measurePerformance(() => {
        const profiles = configManager.getProfiles();
        const profile = configManager.getProfile('medium');
        configManager.setActiveProfile('high');
        configManager.setActiveProfile('medium');
      }, 500);

      expect(metrics.duration).toBeLessThan(2000);
      
      console.log(`✓ Profile operations: ${metrics.duration.toFixed(2)}ms for ${metrics.operations} cycles`);
    }, PERFORMANCE_TIMEOUT);
  });

  describe('FFmpeg Command Building Performance', () => {
    test('should build commands efficiently', async () => {
      const commandBuilder = new FFmpegCommandBuilder();
      
      const testConfig = {
        video: DEFAULT_CONFIG.video,
        audio: DEFAULT_CONFIG.audio,
        output: DEFAULT_CONFIG.output,
        profile: configManager.getProfile('medium')!,
        outputPath: '/test/output.mkv'
      };

      const metrics = await measurePerformance(() => {
        commandBuilder.buildRecordingCommand(testConfig);
      }, 1000);

      expect(metrics.duration).toBeLessThan(2000);
      
      console.log(`✓ Command building: ${metrics.duration.toFixed(2)}ms for ${metrics.operations} commands`);
      console.log(`  Average per command: ${(metrics.duration / metrics.operations).toFixed(2)}ms`);
    }, PERFORMANCE_TIMEOUT);
  });

  describe('Memory Usage Tests', () => {
    test('should maintain reasonable memory usage during operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform various operations
      for (let i = 0; i < 100; i++) {
        configManager.updateConfig({ video: { ...DEFAULT_CONFIG.video, fps: i % 60 + 1 } });
        stateManager.startRecording(`/test/recording-${i}.mkv`);
        stateManager.stopRecording();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB for 100 operations)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      console.log(`✓ Memory usage after 100 operations:`);
      console.log(`  Initial: ${formatMemory(initialMemory)}`);
      console.log(`  Final: ${formatMemory(finalMemory)}`);
      console.log(`  Increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
    }, PERFORMANCE_TIMEOUT);
  });

  describe('Stress Testing', () => {
    test('should handle concurrent operations', async () => {
      const operations = [];
      
      // Create multiple concurrent operations
      for (let i = 0; i < 50; i++) {
        operations.push(
          (async () => {
            const config = new ConfigManager();
            const state = new AppStateManager(config);
            
            // Perform rapid operations
            for (let j = 0; j < 10; j++) {
              state.setActiveProfile(['low', 'medium', 'high'][j % 3]);
              await new Promise(resolve => setTimeout(resolve, 1));
            }
            
            state.destroy();
            config.destroy();
          })()
        );
      }
      
      const startTime = performance.now();
      await Promise.all(operations);
      const duration = performance.now() - startTime;
      
      expect(duration).toBeLessThan(10000); // Should complete in under 10 seconds
      
      console.log(`✓ Concurrent operations: ${duration.toFixed(2)}ms for 50 concurrent tasks`);
    }, PERFORMANCE_TIMEOUT);

    test('should handle rapid profile switching', async () => {
      const profiles = ['low', 'medium', 'high'];
      
      const metrics = await measurePerformance(() => {
        const profileId = profiles[Math.floor(Math.random() * profiles.length)];
        stateManager.setActiveProfile(profileId);
      }, 2000);

      expect(metrics.duration).toBeLessThan(5000);
      
      console.log(`✓ Rapid profile switching: ${metrics.duration.toFixed(2)}ms for ${metrics.operations} switches`);
    }, PERFORMANCE_TIMEOUT);
  });
});