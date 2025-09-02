// Configuration type definitions for Sideo application

export interface AppConfig {
  output: OutputConfig;
  video: VideoConfig;
  audio: AudioConfig;
  ui: UIConfig;
  safety: SafetyConfig;
  advanced: AdvancedConfig;
}

export interface OutputConfig {
  folder: string;
  container: 'mkv' | 'mp4';
  filename_template: string;
  segment_enabled: boolean;
  segment_minutes: number;
}

export interface VideoConfig {
  source: 'desktop' | 'region' | 'window' | 'secondary';
  region?: RegionConfig;
  fps: number;
  encoder_priority: string[];
  bitrate_kbps: number;
  maxrate_kbps: number;
  bufsize_kbps: number;
  draw_mouse: boolean;
}

export interface RegionConfig {
  offset_x: number;
  offset_y: number;
  width: number;
  height: number;
  enabled: boolean;
}

export interface AudioConfig {
  system_device: string;
  mic_device: string;
  mix_mic_with_system: boolean;
  aac_bitrate_kbps: number;
  enable_system_audio: boolean;
  enable_mic_audio: boolean;
  mic_volume: number;
  system_volume: number;
}

export interface UIConfig {
  hotkey_start_stop: string;
  show_notifications: boolean;
  minimize_to_tray_on_start: boolean;
}

export interface SafetyConfig {
  min_free_space_mb: number;
  prevent_sleep_while_recording: boolean;
  max_duration_minutes: number;
}

export interface AdvancedConfig {
  ffmpeg_path: string;
  stderr_log_level: 'error' | 'warning' | 'info' | 'debug';
  thread_count: number;
  buffer_size_mb: number;
  enable_auto_recovery: boolean;
  enable_performance_monitoring: boolean;
}

// Recording Session Model
export interface RecordingSession {
  id: string;
  start_time: Date;
  end_time?: Date;
  profile: string;
  output_path: string;
  status: 'recording' | 'stopped' | 'error';
  file_size_bytes?: number;
  duration_seconds?: number;
  error_message?: string;
}

// Quality Profiles
export interface QualityProfile {
  id: string;
  name: string;
  subtitle: string;
  video: VideoProfileConfig;
  audio: AudioProfileConfig;
  description: string;
}

export interface VideoProfileConfig {
  resolution: string;
  fps: number;
  bitrate_kbps: number;
  encoder_priority: string[];
}

export interface AudioProfileConfig {
  bitrate_kbps: number;
  codec: string;
}

// Device Models
export interface AudioDevice {
  id: string;
  name: string;
  type: 'input' | 'output';
  is_default: boolean;
  is_available: boolean;
}

export interface VideoCapability {
  encoder: string;
  hardware_accelerated: boolean;
  max_resolution: string;
  supported_formats: string[];
}

// Application State
export interface AppState {
  isRecording: boolean;
  recordingSession?: RecordingSession;
  activeProfile: string;
  audioDevices: AudioDevice[];
  videoCapabilities: VideoCapability[];
  config: AppConfig;
}

// Default Configuration
export const DEFAULT_CONFIG: AppConfig = {
  output: {
    folder: 'C:\\Users\\Public\\Documents\\Sideo\\Recordings',
    container: 'mkv',
    filename_template: '{date}_{time}_{profile}',
    segment_enabled: true,
    segment_minutes: 30
  },
  video: {
    source: 'desktop',
    region: {
      offset_x: 0,
      offset_y: 0,
      width: 1920,
      height: 1080,
      enabled: false
    },
    fps: 30,
    encoder_priority: ['h264_nvenc', 'h264_qsv', 'h264_amf', 'libx264'],
    bitrate_kbps: 8000,
    maxrate_kbps: 8000,
    bufsize_kbps: 16000,
    draw_mouse: true
  },
  audio: {
    system_device: '',
    mic_device: '',
    mix_mic_with_system: true,
    aac_bitrate_kbps: 160,
    enable_system_audio: true,
    enable_mic_audio: false,
    mic_volume: 70,
    system_volume: 100
  },
  ui: {
    hotkey_start_stop: 'CommandOrControl+Alt+R',
    show_notifications: true,
    minimize_to_tray_on_start: true
  },
  safety: {
    min_free_space_mb: 1024,
    prevent_sleep_while_recording: true,
    max_duration_minutes: 240
  },
  advanced: {
    ffmpeg_path: '',
    stderr_log_level: 'info',
    thread_count: 0,
    buffer_size_mb: 64,
    enable_auto_recovery: true,
    enable_performance_monitoring: true
  }
};

// Quality Profiles
export const DEFAULT_PROFILES: QualityProfile[] = [
  {
    id: 'low',
    name: 'Low Quality',
    subtitle: 'For weak PCs',
    video: {
      resolution: '1280x720',
      fps: 24,
      bitrate_kbps: 4000,
      encoder_priority: ['h264_nvenc', 'h264_qsv', 'libx264']
    },
    audio: {
      bitrate_kbps: 128,
      codec: 'aac'
    },
    description: 'Optimized for older hardware and slower systems'
  },
  {
    id: 'medium',
    name: 'Medium Quality',
    subtitle: 'Recommended',
    video: {
      resolution: '1920x1080',
      fps: 30,
      bitrate_kbps: 8000,
      encoder_priority: ['h264_nvenc', 'h264_qsv', 'h264_amf', 'libx264']
    },
    audio: {
      bitrate_kbps: 160,
      codec: 'aac'
    },
    description: 'Perfect balance of quality and performance'
  },
  {
    id: 'high',
    name: 'High Quality',
    subtitle: 'Best quality',
    video: {
      resolution: '1920x1080',
      fps: 60,
      bitrate_kbps: 12000,
      encoder_priority: ['h264_nvenc', 'h264_qsv', 'h264_amf', 'libx264']
    },
    audio: {
      bitrate_kbps: 192,
      codec: 'aac'
    },
    description: 'Maximum quality for powerful systems'
  }
];