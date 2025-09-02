import Store from 'electron-store';
import { app } from 'electron';
import { existsSync, mkdirSync } from 'fs';
import { 
  AppConfig, 
  QualityProfile, 
  DEFAULT_CONFIG, 
  DEFAULT_PROFILES,
  RecordingSession 
} from '../types';

/**
 * Configuration Manager for Sideo Application
 * Handles configuration persistence, validation, and access
 */
export class ConfigManager {
  private configStore: Store<AppConfig>;
  private profilesStore: Store<{ profiles: QualityProfile[] }>;
  private sessionsStore: Store<{ sessions: RecordingSession[] }>;
  private activeProfile: string = 'medium';

  constructor() {
    // Initialize electron-store with schema validation
    this.configStore = new Store<AppConfig>({
      name: 'config',
      defaults: DEFAULT_CONFIG,
      schema: this.getConfigSchema(),
      migrations: {
        '>=0.1.0': () => {
          // Migration logic for future versions
          console.log('Migrating config to version 0.1.0');
        }
      }
    });

    this.profilesStore = new Store<{ profiles: QualityProfile[] }>({
      name: 'profiles',
      defaults: { profiles: DEFAULT_PROFILES }
    });

    this.sessionsStore = new Store<{ sessions: RecordingSession[] }>({
      name: 'sessions',
      defaults: { sessions: [] }
    });

    // Ensure output directory exists
    this.ensureOutputDirectory();
  }

  /**
   * Get the complete application configuration
   */
  getConfig(): AppConfig {
    return this.configStore.store;
  }

  /**
   * Update configuration (partial updates supported)
   */
  updateConfig(partialConfig: Partial<AppConfig>): boolean {
    try {
      // Deep merge the configuration
      const currentConfig = this.configStore.store;
      const newConfig = this.deepMerge(currentConfig, partialConfig);
      
      // Validate the new configuration
      if (this.validateConfig(newConfig)) {
        this.configStore.store = newConfig;
        this.ensureOutputDirectory();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update configuration:', error);
      return false;
    }
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    this.configStore.clear();
    this.ensureOutputDirectory();
  }

  /**
   * Get all quality profiles
   */
  getProfiles(): QualityProfile[] {
    return this.profilesStore.get('profiles', DEFAULT_PROFILES);
  }

  /**
   * Get a specific profile by ID
   */
  getProfile(id: string): QualityProfile | undefined {
    const profiles = this.getProfiles();
    return profiles.find(profile => profile.id === id);
  }

  /**
   * Add or update a quality profile
   */
  saveProfile(profile: QualityProfile): boolean {
    try {
      const profiles = this.getProfiles();
      const existingIndex = profiles.findIndex(p => p.id === profile.id);
      
      if (existingIndex >= 0) {
        profiles[existingIndex] = profile;
      } else {
        profiles.push(profile);
      }
      
      this.profilesStore.set('profiles', profiles);
      return true;
    } catch (error) {
      console.error('Failed to save profile:', error);
      return false;
    }
  }

  /**
   * Delete a quality profile
   */
  deleteProfile(id: string): boolean {
    try {
      if (['low', 'medium', 'high'].includes(id)) {
        throw new Error('Cannot delete default profiles');
      }
      
      const profiles = this.getProfiles();
      const filteredProfiles = profiles.filter(p => p.id !== id);
      
      this.profilesStore.set('profiles', filteredProfiles);
      return true;
    } catch (error) {
      console.error('Failed to delete profile:', error);
      return false;
    }
  }

  /**
   * Get/Set active profile
   */
  getActiveProfile(): string {
    return this.activeProfile;
  }

  setActiveProfile(profileId: string): boolean {
    const profile = this.getProfile(profileId);
    if (profile) {
      this.activeProfile = profileId;
      return true;
    }
    return false;
  }

  /**
   * Recording sessions management
   */
  addRecordingSession(session: RecordingSession): void {
    const sessions = this.sessionsStore.get('sessions', []);
    sessions.push(session);
    
    // Keep only last 100 sessions
    if (sessions.length > 100) {
      sessions.splice(0, sessions.length - 100);
    }
    
    this.sessionsStore.set('sessions', sessions);
  }

  getRecordingSessions(): RecordingSession[] {
    return this.sessionsStore.get('sessions', []);
  }

  updateRecordingSession(sessionId: string, updates: Partial<RecordingSession>): boolean {
    try {
      const sessions = this.getRecordingSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex >= 0) {
        sessions[sessionIndex] = { ...sessions[sessionIndex], ...updates };
        this.sessionsStore.set('sessions', sessions);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update recording session:', error);
      return false;
    }
  }

  /**
   * Utility methods
   */
  getConfigPath(): string {
    return this.configStore.path;
  }

  getAppDataPath(): string {
    return app.getPath('userData');
  }

  exportConfig(): AppConfig {
    return { ...this.configStore.store };
  }

  importConfig(config: AppConfig): boolean {
    if (this.validateConfig(config)) {
      this.configStore.store = config;
      this.ensureOutputDirectory();
      return true;
    }
    return false;
  }

  /**
   * Private helper methods
   */
  private validateConfig(config: AppConfig): boolean {
    try {
      // Basic validation
      if (!config.output?.folder || !config.video || !config.audio) {
        return false;
      }

      // Validate paths and values
      if (config.video.fps < 1 || config.video.fps > 120) {
        return false;
      }

      if (config.video.bitrate_kbps < 100 || config.video.bitrate_kbps > 100000) {
        return false;
      }

      if (config.audio.aac_bitrate_kbps < 32 || config.audio.aac_bitrate_kbps > 512) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Configuration validation failed:', error);
      return false;
    }
  }

  private ensureOutputDirectory(): void {
    try {
      const outputFolder = this.configStore.get('output.folder') as string;
      if (outputFolder && !existsSync(outputFolder)) {
        mkdirSync(outputFolder, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create output directory:', error);
    }
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private getConfigSchema(): any {
    return {
      output: {
        type: 'object',
        properties: {
          folder: { type: 'string' },
          container: { type: 'string', enum: ['mkv', 'mp4'] },
          filename_template: { type: 'string' },
          segment_enabled: { type: 'boolean' },
          segment_minutes: { type: 'number', minimum: 1, maximum: 120 }
        }
      },
      video: {
        type: 'object',
        properties: {
          source: { type: 'string', enum: ['desktop', 'region', 'window', 'secondary'] },
          fps: { type: 'number', minimum: 1, maximum: 120 },
          bitrate_kbps: { type: 'number', minimum: 100, maximum: 100000 },
          maxrate_kbps: { type: 'number', minimum: 100, maximum: 100000 },
          bufsize_kbps: { type: 'number', minimum: 100, maximum: 200000 },
          draw_mouse: { type: 'boolean' }
        }
      },
      audio: {
        type: 'object',
        properties: {
          system_device: { type: 'string' },
          mic_device: { type: 'string' },
          mix_mic_with_system: { type: 'boolean' },
          aac_bitrate_kbps: { type: 'number', minimum: 32, maximum: 512 }
        }
      }
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Electron-store doesn't need explicit cleanup
    // This method exists for consistency with other managers
  }
}