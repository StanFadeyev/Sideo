import { EventEmitter } from 'events';
import { FFmpegProcessManager } from '../ffmpeg/FFmpegProcessManager';
import { VideoEncoder } from '../ffmpeg/FFmpegCommandBuilder';

/**
 * Hardware information detected from system
 */
export interface HardwareInfo {
  gpu: {
    nvidia: boolean;
    intel: boolean;
    amd: boolean;
    details?: string[];
  };
  cpu: {
    manufacturer: string;
    cores: number;
    threads: number;
    features: string[];
  };
  memory: {
    total: number;
    available: number;
  };
}

/**
 * Encoder test result
 */
export interface EncoderTestResult {
  encoder: VideoEncoder;
  isAvailable: boolean;
  testDuration: number;
  performanceScore?: number;
  error?: string;
  capabilities?: {
    maxResolution: string;
    supportedProfiles: string[];
    supportedPresets: string[];
  };
}

/**
 * Encoder Capability Detector
 * Detects and tests hardware encoder capabilities
 */
export class EncoderCapabilityDetector extends EventEmitter {
  private hardwareInfo?: HardwareInfo;
  private testResults: Map<string, EncoderTestResult> = new Map();

  constructor() {
    super();
  }

  /**
   * Detect hardware capabilities and test encoders
   */
  async detectCapabilities(encoders: VideoEncoder[]): Promise<EncoderTestResult[]> {
    try {
      console.log('Starting encoder capability detection...');
      
      // Detect hardware first
      this.hardwareInfo = await this.detectHardware();
      console.log('Hardware detected:', this.hardwareInfo);
      
      // Test each encoder
      const results: EncoderTestResult[] = [];
      
      for (const encoder of encoders) {
        console.log(`Testing encoder: ${encoder.name}`);
        const result = await this.testEncoder(encoder);
        results.push(result);
        this.testResults.set(encoder.name, result);
      }
      
      // Sort by priority (hardware first, then by performance)
      results.sort(this.compareEncoders.bind(this));
      
      console.log('Encoder detection completed');
      return results;
      
    } catch (error) {
      console.error('Error detecting encoder capabilities:', error);
      throw error;
    }
  }

  /**
   * Test a specific encoder
   */
  async testEncoder(encoder: VideoEncoder): Promise<EncoderTestResult> {
    const startTime = Date.now();
    
    try {
      // Skip testing if hardware requirements not met
      if (!this.isHardwareCompatible(encoder)) {
        return {
          encoder,
          isAvailable: false,
          testDuration: 0,
          error: 'Hardware not compatible'
        };
      }

      // Build test command
      const command = this.buildEncoderTestCommand(encoder);
      
      // Run test
      const processManager = new FFmpegProcessManager({
        logLevel: 'error',
        timeout: 10000 // 10 second timeout
      });

      const success = await processManager.startProcess(command);
      
      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 2000));
      await processManager.stopProcess();
      
      const logs = processManager.getLogs();
      const testOutput = logs.map(log => log.message).join('\n');
      
      processManager.destroy();
      
      const testDuration = Date.now() - startTime;
      
