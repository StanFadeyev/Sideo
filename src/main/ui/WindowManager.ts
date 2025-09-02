import { BrowserWindow, app } from 'electron';
import { join } from 'path';
import { ConfigManager } from '../config/ConfigManager';
import { AppStateManager } from '../core/AppStateManager';

// Track app quitting state
let appIsQuitting = false;

/**
 * Window Manager
 * Manages application windows (settings, etc.)
 */
export class WindowManager {
  private settingsWindow?: BrowserWindow;
  private configManager: ConfigManager;
  private stateManager: AppStateManager;

  constructor(configManager: ConfigManager, stateManager: AppStateManager) {
    this.configManager = configManager;
    this.stateManager = stateManager;
  }

  /**
   * Initialize window manager
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing window manager...');
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('Window manager initialized successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to initialize window manager:', error);
      return false;
    }
  }

  /**
   * Create and show settings window
   */
  createSettingsWindow(): BrowserWindow {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.focus();
      return this.settingsWindow;
    }

    this.settingsWindow = new BrowserWindow({
      width: 900,
      height: 700,
      minWidth: 800,
      minHeight: 600,
      title: 'Sideo Settings',
      icon: join(__dirname, '..', '..', '..', 'assets', 'icon.png'),
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, '..', 'preload', 'settings.js')
      }
    });

    // Load the settings UI
    if (app.isPackaged) {
      this.settingsWindow.loadFile(join(__dirname, '..', '..', 'renderer', 'index.html'));
    } else {
      this.settingsWindow.loadURL('http://localhost:5173');
    }

    // Setup window event handlers
    this.settingsWindow.once('ready-to-show', () => {
      if (this.settingsWindow) {
        this.settingsWindow.show();
        
        // Focus the window
        if (process.platform === 'darwin') {
          this.settingsWindow.focus();
        } else {
          this.settingsWindow.focus();
          this.settingsWindow.setAlwaysOnTop(true);
          this.settingsWindow.setAlwaysOnTop(false);
        }
      }
    });

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = undefined;
    });

    // Handle window close button - minimize to tray instead of closing
    this.settingsWindow.on('close', (event) => {
      if (!appIsQuitting) {
        event.preventDefault();
        this.settingsWindow?.hide();
      }
    });

    // Handle minimize to tray
    this.settingsWindow.on('minimize', (event: any) => {
      const config = this.configManager.getConfig();
      if (config.ui.minimize_to_tray_on_start) {
        event.preventDefault();
        this.settingsWindow?.hide();
      }
    });

    return this.settingsWindow;
  }

  /**
   * Show settings window (create if doesn't exist)
   */
  showSettingsWindow(): BrowserWindow {
    return this.createSettingsWindow();
  }

  /**
   * Hide settings window
   */
  hideSettingsWindow(): void {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.hide();
    }
  }

  /**
   * Close settings window
   */
  closeSettingsWindow(): void {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.close();
    }
  }

  /**
   * Get settings window
   */
  getSettingsWindow(): BrowserWindow | undefined {
    return this.settingsWindow && !this.settingsWindow.isDestroyed() 
      ? this.settingsWindow 
      : undefined;
  }

  /**
   * Check if settings window is open
   */
  isSettingsWindowOpen(): boolean {
    const isOpen = this.settingsWindow && !this.settingsWindow.isDestroyed() && this.settingsWindow.isVisible();
    return Boolean(isOpen);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for open settings events from tray
    this.stateManager.on('open-settings', () => {
      this.showSettingsWindow();
    });

    // Handle app quit
    app.on('before-quit', () => {
      appIsQuitting = true;
    });

    // On macOS, keep app running when all windows are closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        // On Windows/Linux, don't quit when all windows are closed if we have a tray
        // The app will continue running in the system tray
      }
    });

    // Handle app activation (macOS)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createSettingsWindow();
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.destroy();
    }
  }
}