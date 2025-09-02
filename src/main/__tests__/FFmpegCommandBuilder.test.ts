import { FFmpegCommandBuilder, VideoEncoder, FFmpegRecordingConfig } from '../ffmpeg/FFmpegCommandBuilder';
import { DEFAULT_CONFIG, DEFAULT_PROFILES } from '../types';

describe('FFmpegCommandBuilder', () => {
  let commandBuilder: FFmpegCommandBuilder;

  beforeEach(() => {
    commandBuilder = new FFmpegCommandBuilder();
  });

  describe('Initialization', () => {
    test('should initialize with default encoders', () => {
      const encoders = commandBuilder.getAvailableEncoders();
      
      expect(encoders).toHaveLength(4); // h264_nvenc, h264_qsv, h264_amf, libx264
      expect(encoders.some(e => e.name === 'libx264')).toBe(true);
      expect(encoders.some(e => e.name === 'h264_nvenc')).toBe(true);
    });

    test('should provide encoder definitions', () => {
      const definitions = commandBuilder.getEncoderDefinitions();
      
      expect(definitions).toHaveLength(4);
      definitions.forEach(encoder => {
        expect(encoder).toHaveProperty('name');
        expect(encoder).toHaveProperty('displayName');
        expect(encoder).toHaveProperty('isHardware');
        expect(encoder).toHaveProperty('vendor');
        expect(encoder).toHaveProperty('testCommand');
      });
    });
  });

  describe('Encoder Management', () => {
    test('should update encoder availability', () => {
      commandBuilder.updateEncoderAvailability('h264_nvenc', true);
      
      const encoders = commandBuilder.getAvailableEncoders();
      const nvencEncoder = encoders.find(e => e.name === 'h264_nvenc');
      
      expect(nvencEncoder?.isAvailable).toBe(true);
    });

    test('should build encoder test command', () => {
      const nvencEncoder: VideoEncoder = {
        name: 'h264_nvenc',
        displayName: 'NVIDIA NVENC',
        isHardware: true,
        vendor: 'nvidia',
        testCommand: ['-f', 'lavfi', '-i', 'testsrc=duration=1:size=320x240:rate=1', '-c:v', 'h264_nvenc', '-f', 'null', '-']
      };

      const testCommand = commandBuilder.buildEncoderTestCommand(nvencEncoder);
      
      expect(testCommand).toContain('ffmpeg');
      expect(testCommand).toContain('-c:v');
      expect(testCommand).toContain('h264_nvenc');
    });

    test('should prioritize encoders correctly', () => {
      // Mark some encoders as available
      commandBuilder.updateEncoderAvailability('h264_nvenc', false);
      commandBuilder.updateEncoderAvailability('h264_qsv', false);
      commandBuilder.updateEncoderAvailability('libx264', true);

      const encoders = commandBuilder.getAvailableEncoders();
      const availableEncoders = encoders.filter(e => e.isAvailable);
      
      expect(availableEncoders.length).toBeGreaterThan(0);
      expect(availableEncoders.some(e => e.name === 'libx264')).toBe(true);
    });
  });

  describe('Recording Command Building', () => {
    let testConfig: FFmpegRecordingConfig;

    beforeEach(() => {
      testConfig = {
        video: DEFAULT_CONFIG.video,
        audio: DEFAULT_CONFIG.audio,
        output: DEFAULT_CONFIG.output,
        profile: DEFAULT_PROFILES[1], // Medium quality
        outputPath: '/test/output/recording.mkv'
      };
    });

    test('should build complete recording command', () => {
      const command = commandBuilder.buildRecordingCommand(testConfig);
      
      expect(command).toContain('ffmpeg');
      expect(command).toContain('-y'); // Overwrite output
      expect(command).toContain('-hide_banner');
      expect(command).toContain('/test/output/recording.mkv');
    });

    test('should build desktop capture command', () => {
      testConfig.video.source = 'desktop';
      
      const command = commandBuilder.buildRecordingCommand(testConfig);
      
      expect(command).toContain('-f');
      expect(command).toContain('gdigrab');
      expect(command).toContain('-i');
      expect(command).toContain('desktop');
    });

    test('should build region capture command', () => {
      testConfig.video.source = 'region';
      testConfig.video.region = {
        offset_x: 100,
        offset_y: 200,
        width: 1280,
        height: 720,
        enabled: true
      };
      
      const command = commandBuilder.buildRecordingCommand(testConfig);
      
      expect(command).toContain('-offset_x');
      expect(command).toContain('100');
      expect(command).toContain('-offset_y');
      expect(command).toContain('200');
      expect(command).toContain('-video_size');
      expect(command).toContain('1280x720');
    });

    test('should build secondary display capture command', () => {
      testConfig.video.source = 'secondary';
      
      const command = commandBuilder.buildRecordingCommand(testConfig);
      
      expect(command).toContain('-offset_x');
      expect(command).toContain('1920'); // Default primary monitor width
    });

    test('should include audio inputs when enabled', () => {
      testConfig.audio.enable_system_audio = true;
      testConfig.audio.system_device = 'Speakers (Realtek Audio)';
      
      const command = commandBuilder.buildRecordingCommand(testConfig);
      
      expect(command).toContain('-f');
      expect(command).toContain('dshow');
      expect(command).toContain('audio="Speakers (Realtek Audio)"');
    });

    test('should include microphone input when enabled', () => {
      testConfig.audio.enable_mic_audio = true;
      testConfig.audio.mic_device = 'Microphone (USB Audio)';
      
      const command = commandBuilder.buildRecordingCommand(testConfig);
      
      expect(command).toContain('audio="Microphone (USB Audio)"');
    });

    test('should build video encoding options', () => {
      const command = commandBuilder.buildRecordingCommand(testConfig);
      
      // Should contain video codec
      expect(command.some(arg => arg.startsWith('-c:v'))).toBe(true);
      
      // Should contain bitrate settings
      expect(command).toContain('-b:v');
      expect(command).toContain('8000k'); // From medium profile
    });

    test('should build audio encoding options', () => {
      testConfig.audio.enable_system_audio = true;
      
      const command = commandBuilder.buildRecordingCommand(testConfig);
      
      // Should contain audio codec
      expect(command).toContain('-c:a');
      expect(command).toContain('aac');
      
      // Should contain audio bitrate
      expect(command).toContain('-b:a');
      expect(command).toContain('160k'); // From medium profile
    });

    test('should handle different output containers', () => {
      testConfig.output.container = 'mp4';
      testConfig.outputPath = '/test/output/recording.mp4';
      
      const command = commandBuilder.buildRecordingCommand(testConfig);
      
      expect(command).toContain('/test/output/recording.mp4');
    });
  });

  describe('Filter Complex Building', () => {
    test('should build audio mixing filter when both system and mic audio enabled', () => {
      const audioConfig = {
        ...DEFAULT_CONFIG.audio,
        enable_system_audio: true,
        enable_mic_audio: true,
        mix_mic_with_system: true,
        system_device: 'Speakers',
        mic_device: 'Microphone'
      };

      // Access private method through any casting for testing
      const filterComplex = (commandBuilder as any).buildFilterComplex(audioConfig);
      
      expect(Array.isArray(filterComplex)).toBe(true);
      if (filterComplex.length > 0) {
        expect(filterComplex.join(';')).toContain('amix');
      }
    });

    test('should handle empty filter complex when no mixing needed', () => {
      const audioConfig = {
        ...DEFAULT_CONFIG.audio,
        enable_system_audio: true,
        enable_mic_audio: false
      };

      const filterComplex = (commandBuilder as any).buildFilterComplex(audioConfig);
      
      expect(Array.isArray(filterComplex)).toBe(true);
    });
  });

  describe('Output Options', () => {
    test('should build output options with segmentation', () => {
      const outputConfig = {
        ...DEFAULT_CONFIG.output,
        segment_enabled: true,
        segment_minutes: 30
      };

      const outputOptions = (commandBuilder as any).buildOutputOptions(outputConfig);
      
      expect(Array.isArray(outputOptions)).toBe(true);
      if (outputConfig.segment_enabled) {
        expect(outputOptions.some((opt: string) => opt.includes('segment'))).toBe(true);
      }
    });

    test('should build output options without segmentation', () => {
      const outputConfig = {
        ...DEFAULT_CONFIG.output,
        segment_enabled: false
      };

      const outputOptions = (commandBuilder as any).buildOutputOptions(outputConfig);
      
      expect(Array.isArray(outputOptions)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    let testConfig: FFmpegRecordingConfig;

    beforeEach(() => {
      testConfig = {
        video: DEFAULT_CONFIG.video,
        audio: DEFAULT_CONFIG.audio,
        output: DEFAULT_CONFIG.output,
        profile: DEFAULT_PROFILES[1], // Medium quality
        outputPath: '/test/output/recording.mkv'
      };
    });

    test('should handle invalid encoder gracefully', () => {
      const invalidEncoder: VideoEncoder = {
        name: 'invalid_encoder',
        displayName: 'Invalid Encoder',
        isHardware: false,
        vendor: 'software',
        testCommand: []
      };

      expect(() => {
        commandBuilder.buildEncoderTestCommand(invalidEncoder);
      }).not.toThrow();
    });

    test('should handle missing audio devices gracefully', () => {
      const configWithNoAudio = {
        ...testConfig,
        audio: {
          ...DEFAULT_CONFIG.audio,
          enable_system_audio: false,
          enable_mic_audio: false,
          system_device: '',
          mic_device: ''
        }
      };

      expect(() => {
        commandBuilder.buildRecordingCommand(configWithNoAudio);
      }).not.toThrow();
    });

    test('should handle invalid video source gracefully', () => {
      const configWithInvalidSource = {
        ...testConfig,
        video: {
          ...DEFAULT_CONFIG.video,
          source: 'invalid-source' as any
        }
      };

      expect(() => {
        commandBuilder.buildRecordingCommand(configWithInvalidSource);
      }).not.toThrow();
    });
  });
});