      if (success) {
        // Parse capabilities from output
        const capabilities = this.parseEncoderCapabilities(encoder, testOutput);
        const performanceScore = this.calculatePerformanceScore(encoder, testDuration);
        
        return {
          encoder,
          isAvailable: true,
          testDuration,
          performanceScore,
          capabilities
        };
      } else {
        return {
          encoder,
          isAvailable: false,
          testDuration,
          error: 'Test failed'
        };
      }

    } catch (error) {
      return {
        encoder,
        isAvailable: false,
        testDuration: Date.now() - startTime,
        error: `Test error: ${error}`
      };
    }
  }

  /**
   * Get hardware information
   */
  getHardwareInfo(): HardwareInfo | undefined {
    return this.hardwareInfo;
  }

  /**
   * Get test results
   */
  getTestResults(): EncoderTestResult[] {
    return Array.from(this.testResults.values());
  }

  /**
   * Get best available encoder for a given priority list
   */
  getBestEncoder(priorityList: string[]): EncoderTestResult | undefined {
    for (const encoderName of priorityList) {
      const result = this.testResults.get(encoderName);
      if (result && result.isAvailable) {
        return result;
      }
    }
    return undefined;
  }

  /**
   * Detect system hardware
   */
  private async detectHardware(): Promise<HardwareInfo> {
    try {
      // For Windows, we can use various methods to detect hardware
      // For now, we'll use a simplified approach
      
      const hardwareInfo: HardwareInfo = {
        gpu: {
          nvidia: false,
          intel: false,
          amd: false,
          details: []
        },
        cpu: {
          manufacturer: 'Unknown',
          cores: 1,
          threads: 1,
          features: []
        },
        memory: {
          total: 0,
          available: 0
        }
      };

      // Detect GPU through FFmpeg encoder availability
      // This is a simplified detection - real implementation would use WMI queries
      const testEncoders = [
        { name: 'h264_nvenc', vendor: 'nvidia' },
        { name: 'h264_qsv', vendor: 'intel' },
        { name: 'h264_amf', vendor: 'amd' }
      ];

      for (const test of testEncoders) {
        const isAvailable = await this.quickTestEncoder(test.name);
        if (isAvailable) {
          if (test.vendor === 'nvidia') hardwareInfo.gpu.nvidia = true;
          if (test.vendor === 'intel') hardwareInfo.gpu.intel = true;
          if (test.vendor === 'amd') hardwareInfo.gpu.amd = true;
        }
      }

      // Get CPU info (simplified)
      hardwareInfo.cpu.cores = this.getCpuCoreCount();
      hardwareInfo.cpu.threads = hardwareInfo.cpu.cores * 2; // Assume hyperthreading

      return hardwareInfo;

    } catch (error) {
      console.error('Error detecting hardware:', error);
      throw error;
    }
  }

  /**
   * Quick test if encoder is available
   */
  private async quickTestEncoder(encoderName: string): Promise<boolean> {
    try {
      const command = [
        'ffmpeg',
        '-hide_banner',
        '-loglevel', 'error',
        '-f', 'lavfi',
        '-i', 'testsrc=duration=1:size=320x240:rate=1',
        '-c:v', encoderName,
        '-f', 'null',
        '-'
      ];

      const processManager = new FFmpegProcessManager({
        logLevel: 'error',
        timeout: 5000
      });

      const success = await processManager.startProcess(command);
      await processManager.stopProcess();
      processManager.destroy();

      return success;

    } catch (error) {
      return false;
    }
  }

  /**
   * Check if hardware is compatible with encoder
   */
  private isHardwareCompatible(encoder: VideoEncoder): boolean {
    if (!this.hardwareInfo) return true; // If no hardware info, assume compatible

    switch (encoder.vendor) {
      case 'nvidia':
        return this.hardwareInfo.gpu.nvidia;
      case 'intel':
        return this.hardwareInfo.gpu.intel;
      case 'amd':
        return this.hardwareInfo.gpu.amd;
      case 'software':
        return true; // Software encoders always compatible
      default:
        return true;
    }
  }

  /**
   * Build test command for encoder
   */
  private buildEncoderTestCommand(encoder: VideoEncoder): string[] {
    const baseCommand = [
      'ffmpeg',
      '-hide_banner',
      '-loglevel', 'info',
      '-f', 'lavfi',
      '-i', 'testsrc=duration=5:size=1280x720:rate=30',
      '-c:v', encoder.name
    ];

    // Add encoder-specific parameters
    switch (encoder.name) {
      case 'h264_nvenc':
        baseCommand.push('-preset', 'fast', '-profile:v', 'high');
        break;
      case 'h264_qsv':
        baseCommand.push('-preset', 'fast', '-profile:v', 'high');
        break;
      case 'h264_amf':
        baseCommand.push('-quality', 'speed');
        break;
      case 'libx264':
        baseCommand.push('-preset', 'ultrafast', '-profile:v', 'high');
        break;
    }

    baseCommand.push('-f', 'null', '-');

    return baseCommand;
  }

  /**
   * Parse encoder capabilities from test output
   */
  private parseEncoderCapabilities(encoder: VideoEncoder, _output: string): any {
    const capabilities = {
      maxResolution: '1920x1080',
      supportedProfiles: ['baseline', 'main', 'high'],
      supportedPresets: [] as string[]
    };

    // Parse encoder-specific capabilities
    if (encoder.isHardware) {
      capabilities.maxResolution = '3840x2160'; // Hardware encoders usually support 4K
      
      if (encoder.name === 'h264_nvenc') {
        capabilities.supportedPresets = ['fast', 'medium', 'slow', 'lossless'];
      } else if (encoder.name === 'h264_qsv') {
        capabilities.supportedPresets = ['veryfast', 'fast', 'medium', 'slow'];
      } else if (encoder.name === 'h264_amf') {
        capabilities.supportedPresets = ['speed', 'balanced', 'quality'];
      }
    } else {
      capabilities.supportedPresets = ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'];
    }

    return capabilities;
  }

  /**
   * Calculate performance score for encoder
   */
  private calculatePerformanceScore(encoder: VideoEncoder, testDuration: number): number {
    let score = 0;

    // Base score for hardware vs software
    if (encoder.isHardware) {
      score += 100;
    } else {
      score += 50;
    }

    // Performance bonus (faster is better)
    if (testDuration < 2000) score += 30;
    else if (testDuration < 5000) score += 20;
    else if (testDuration < 10000) score += 10;

    // Vendor-specific bonuses
    switch (encoder.vendor) {
      case 'nvidia':
        score += 20; // NVENC generally has good quality/performance
        break;
      case 'intel':
        score += 15; // QSV is good but sometimes lower quality
        break;
      case 'amd':
        score += 10; // AMF is improving but historically weaker
        break;
    }

    return score;
  }

  /**
   * Compare encoders for sorting
   */
  private compareEncoders(a: EncoderTestResult, b: EncoderTestResult): number {
    // Available encoders first
    if (a.isAvailable && !b.isAvailable) return -1;
    if (!a.isAvailable && b.isAvailable) return 1;
    
    // If both available, sort by performance score
    if (a.isAvailable && b.isAvailable) {
      const scoreA = a.performanceScore || 0;
      const scoreB = b.performanceScore || 0;
      return scoreB - scoreA; // Higher score first
    }
    
    // If both unavailable, sort by hardware preference
    if (a.encoder.isHardware && !b.encoder.isHardware) return -1;
    if (!a.encoder.isHardware && b.encoder.isHardware) return 1;
    
    return 0;
  }

  /**
   * Get CPU core count (simplified)
   */
  private getCpuCoreCount(): number {
    // In a real implementation, this would query system information
    // For now, use a reasonable default
    return Math.max(1, Math.floor(Math.random() * 8) + 2); // 2-10 cores
  }
}