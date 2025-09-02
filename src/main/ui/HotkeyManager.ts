import { globalShortcut, app } from 'electron';
import { ConfigManager } from '../config/ConfigManager';
import { AppStateManager } from '../core/AppStateManager';

/**
 * Hotkey Manager
 * Handles global keyboard shortcuts for the application
 */
export class HotkeyManager {
  private configManager: ConfigManager;
  private stateManager: AppStateManager;
  private registeredHotkeys: Set<string> = new Set();

  constructor(configManager: ConfigManager, stateManager: AppStateManager) {
    this.configManager = configManager;
    this.stateManager = stateManager;
  }

  /**
   * Initialize hotkey manager
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing hotkey manager...');
      
      // Register default hotkeys
      await this.registerHotkeys();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('Hotkey manager initialized successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to initialize hotkey manager:', error);
      return false;
    }
  }

  /**
   * Register all hotkeys from configuration
   */
  private async registerHotkeys(): Promise<void> {
    const config = this.configManager.getConfig();
    
    // Register start/stop recording hotkey
    if (config.ui.hotkey_start_stop) {
      this.registerHotkey(
        'start_stop_recording',
        config.ui.hotkey_start_stop,
        () => this.handleStartStopRecording()
      );
    }

    // Register additional hotkeys as needed
    // Future: profile switching, settings window, etc.
  }

  /**
   * Register a single hotkey
   */
  private registerHotkey(name: string, accelerator: string, callback: () => void): boolean {
    try {
      // Unregister if already exists
      this.unregisterHotkey(name, accelerator);

      // Register new hotkey
      const success = globalShortcut.register(accelerator, callback);
      
      if (success) {
        this.registeredHotkeys.add(accelerator);
        console.log(`Hotkey registered: ${name} (${accelerator})`);
        return true;
      } else {
        console.warn(`Failed to register hotkey: ${name} (${accelerator}) - may be in use by another application`);
        return false;
      }
      
    } catch (error) {
      console.error(`Error registering hotkey ${name} (${accelerator}):`, error);
      return false;
    }
  }

  /**
   * Unregister a single hotkey
   */
  private unregisterHotkey(name: string, accelerator: string): void {
    try {
      if (this.registeredHotkeys.has(accelerator)) {
        globalShortcut.unregister(accelerator);
        this.registeredHotkeys.delete(accelerator);
        console.log(`Hotkey unregistered: ${name} (${accelerator})`);
      }
    } catch (error) {
      console.error(`Error unregistering hotkey ${name} (${accelerator}):`, error);
    }
  }

  /**
   * Handle start/stop recording hotkey
   */
  private async handleStartStopRecording(): Promise<void> {
    try {
      console.log('Start/stop recording hotkey pressed');
      
      const isRecording = this.stateManager.isRecording();
      
      if (isRecording) {
        console.log('Stopping recording via hotkey...');
        await this.stateManager.stopRecording();
      } else {
        console.log('Starting recording via hotkey...');
        await this.stateManager.startRecording('auto-generated-path');
      }
      
    } catch (error) {
      console.error('Error handling start/stop recording hotkey:', error);
    }
  }

  /**
   * Update hotkeys when configuration changes
   */
  // private async updateHotkeys(): Promise<void> {
  //   try {
  //     console.log('Updating hotkeys from configuration...');
  //     
  //     // Unregister all current hotkeys
  //     this.unregisterAllHotkeys();
  //     
  //     // Re-register with new configuration
  //     await this.registerHotkeys();
  //     
  //   } catch (error) {
  //     console.error('Error updating hotkeys:', error);
  //   }
  // }

  /**
   * Unregister all hotkeys
   */
  private unregisterAllHotkeys(): void {
    try {
      for (const accelerator of this.registeredHotkeys) {
        globalShortcut.unregister(accelerator);
      }
      this.registeredHotkeys.clear();
      console.log('All hotkeys unregistered');
      
    } catch (error) {
      console.error('Error unregistering all hotkeys:', error);
    }
  }

  /**
   * Check if a hotkey is available for registration
   */
  isHotkeyAvailable(accelerator: string): boolean {
    try {
      // Try to register temporarily
      const success = globalShortcut.register(accelerator, () => {});
      
      if (success) {
        // Unregister immediately
        globalShortcut.unregister(accelerator);
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error(`Error checking hotkey availability (${accelerator}):`, error);
      return false;
    }
  }

  /**
   * Get list of registered hotkeys
   */
  getRegisteredHotkeys(): string[] {
    return Array.from(this.registeredHotkeys);
  }

  /**
   * Validate hotkey format
   */
  static validateHotkey(accelerator: string): boolean {
    try {
      // Basic validation - Electron's accelerator format
      const validModifiers = ['CommandOrControl', 'Command', 'Control', 'Ctrl', 'Alt', 'Option', 'AltGr', 'Shift', 'Super', 'Meta'];
      const validKeys = /^[A-Za-z0-9]$|^F([1-9]|1[0-2])$|^(Plus|Space|Tab|Backspace|Delete|Insert|Return|Enter|Up|Down|Left|Right|Home|End|PageUp|PageDown|Escape|VolumeUp|VolumeDown|VolumeMute|MediaNextTrack|MediaPreviousTrack|MediaStop|MediaPlayPause)$/;
      
      const parts = accelerator.split('+');
      if (parts.length === 0) return false;
      
      // Last part should be a key
      const key = parts[parts.length - 1];
      if (!validKeys.test(key)) return false;
      
      // All other parts should be modifiers
      for (let i = 0; i < parts.length - 1; i++) {
        if (!validModifiers.includes(parts[i])) return false;
      }
      
      return true;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for configuration changes
    // Note: ConfigManager doesn't emit events, so we'll rely on manual updates
    // this.configManager.on('config-updated', () => {
    //   this.updateHotkeys();
    // });

    // Cleanup on app quit
    app.on('will-quit', () => {
      this.unregisterAllHotkeys();
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.unregisterAllHotkeys();
  }
}