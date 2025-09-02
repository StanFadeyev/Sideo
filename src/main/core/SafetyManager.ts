import { EventEmitter } from 'events';
import { SafetyConfig } from '../types';
import { AppStateManager, AppStateEvent } from './AppStateManager';

/**
 * Safety Control Events
 */
export enum SafetyEvent {
  LOW_DISK_SPACE = 'low-disk-space',
  CRITICAL_DISK_SPACE = 'critical-disk-space',
  MAX_DURATION_REACHED = 'max-duration-reached',
  MAX_DURATION_WARNING = 'max-duration-warning',
  SYSTEM_RESOURCE_WARNING = 'system-resource-warning',
  AUTO_STOP_TRIGGERED = 'auto-stop-triggered'
}

/**
 * Safety monitoring status
 */
interface SafetyStatus {
  diskSpace: {
    free: number;
    total: number;
    percentage: number;
    isLow: boolean;
    isCritical: boolean;
  };
  duration: {
    current: number;
    maximum: number;
    percentage: number;
    isNearLimit: boolean;
    isAtLimit: boolean;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    isUnderStress: boolean;
  };
}

/**
 * Safety Controls Manager
 * Monitors disk space, recording duration, and system resources
 * Implements automatic safety stops to prevent data loss
 */
export class SafetyManager extends EventEmitter {
  private config: SafetyConfig;
  private appStateManager: AppStateManager;
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring: boolean = false;

  // Monitoring intervals (in milliseconds)
  private readonly MONITORING_INTERVAL = 30000; // 30 seconds
  private readonly QUICK_CHECK_INTERVAL = 5000; // 5 seconds during recording

  constructor(appStateManager: AppStateManager, config: SafetyConfig) {
    super();
    this.appStateManager = appStateManager;
    this.config = config;

    // Listen to recording state changes
    this.appStateManager.on(AppStateEvent.RECORDING_STARTED, this.onRecordingStarted.bind(this));
    this.appStateManager.on(AppStateEvent.RECORDING_STOPPED, this.onRecordingStopped.bind(this));
    this.appStateManager.on(AppStateEvent.CONFIG_CHANGED, this.onConfigChanged.bind(this));

    // Start background monitoring
    this.startBackgroundMonitoring();
  }

  /**
   * Update safety configuration
   */
  updateConfig(newConfig: SafetyConfig): void {
    this.config = newConfig;
  }

  /**
   * Get current safety status
   */
  getSafetyStatus(): SafetyStatus {
    const outputPath = this.appStateManager.getState().config.output.folder;
    const diskSpace = this.getDiskSpace(outputPath);
    const duration = this.getDurationStatus();
    const system = this.getSystemStatus();

    return {
      diskSpace,
      duration,
      system
    };
  }

  /**
   * Check if it's safe to start recording
   */
  canStartRecording(): { canStart: boolean; reason?: string } {
    const status = this.getSafetyStatus();

    if (status.diskSpace.isCritical) {
      return {
        canStart: false,
        reason: `Critical disk space: Only ${Math.round(status.diskSpace.free / 1024 / 1024)} MB remaining`
      };
    }

    if (status.system.isUnderStress) {
      return {
        canStart: false,
        reason: 'System is under high resource stress'
      };
    }

    if (status.diskSpace.isLow) {
      return {
        canStart: true,
        reason: `Warning: Low disk space (${Math.round(status.diskSpace.free / 1024 / 1024)} MB remaining)`
      };
    }

    return { canStart: true };
  }

  /**
   * Force stop recording due to safety concerns
   */
  emergencyStop(reason: string): void {
    if (this.appStateManager.isRecording()) {
      console.warn(`Emergency stop triggered: ${reason}`);
      this.emit(SafetyEvent.AUTO_STOP_TRIGGERED, reason);
      this.appStateManager.stopRecording();
    }
  }

