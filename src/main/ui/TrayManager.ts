import { Tray, Menu, app, shell, nativeImage } from 'electron';
import { AppStateManager, AppStateEvent } from '../core/AppStateManager';
import { ConfigManager } from '../config/ConfigManager';
import { RecordingSession } from '../types';

/**
 * System Tray Manager
 * Handles the system tray icon, menu, and user interactions
 */
export class TrayManager {
  private tray?: Tray;
  private stateManager: AppStateManager;
  private configManager: ConfigManager;
  private isRecording = false;
  private currentSession?: RecordingSession;
  private recordingTimer?: NodeJS.Timeout;

  constructor(stateManager: AppStateManager, configManager: ConfigManager) {
    this.stateManager = stateManager;
    this.configManager = configManager;
    this.setupEventListeners();
  }

  /**
   * Initialize the system tray
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing system tray...');

      // Create tray icon
      const iconImage = this.getIconPath(false);
      this.tray = new Tray(iconImage);

      // Set tooltip
      this.tray.setToolTip('Sideo - Screen Recording');

      // Build and set context menu
      this.updateTrayMenu();

      // Handle tray click events
      this.tray.on('click', () => {
        this.handleTrayClick();
      });

      this.tray.on('right-click', () => {
        this.showContextMenu();
      });

      console.log('System tray initialized successfully');
      return true;

    } catch (error) {
      console.error('Failed to initialize system tray:', error);
      return false;
    }
  }

  /**
   * Update the tray icon and menu based on current state
   */
  private updateTrayMenu(): void {
    if (!this.tray) return;

    const profiles = this.configManager.getProfiles();
    const activeProfile = profiles.find(p => p.id === this.stateManager.getActiveProfile())?.name || 'Medium';

    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: `Sideo ${app.getVersion()}`,
        enabled: false
      },
      { type: 'separator' },
      {
        label: this.isRecording ? '⏹ Stop Recording' : '⏺ Start Recording',
        click: () => this.toggleRecording(),
        enabled: true
      }
    ];

    // Recording info section
    if (this.isRecording && this.currentSession) {
      template.push(
        { type: 'separator' },
        {
          label: `📹 Recording: ${this.formatDuration(this.getRecordingDuration())}`,
          enabled: false
        },
        {
          label: `📁 ${this.currentSession.output_path}`,
          click: () => shell.showItemInFolder(this.currentSession!.output_path)
        }
      );
    }

    template.push(
      { type: 'separator' },
      {
        label: `Profile: ${activeProfile} ▸`,
        submenu: this.buildProfileSubmenu()
      }
    );

    // Future AI features (disabled in MVP)
    template.push(
      { type: 'separator' },
      {
        label: '⚠ Transcribe Video',
        enabled: false,
        toolTip: 'Coming in future version'
      },
      {
        label: '⚠ Summarize Video',
        enabled: false,
        toolTip: 'Coming in future version'
      }
    );

    // Settings and actions
    template.push(
      { type: 'separator' },
      {
        label: '⚙ Open Settings',
        click: () => this.openSettingsWindow()
      },
      {
        label: '📁 Open Recordings Folder',
        click: () => this.openRecordingsFolder()
      },
      { type: 'separator' },
      {
        label: 'Exit',
        click: () => this.exitApplication()
      }
    );

    const contextMenu = Menu.buildFromTemplate(template);
    this.tray.setContextMenu(contextMenu);
  }

  /**
   * Build profile selection submenu
   */
  private buildProfileSubmenu(): Electron.MenuItemConstructorOptions[] {
    const profiles = this.configManager.getProfiles();
    const activeProfile = this.stateManager.getActiveProfile();

    return profiles.map(profile => ({
      label: `${profile.name}${profile.subtitle ? ` (${profile.subtitle})` : ''}`,
      type: 'radio',
      checked: profile.id === activeProfile,
      click: () => this.setActiveProfile(profile.id)
    }));
  }

  /**
   * Handle tray icon click (toggle recording)
   */
  private handleTrayClick(): void {
    this.toggleRecording();
  }

  /**
   * Show context menu
   */
  private showContextMenu(): void {
    if (this.tray) {
      this.tray.popUpContextMenu();
    }
  }

  /**
   * Toggle recording state
   */
  private async toggleRecording(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      } else {
        await this.startRecording();
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      this.showErrorNotification('Recording Error', `Failed to ${this.isRecording ? 'stop' : 'start'} recording: ${error}`);
    }
  }

  /**
   * Start recording
   */
  private async startRecording(): Promise<void> {
    console.log('Starting recording from tray...');
    
    const success = await this.stateManager.startRecording('auto-generated-path');
    if (success) {
      this.isRecording = true;
      this.updateTrayIcon(true);
      this.updateTrayMenu();
      this.startRecordingTimer();
      this.showNotification('Recording Started', 'Screen recording has started');
    } else {
      throw new Error('Failed to start recording');
    }
  }

  /**
   * Stop recording
   */
  private async stopRecording(): Promise<void> {
    console.log('Stopping recording from tray...');
    
    const success = await this.stateManager.stopRecording();
    if (success) {
      this.isRecording = false;
      this.updateTrayIcon(false);
      this.updateTrayMenu();
      this.stopRecordingTimer();
      this.showNotification('Recording Stopped', 'Screen recording has been saved');
    } else {
      throw new Error('Failed to stop recording');
    }
  }

  /**
   * Set active quality profile
   */
  private setActiveProfile(profileId: string): void {
    this.stateManager.setActiveProfile(profileId);
    this.updateTrayMenu();
    this.showNotification('Profile Changed', `Switched to ${profileId} quality profile`);
  }

  /**
   * Open settings window
   */
  private openSettingsWindow(): void {
    // This will be implemented when we create the settings window
    console.log('Opening settings window...');
    this.stateManager.emit('open-settings');
  }

  /**
   * Open recordings folder
   */
  private openRecordingsFolder(): void {
    const config = this.configManager.getConfig();
    const recordingsPath = config.output.folder;
    shell.openPath(recordingsPath);
  }

  /**
   * Exit application
   */
  private exitApplication(): void {
    if (this.isRecording) {
      this.stopRecording().finally(() => {
        app.quit();
      });
    } else {
      app.quit();
    }
  }

  /**
   * Update tray icon based on recording state
   */
  private updateTrayIcon(recording: boolean): void {
    if (!this.tray) return;

    const iconImage = this.getIconPath(recording);
    this.tray.setImage(iconImage);
    
    const tooltip = recording 
      ? `Sideo - Recording (${this.formatDuration(this.getRecordingDuration())})`
      : 'Sideo - Ready to Record';
    
    this.tray.setToolTip(tooltip);
  }

  /**
   * Get appropriate icon path
   */
  private getIconPath(recording: boolean): Electron.NativeImage {
    // Create a simple 16x16 icon
    if (recording) {
      // Red recording indicator
      const redIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABklEQVR4XmPYBwQAAUYAZ8V4AH4AAAAASUVORK5CYII=';
      return nativeImage.createFromDataURL(redIcon);
    } else {
      // Gray idle icon
      const grayIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABklEQVR4XmNgGAWjYBSMAggAAAQQAAF+VhXnAAAAAElFTkSuQmCC';
      return nativeImage.createFromDataURL(grayIcon);
    }
  }

  /**
   * Start recording timer for updating UI
   */
  private startRecordingTimer(): void {
    this.recordingTimer = setInterval(() => {
      this.updateTrayIcon(true);
      this.updateTrayMenu();
    }, 1000);
  }

  /**
   * Stop recording timer
   */
  private stopRecordingTimer(): void {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = undefined;
    }
  }

  /**
   * Get current recording duration in seconds
   */
  private getRecordingDuration(): number {
    if (!this.currentSession || !this.currentSession.start_time) {
      return 0;
    }
    
    return Math.floor((Date.now() - new Date(this.currentSession.start_time).getTime()) / 1000);
  }

  /**
   * Format duration in HH:MM:SS format
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Show notification to user
   */
  private showNotification(title: string, body: string): void {
    const config = this.configManager.getConfig();
    if (config.ui.show_notifications) {
      // Use Electron's built-in notification system
      const { Notification } = require('electron');
      if (Notification.isSupported()) {
        new Notification({
          title,
          body,
          silent: false
        }).show();
      }
    }
  }

  /**
   * Show error notification
   */
  private showErrorNotification(title: string, body: string): void {
    // Always show error notifications regardless of settings
    const { Notification } = require('electron');
    if (Notification.isSupported()) {
      new Notification({
        title,
        body,
        urgency: 'critical'
      }).show();
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.stateManager.on(AppStateEvent.RECORDING_STARTED, (session: RecordingSession) => {
      this.currentSession = session;
      this.isRecording = true;
      this.updateTrayIcon(true);
      this.updateTrayMenu();
      this.startRecordingTimer();
    });

    this.stateManager.on(AppStateEvent.RECORDING_STOPPED, (session: RecordingSession) => {
      this.currentSession = session;
      this.isRecording = false;
      this.updateTrayIcon(false);
      this.updateTrayMenu();
      this.stopRecordingTimer();
    });

    this.stateManager.on(AppStateEvent.PROFILE_CHANGED, () => {
      this.updateTrayMenu();
    });

    this.stateManager.on(AppStateEvent.CONFIG_UPDATED, () => {
      this.updateTrayMenu();
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopRecordingTimer();
    
    if (this.tray) {
      this.tray.destroy();
      this.tray = undefined;
    }
  }
}