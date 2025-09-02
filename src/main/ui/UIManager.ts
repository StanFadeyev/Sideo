import { app } from 'electron';
import { TrayManager } from './TrayManager';
import { WindowManager } from './WindowManager';
import { HotkeyManager } from './HotkeyManager';
import { IPCHandlers } from '../ipc/IPCHandlers';
import { ConfigManager } from '../config/ConfigManager';
import { AppStateManager } from '../core/AppStateManager';
import { DeviceManager } from '../devices/DeviceManager';

/**
 * UI Manager
 * Coordinates all UI components (tray, windows, hotkeys, IPC)
 */
export class UIManager {
  private trayManager: TrayManager;
  private windowManager: WindowManager;
  private hotkeyManager: HotkeyManager;
  private ipcHandlers: IPCHandlers;
  private configManager: ConfigManager;
  private stateManager: AppStateManager;
  private deviceManager: DeviceManager;
  private isInitialized = false;

  constructor(
    configManager: ConfigManager,
    stateManager: AppStateManager,
    deviceManager: DeviceManager
  ) {
    this.configManager = configManager;
    this.stateManager = stateManager;
    this.deviceManager = deviceManager;

    // Initialize UI components
    this.trayManager = new TrayManager(stateManager, configManager);
    this.windowManager = new WindowManager(configManager, stateManager);
    this.hotkeyManager = new HotkeyManager(configManager, stateManager);
    this.ipcHandlers = new IPCHandlers(configManager, stateManager, deviceManager);
  }

  /**
   * Initialize UI manager and all components
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing UI manager...');

      // Wait for Electron app to be ready
      if (!app.isReady()) {
        await app.whenReady();
      }

      // Initialize IPC handlers first
      this.ipcHandlers.registerHandlers();

      // Initialize UI components
      const traySuccess = await this.trayManager.initialize();
      if (!traySuccess) {
        console.error('Failed to initialize tray manager');
        return false;
      }

      const windowSuccess = await this.windowManager.initialize();
      if (!windowSuccess) {
        console.error('Failed to initialize window manager');
        return false;
      }

      const hotkeySuccess = await this.hotkeyManager.initialize();
      if (!hotkeySuccess) {
        console.error('Failed to initialize hotkey manager');
        return false;
      }

      // Setup event handlers
      this.setupEventHandlers();

      this.isInitialized = true;
      console.log('UI manager initialized successfully');

      // Show settings window on first run
      const config = this.configManager.getConfig();
      if (!config.ui.minimize_to_tray_on_start) {
        this.showSettingsWindow();
      }

      return true;

    } catch (error) {
      console.error('Failed to initialize UI manager:', error);
      return false;
    }
  }

  /**
   * Show settings window
   */
  showSettingsWindow(): void {
    this.windowManager.showSettingsWindow();
  }

  /**
   * Hide settings window
   */
  hideSettingsWindow(): void {
    this.windowManager.hideSettingsWindow();
  }

  /**
   * Check if settings window is open
   */
  isSettingsWindowOpen(): boolean {
    return this.windowManager.isSettingsWindowOpen();
  }

  /**
   * Get tray manager
   */
  getTrayManager(): TrayManager {
    return this.trayManager;
  }

  /**
   * Get window manager
   */
  getWindowManager(): WindowManager {
    return this.windowManager;
  }

  /**
   * Get hotkey manager
   */
  getHotkeyManager(): HotkeyManager {
    return this.hotkeyManager;
  }

  /**
   * Check if UI is initialized
   */
  isInitializedStatus(): boolean {
    return this.isInitialized;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Handle app events
    app.on('before-quit', () => {
      console.log('App is quitting, cleaning up UI...');
      this.cleanup();
    });

    // Handle configuration changes
    // Note: ConfigManager doesn't emit events, so we'll rely on manual updates
    // this.configManager.on('config-updated', () => {
    //   // UI components will handle their own config updates
    //   console.log('Configuration updated, UI components will refresh');
    // });

    // Handle state changes
    this.stateManager.on('recording-started', (session) => {
      console.log('Recording started, updating UI state');
      this.notifyRenderersRecordingStateChanged(true, session);
    });

    this.stateManager.on('recording-stopped', (session) => {
      console.log('Recording stopped, updating UI state');
      this.notifyRenderersRecordingStateChanged(false, session);
    });

    // Handle device changes
    this.deviceManager.on('devices-updated', (devices) => {
      console.log('Devices updated, notifying UI');
      this.notifyRenderersDevicesUpdated(devices);
    });

    // Handle errors
    this.stateManager.on('error', (error) => {
      console.error('State manager error:', error);
      this.showErrorNotification('Application Error', error.message);
    });
  }

  /**
   * Notify renderer processes about recording state changes
   */
  private notifyRenderersRecordingStateChanged(isRecording: boolean, session?: any): void {
    const settingsWindow = this.windowManager.getSettingsWindow();
    if (settingsWindow) {
      settingsWindow.webContents.send('recording:state-changed', {
        isRecording,
        session
      });
    }
  }

  /**
   * Notify renderer processes about device updates
   */
  private notifyRenderersDevicesUpdated(devices: any): void {
    const settingsWindow = this.windowManager.getSettingsWindow();
    if (settingsWindow) {
      settingsWindow.webContents.send('devices:updated', devices);
    }
  }

  /**
   * Notify renderer processes about config updates
   */
  // private notifyRenderersConfigUpdated(config: any): void {
  //   const settingsWindow = this.windowManager.getSettingsWindow();
  //   if (settingsWindow) {
  //     settingsWindow.webContents.send('config:updated', config);
  //   }
  // }

  /**
   * Show error notification
   */
  private showErrorNotification(title: string, message: string): void {
    // This could use the system notification or tray manager
    console.error(`${title}: ${message}`);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    console.log('Cleaning up UI manager...');

    try {
      this.hotkeyManager.destroy();
      this.trayManager.destroy();
      this.windowManager.destroy();
      this.ipcHandlers.cleanup();
    } catch (error) {
      console.error('Error during UI cleanup:', error);
    }

    this.isInitialized = false;
    console.log('UI manager cleanup completed');
  }

  /**
   * Handle emergency cleanup
   */
  emergencyCleanup(): void {
    console.log('Performing emergency UI cleanup...');
    
    try {
      // Force cleanup without waiting
      this.hotkeyManager?.destroy();
      this.trayManager?.destroy();
      this.windowManager?.destroy();
      this.ipcHandlers?.cleanup();
    } catch (error) {
      console.error('Error during emergency cleanup:', error);
    }
  }
}