  /**
   * Start continuous monitoring during recording
   */
  private startRecordingMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.performSafetyCheck();
    }, this.QUICK_CHECK_INTERVAL);
  }

  /**
   * Start background monitoring (less frequent)
   */
  private startBackgroundMonitoring(): void {
    if (!this.isMonitoring) {
      this.isMonitoring = true;
      this.monitoringInterval = setInterval(() => {
        this.performSafetyCheck();
      }, this.MONITORING_INTERVAL);
    }
  }

  /**
   * Stop monitoring
   */
  private stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * Perform comprehensive safety check
   */
  private performSafetyCheck(): void {
    const status = this.getSafetyStatus();

    // Check disk space
    this.checkDiskSpace(status.diskSpace);

    // Check recording duration
    this.checkRecordingDuration(status.duration);

    // Check system resources
    this.checkSystemResources(status.system);
  }

  /**
   * Check disk space and emit warnings/take action
   */
  private checkDiskSpace(diskSpace: SafetyStatus['diskSpace']): void {
    if (diskSpace.isCritical && this.appStateManager.isRecording()) {
      this.emergencyStop(`Critical disk space: ${Math.round(diskSpace.free / 1024 / 1024)} MB remaining`);
      this.emit(SafetyEvent.CRITICAL_DISK_SPACE, diskSpace);
    } else if (diskSpace.isLow) {
      this.emit(SafetyEvent.LOW_DISK_SPACE, diskSpace);
    }
  }

  /**
   * Check recording duration limits
   */
  private checkRecordingDuration(duration: SafetyStatus['duration']): void {
    if (duration.isAtLimit && this.appStateManager.isRecording()) {
      this.emergencyStop(`Maximum recording duration reached: ${duration.maximum} minutes`);
      this.emit(SafetyEvent.MAX_DURATION_REACHED, duration);
    } else if (duration.isNearLimit) {
      this.emit(SafetyEvent.MAX_DURATION_WARNING, duration);
    }
  }

  /**
   * Check system resource usage
   */
  private checkSystemResources(system: SafetyStatus['system']): void {
    if (system.isUnderStress) {
      this.emit(SafetyEvent.SYSTEM_RESOURCE_WARNING, system);
      
      // If recording and resources are critically low, consider stopping
      if (this.appStateManager.isRecording() && 
          system.memoryUsage > 90 && 
          system.cpuUsage > 95) {
        this.emergencyStop('System resources critically low');
      }
    }
  }

  /**
   * Get disk space information
   */
  private getDiskSpace(_path: string): SafetyStatus['diskSpace'] {
    try {
      // Note: This is a simplified implementation
      // For accurate disk space on Windows, we'd need a native module
      const mockFreeSpace = 5000 * 1024 * 1024; // 5GB mock value
      const mockTotalSpace = 100000 * 1024 * 1024; // 100GB mock value
      
      const free = mockFreeSpace;
      const total = mockTotalSpace;
      const percentage = (free / total) * 100;
      const freeMB = free / 1024 / 1024;

      return {
        free,
        total,
        percentage,
        isLow: freeMB < this.config.min_free_space_mb * 2, // Warning at 2x limit
        isCritical: freeMB < this.config.min_free_space_mb
      };
    } catch (error) {
      console.error('Failed to get disk space:', error);
      return {
        free: 0,
        total: 0,
        percentage: 0,
        isLow: true,
        isCritical: true
      };
    }
  }

  /**
   * Get recording duration status
   */
  private getDurationStatus(): SafetyStatus['duration'] {
    const currentDuration = this.appStateManager.getRecordingDuration() / 60; // Convert to minutes
    const maxDuration = this.config.max_duration_minutes;
    const percentage = maxDuration > 0 ? (currentDuration / maxDuration) * 100 : 0;

    return {
      current: currentDuration,
      maximum: maxDuration,
      percentage,
      isNearLimit: percentage > 80 && maxDuration > 0, // Warning at 80%
      isAtLimit: percentage >= 100 && maxDuration > 0
    };
  }

  /**
   * Get system resource status
   */
  private getSystemStatus(): SafetyStatus['system'] {
    try {
      // Note: This is a simplified implementation
      // For accurate system monitoring, we'd need a native module or external library
      const mockMemoryUsage = Math.random() * 100;
      const mockCpuUsage = Math.random() * 100;

      return {
        memoryUsage: mockMemoryUsage,
        cpuUsage: mockCpuUsage,
        isUnderStress: mockMemoryUsage > 85 || mockCpuUsage > 90
      };
    } catch (error) {
      console.error('Failed to get system status:', error);
      return {
        memoryUsage: 0,
        cpuUsage: 0,
        isUnderStress: false
      };
    }
  }

  /**
   * Event handlers
   */
  private onRecordingStarted(): void {
    this.startRecordingMonitoring();
    
    // Perform immediate safety check
    const safetyCheck = this.canStartRecording();
    if (!safetyCheck.canStart) {
      setTimeout(() => {
        this.emergencyStop(safetyCheck.reason || 'Safety check failed');
      }, 100);
    }
  }

  private onRecordingStopped(): void {
    this.startBackgroundMonitoring(); // Return to background monitoring
  }

  private onConfigChanged(newConfig: any): void {
    if (newConfig.safety) {
      this.updateConfig(newConfig.safety);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopMonitoring();
    this.removeAllListeners();
    this.isMonitoring = false;
  }
}