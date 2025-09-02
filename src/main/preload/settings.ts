import { contextBridge, ipcRenderer } from 'electron';
import { AppConfig, RecordingSession, AudioDevice, VideoCapability } from '../types';

/**
 * Settings Preload Script
 * Provides secure IPC communication between main and renderer processes
 */

// Define the API that will be available in the renderer process
export interface ElectronAPI {
  // Configuration
  getConfig(): Promise<AppConfig>;
  updateConfig(config: Partial<AppConfig>): Promise<boolean>;
  resetConfig(): Promise<boolean>;

  // Recording
  startRecording(): Promise<boolean>;
  stopRecording(): Promise<boolean>;
  getRecordingStatus(): Promise<{
    isRecording: boolean;
    session?: RecordingSession;
  }>;

  // Devices
  getAudioDevices(): Promise<AudioDevice[]>;
  getVideoCapabilities(): Promise<VideoCapability[]>;
  refreshDevices(): Promise<void>;
  testAudioDevice(deviceName: string): Promise<{ success: boolean; error?: string }>;

  // Profiles
  getActiveProfile(): Promise<string>;
  setActiveProfile(profileId: string): Promise<boolean>;

  // System
  getSystemInfo(): Promise<{
    platform: string;
    version: string;
    ffmpegPath?: string;
    freeSpace: number;
  }>;
  
  openPath(path: string): Promise<void>;
  showItemInFolder(path: string): Promise<void>;

  // Events
  onConfigUpdated(callback: (config: AppConfig) => void): void;
  onRecordingStateChanged(callback: (state: { isRecording: boolean; session?: RecordingSession }) => void): void;
  onDevicesUpdated(callback: (devices: { audio: AudioDevice[]; video: VideoCapability[] }) => void): void;
  
  // Cleanup
  removeAllListeners(): void;
}

// IPC API implementation
const electronAPI: ElectronAPI = {
  // Configuration
  getConfig: () => ipcRenderer.invoke('config:get'),
  updateConfig: (config) => ipcRenderer.invoke('config:update', config),
  resetConfig: () => ipcRenderer.invoke('config:reset'),

  // Recording
  startRecording: () => ipcRenderer.invoke('recording:start'),
  stopRecording: () => ipcRenderer.invoke('recording:stop'),
  getRecordingStatus: () => ipcRenderer.invoke('recording:status'),

  // Devices
  getAudioDevices: () => ipcRenderer.invoke('devices:audio'),
  getVideoCapabilities: () => ipcRenderer.invoke('devices:video'),
  refreshDevices: () => ipcRenderer.invoke('devices:refresh'),
  testAudioDevice: (deviceName) => ipcRenderer.invoke('devices:test-audio', deviceName),

  // Profiles
  getActiveProfile: () => ipcRenderer.invoke('profile:get-active'),
  setActiveProfile: (profileId) => ipcRenderer.invoke('profile:set-active', profileId),

  // System
  getSystemInfo: () => ipcRenderer.invoke('system:info'),
  openPath: (path) => ipcRenderer.invoke('system:open-path', path),
  showItemInFolder: (path) => ipcRenderer.invoke('system:show-item', path),

  // Events
  onConfigUpdated: (callback) => {
    ipcRenderer.on('config:updated', (_, config) => callback(config));
  },
  
  onRecordingStateChanged: (callback) => {
    ipcRenderer.on('recording:state-changed', (_, state) => callback(state));
  },
  
  onDevicesUpdated: (callback) => {
    ipcRenderer.on('devices:updated', (_, devices) => callback(devices));
  },

  // Cleanup
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('config:updated');
    ipcRenderer.removeAllListeners('recording:state-changed');
    ipcRenderer.removeAllListeners('devices:updated');
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for the renderer process
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}