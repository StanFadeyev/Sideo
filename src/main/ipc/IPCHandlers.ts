import { ipcMain, shell } from 'electron';
import { ConfigManager } from '../config/ConfigManager';
import { AppStateManager } from '../core/AppStateManager';
import { DeviceManager } from '../devices/DeviceManager';
import { AppConfig, DEFAULT_CONFIG } from '../types';
import { app } from 'electron';

/**
 * IPC Handlers
 * Handles communication between main and renderer processes
 */
export class IPCHandlers {
  private configManager: ConfigManager;
  private stateManager: AppStateManager;
  private deviceManager: DeviceManager;

  constructor(
    configManager: ConfigManager,
    stateManager: AppStateManager,
    deviceManager: DeviceManager
  ) {
    this.configManager = configManager;
    this.stateManager = stateManager;
    this.deviceManager = deviceManager;
  }

  /**
   * Register all IPC handlers
   */
  registerHandlers(): void {
    console.log('Registering IPC handlers...');

    // Configuration handlers
    ipcMain.handle('config:get', () => this.handleGetConfig());
    ipcMain.handle('config:update', (_, config: Partial<AppConfig>) => this.handleUpdateConfig(config));
    ipcMain.handle('config:reset', () => this.handleResetConfig());

    // Recording handlers
    ipcMain.handle('recording:start', () => this.handleStartRecording());
    ipcMain.handle('recording:stop', () => this.handleStopRecording());
    ipcMain.handle('recording:status', () => this.handleGetRecordingStatus());

    // Device handlers
    ipcMain.handle('devices:audio', () => this.handleGetAudioDevices());
    ipcMain.handle('devices:video', () => this.handleGetVideoCapabilities());
    ipcMain.handle('devices:refresh', () => this.handleRefreshDevices());
    ipcMain.handle('devices:test-audio', (_, deviceName: string) => this.handleTestAudioDevice(deviceName));

    // Profile handlers
    ipcMain.handle('profile:get-active', () => this.handleGetActiveProfile());
    ipcMain.handle('profile:set-active', (_, profileId: string) => this.handleSetActiveProfile(profileId));

    // System handlers
    ipcMain.handle('system:info', () => this.handleGetSystemInfo());
    ipcMain.handle('system:open-path', (_, path: string) => this.handleOpenPath(path));
    ipcMain.handle('system:show-item', (_, path: string) => this.handleShowItemInFolder(path));

    console.log('IPC handlers registered successfully');
  }

  /**
   * Send events to renderer processes
   */
  private sendToRenderers(_channel: string, _data: any): void {
    // This would send to all renderer windows if we had multiple
    // For now, we'll use the event system to notify components
  }

  // Configuration handlers
  private async handleGetConfig(): Promise<AppConfig> {
    return this.configManager.getConfig();
  }

  private async handleUpdateConfig(config: Partial<AppConfig>): Promise<boolean> {
    try {
      const success = await this.configManager.updateConfig(config);
      if (success) {
        // Notify all renderers about config update
        this.sendToRenderers('config:updated', this.configManager.getConfig());
      }
      return success;
    } catch (error) {
      console.error('Failed to update config:', error);
      return false;
    }
  }

  private async handleResetConfig(): Promise<boolean> {
    try {
      const success = await this.configManager.updateConfig(DEFAULT_CONFIG);
      // Reset to defaults by updating with default config
      // Since resetToDefaults doesn't exist, we'll implement it via updateConfig
      if (success) {
        this.sendToRenderers('config:updated', this.configManager.getConfig());
      }
      return success;
    } catch (error) {
      console.error('Failed to reset config:', error);
      return false;
    }
  }

  // Recording handlers
  private async handleStartRecording(): Promise<boolean> {
    try {
      return await this.stateManager.startRecording('auto-generated-path');
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }

  private async handleStopRecording(): Promise<boolean> {
    try {
      return await this.stateManager.stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return false;
    }
  }

  private async handleGetRecordingStatus(): Promise<{ isRecording: boolean; session?: any }> {
    return {
      isRecording: this.stateManager.isRecording(),
      session: this.stateManager.getCurrentSession()
    };
  }

  // Device handlers
  private async handleGetAudioDevices(): Promise<any[]> {
    try {
      return this.deviceManager.getAudioDevices();
    } catch (error) {
      console.error('Failed to get audio devices:', error);
      return [];
    }
  }

  private async handleGetVideoCapabilities(): Promise<any[]> {
    try {
      return this.deviceManager.getVideoCapabilities();
    } catch (error) {
      console.error('Failed to get video capabilities:', error);
      return [];
    }
  }

  private async handleRefreshDevices(): Promise<void> {
    try {
      await this.deviceManager.refreshDevices();
      
      // Notify renderers about device update
      this.sendToRenderers('devices:updated', {
        audio: this.deviceManager.getAudioDevices(),
        video: this.deviceManager.getVideoCapabilities()
      });
    } catch (error) {
      console.error('Failed to refresh devices:', error);
    }
  }

  private async handleTestAudioDevice(deviceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.deviceManager.validateAudioDevice(deviceName);
      return { success: result.isValid, error: result.error };
    } catch (error) {
      console.error('Failed to test audio device:', error);
      return { success: false, error: `Test failed: ${error}` };
    }
  }

  // Profile handlers
  private async handleGetActiveProfile(): Promise<string> {
    return this.stateManager.getActiveProfile();
  }

  private async handleSetActiveProfile(profileId: string): Promise<boolean> {
    try {
      this.stateManager.setActiveProfile(profileId);
      return true;
    } catch (error) {
      console.error('Failed to set active profile:', error);
      return false;
    }
  }

  // System handlers
  private async handleGetSystemInfo(): Promise<any> {
    try {
      const config = this.configManager.getConfig();
      
      // Get free space for recordings folder
      let freeSpace = 0;
      try {
        // Note: This is a simplified approach - in production you'd want to use a proper disk space library
        freeSpace = 1024 * 1024 * 1024; // Placeholder: 1GB
      } catch (error) {
        console.warn('Could not get free space:', error);
      }

      return {
        platform: process.platform,
        version: app.getVersion(),
        ffmpegPath: config.advanced.ffmpeg_path,
        freeSpace
      };
    } catch (error) {
      console.error('Failed to get system info:', error);
      return {
        platform: process.platform,
        version: app.getVersion(),
        freeSpace: 0
      };
    }
  }

  private async handleOpenPath(path: string): Promise<void> {
    try {
      await shell.openPath(path);
    } catch (error) {
      console.error('Failed to open path:', error);
    }
  }

  private async handleShowItemInFolder(path: string): Promise<void> {
    try {
      shell.showItemInFolder(path);
    } catch (error) {
      console.error('Failed to show item in folder:', error);
    }
  }

  /**
   * Cleanup handlers
   */
  cleanup(): void {
    ipcMain.removeAllListeners('config:get');
    ipcMain.removeAllListeners('config:update');
    ipcMain.removeAllListeners('config:reset');
    ipcMain.removeAllListeners('recording:start');
    ipcMain.removeAllListeners('recording:stop');
    ipcMain.removeAllListeners('recording:status');
    ipcMain.removeAllListeners('devices:audio');
    ipcMain.removeAllListeners('devices:video');
    ipcMain.removeAllListeners('devices:refresh');
    ipcMain.removeAllListeners('devices:test-audio');
    ipcMain.removeAllListeners('profile:get-active');
    ipcMain.removeAllListeners('profile:set-active');
    ipcMain.removeAllListeners('system:info');
    ipcMain.removeAllListeners('system:open-path');
    ipcMain.removeAllListeners('system:show-item');
  }
}