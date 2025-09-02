import { EventEmitter } from 'events';
import { join, basename, dirname } from 'path';
import { existsSync, statSync, unlinkSync, renameSync, mkdirSync } from 'fs';
import { RecordingSession } from '../types';
import { ConfigManager } from '../config/ConfigManager';

/**
 * Session Manager Events
 */
export enum SessionManagerEvent {
  SESSION_CREATED = 'session-created',
  SESSION_UPDATED = 'session-updated',
  SESSION_DELETED = 'session-deleted',
  FILE_MOVED = 'file-moved',
  FILE_DELETED = 'file-deleted',
  CLEANUP_COMPLETED = 'cleanup-completed'
}

/**
 * File Operation Result
 */
export interface FileOperation {
  success: boolean;
  error?: string;
  oldPath?: string;
  newPath?: string;
}

/**
 * Session Statistics
 */
export interface SessionStatistics {
  totalSessions: number;
  totalDuration: number; // seconds
  totalFileSize: number; // bytes
  averageDuration: number; // seconds
  averageFileSize: number; // bytes
  sessionsToday: number;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
}

/**
 * Session Filter Options
 */
export interface SessionFilter {
  status?: 'recording' | 'stopped' | 'error';
  profile?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  durationRange?: {
    min: number; // seconds
    max: number; // seconds
  };
  fileSizeRange?: {
    min: number; // bytes
    max: number; // bytes
  };
}

/**
 * Recording Session Manager
 * Manages recording sessions, file operations, and session history
 */
export class RecordingSessionManager extends EventEmitter {
  private configManager: ConfigManager;

  constructor(configManager: ConfigManager) {
    super();
    this.configManager = configManager;
  }

  /**
   * Get all recording sessions
   */
  getSessions(): RecordingSession[] {
    return this.configManager.getRecordingSessions();
  }

  /**
   * Get sessions with filtering
   */
  getFilteredSessions(filter: SessionFilter): RecordingSession[] {
    let sessions = this.getSessions();

    // Filter by status
    if (filter.status) {
      sessions = sessions.filter(session => session.status === filter.status);
    }

    // Filter by profile
    if (filter.profile) {
      sessions = sessions.filter(session => session.profile === filter.profile);
    }

    // Filter by date range
    if (filter.dateRange) {
      sessions = sessions.filter(session => {
        const sessionDate = new Date(session.start_time);
        return sessionDate >= filter.dateRange!.start && sessionDate <= filter.dateRange!.end;
      });
    }

    // Filter by duration range
    if (filter.durationRange) {
      sessions = sessions.filter(session => {
        if (!session.duration_seconds) return false;
        return session.duration_seconds >= filter.durationRange!.min &&
               session.duration_seconds <= filter.durationRange!.max;
      });
    }

    // Filter by file size range
    if (filter.fileSizeRange) {
      sessions = sessions.filter(session => {
        if (!session.file_size_bytes) return false;
        return session.file_size_bytes >= filter.fileSizeRange!.min &&
               session.file_size_bytes <= filter.fileSizeRange!.max;
      });
    }

    return sessions;
  }

  /**
   * Get a specific session by ID
   */
  getSession(sessionId: string): RecordingSession | undefined {
    const sessions = this.getSessions();
    return sessions.find(session => session.id === sessionId);
  }

  /**
   * Update a recording session
   */
  updateSession(sessionId: string, updates: Partial<RecordingSession>): boolean {
    try {
      const success = this.configManager.updateRecordingSession(sessionId, updates);
      
      if (success) {
        const updatedSession = this.getSession(sessionId);
        if (updatedSession) {
          this.emit(SessionManagerEvent.SESSION_UPDATED, updatedSession);
        }
      }
      
      return success;
      
    } catch (error) {
      console.error('Failed to update session:', error);
      return false;
    }
  }

  /**
   * Delete a recording session and optionally its file
   */
  deleteSession(sessionId: string, deleteFile: boolean = false): boolean {
    try {
      const session = this.getSession(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      // Delete file if requested and exists
      if (deleteFile && session.output_path && existsSync(session.output_path)) {
        unlinkSync(session.output_path);
        this.emit(SessionManagerEvent.FILE_DELETED, session.output_path);
      }

      // Remove session from configuration
      const sessions = this.getSessions().filter(s => s.id !== sessionId);
      // Note: SessionManager should manage its own sessions storage
      // For now, we'll just keep this as a placeholder
      console.log('Sessions after deletion:', sessions.length);

      this.emit(SessionManagerEvent.SESSION_DELETED, session);
      console.log('Session deleted:', sessionId);
      
      return true;
      
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }

  /**
   * Move/rename a recording file
   */
  moveRecordingFile(sessionId: string, newPath: string): FileOperation {
    try {
      const session = this.getSession(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      if (!session.output_path || !existsSync(session.output_path)) {
        return { success: false, error: 'Source file does not exist' };
      }

      // Ensure destination directory exists
      const destDir = dirname(newPath);
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }

      // Check if destination already exists
      if (existsSync(newPath)) {
        return { success: false, error: 'Destination file already exists' };
      }

      const oldPath = session.output_path;
      
      // Move the file
      renameSync(oldPath, newPath);
      
      // Update session with new path
      this.updateSession(sessionId, { output_path: newPath });
      
      this.emit(SessionManagerEvent.FILE_MOVED, { oldPath, newPath });
      console.log('File moved:', oldPath, '->', newPath);
      
      return { success: true, oldPath, newPath };
      
    } catch (error) {
      console.error('Failed to move file:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get session statistics
   */
  getSessionStatistics(): SessionStatistics {
    const sessions = this.getSessions();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate totals
    const totalDuration = sessions.reduce((total, session) => 
      total + (session.duration_seconds || 0), 0);
    const totalFileSize = sessions.reduce((total, session) => 
      total + (session.file_size_bytes || 0), 0);

    // Count sessions by time period
    const sessionsToday = sessions.filter(session => 
      new Date(session.start_time) >= today).length;
    const sessionsThisWeek = sessions.filter(session => 
      new Date(session.start_time) >= weekAgo).length;
    const sessionsThisMonth = sessions.filter(session => 
      new Date(session.start_time) >= monthAgo).length;

    return {
      totalSessions: sessions.length,
      totalDuration,
      totalFileSize,
      averageDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
      averageFileSize: sessions.length > 0 ? totalFileSize / sessions.length : 0,
      sessionsToday,
      sessionsThisWeek,
      sessionsThisMonth
    };
  }

  /**
   * Cleanup old sessions and files
   */
  async cleanupOldSessions(options: {
    maxAge?: number; // days
    maxCount?: number;
    freeSpaceThreshold?: number; // bytes
  }): Promise<number> {
    try {
      const sessions = this.getSessions();
      let deletedCount = 0;
      
      // Sort by date (oldest first)
      const sortedSessions = sessions
        .filter(session => session.status !== 'recording') // Don't delete active recordings
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

      // Clean by age
      if (options.maxAge) {
        const cutoffDate = new Date(Date.now() - options.maxAge * 24 * 60 * 60 * 1000);
        const oldSessions = sortedSessions.filter(session => 
          new Date(session.start_time) < cutoffDate);
        
        for (const session of oldSessions) {
          if (this.deleteSession(session.id, true)) {
            deletedCount++;
          }
        }
      }

      // Clean by count
      if (options.maxCount && sortedSessions.length > options.maxCount) {
        const excessSessions = sortedSessions.slice(0, sortedSessions.length - options.maxCount);
        
        for (const session of excessSessions) {
          if (this.deleteSession(session.id, true)) {
            deletedCount++;
          }
        }
      }

      // Clean by free space threshold
      if (options.freeSpaceThreshold) {
        const freeSpace = this.getAvailableDiskSpace();
        if (freeSpace < options.freeSpaceThreshold) {
          // Delete largest files first until we have enough space
          const remainingSessions = this.getSessions()
            .filter(session => session.status !== 'recording')
            .sort((a, b) => (b.file_size_bytes || 0) - (a.file_size_bytes || 0));

          for (const session of remainingSessions) {
            if (this.deleteSession(session.id, true)) {
              deletedCount++;
              const newFreeSpace = this.getAvailableDiskSpace();
              if (newFreeSpace >= options.freeSpaceThreshold) {
                break;
              }
            }
          }
        }
      }

      this.emit(SessionManagerEvent.CLEANUP_COMPLETED, deletedCount);
      console.log(`Cleanup completed: ${deletedCount} sessions deleted`);
      
      return deletedCount;
      
    } catch (error) {
      console.error('Failed to cleanup sessions:', error);
      return 0;
    }
  }

  /**
   * Validate session files (check if files exist and update file sizes)
   */
  async validateSessionFiles(): Promise<{ valid: number; invalid: number; updated: number }> {
    const sessions = this.getSessions();
    let validCount = 0;
    let invalidCount = 0;
    let updatedCount = 0;

    for (const session of sessions) {
      if (!session.output_path) {
        invalidCount++;
        continue;
      }

      if (existsSync(session.output_path)) {
        validCount++;
        
        // Update file size if not set or different
        try {
          const stats = statSync(session.output_path);
          if (!session.file_size_bytes || session.file_size_bytes !== stats.size) {
            this.updateSession(session.id, { file_size_bytes: stats.size });
            updatedCount++;
          }
        } catch (error) {
          console.warn('Failed to get file stats:', session.output_path, error);
        }
      } else {
        invalidCount++;
        // Mark session as having missing file
        this.updateSession(session.id, { error_message: 'File not found' });
      }
    }

    console.log(`File validation: ${validCount} valid, ${invalidCount} invalid, ${updatedCount} updated`);
    return { valid: validCount, invalid: invalidCount, updated: updatedCount };
  }

  /**
   * Export session data to JSON
   */
  exportSessionData(sessionIds?: string[]): any {
    let sessions = this.getSessions();
    
    if (sessionIds) {
      sessions = sessions.filter(session => sessionIds.includes(session.id));
    }

    return {
      exported_at: new Date().toISOString(),
      total_sessions: sessions.length,
      statistics: this.getSessionStatistics(),
      sessions: sessions.map(session => ({
        ...session,
        // Don't include full file paths for privacy
        output_filename: session.output_path ? basename(session.output_path) : undefined,
        output_path: undefined
      }))
    };
  }

  /**
   * Get available disk space for output folder
   */
  private getAvailableDiskSpace(): number {
    try {
      // const config = this.configManager.getConfig();
      // const outputFolder = config.output.folder;
      
      // This is a simplified implementation
      // In a real implementation, you'd use a proper disk space library
      // For now, return a large number
      return 10 * 1024 * 1024 * 1024; // 10GB
      
    } catch (error) {
      console.error('Failed to get disk space:', error);
      return 0;
    }
  }

  /**
   * Generate unique output filename
   */
  generateOutputFilename(profile: string, extension: string = 'mkv'): string {
    const config = this.configManager.getConfig();
    const now = new Date();
    
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    let filename = config.output.filename_template;
    filename = filename.replace('{date}', dateStr);
    filename = filename.replace('{time}', timeStr);
    filename = filename.replace('{profile}', profile.replace(/\s+/g, '_'));
    
    // Ensure filename is unique
    let counter = 1;
    let finalFilename = `${filename}.${extension}`;
    let fullPath = join(config.output.folder, finalFilename);
    
    while (existsSync(fullPath)) {
      finalFilename = `${filename}_${counter}.${extension}`;
      fullPath = join(config.output.folder, finalFilename);
      counter++;
    }
    
    return fullPath;
  }

  /**
   * Get recording file format recommendations
   */
  getFormatRecommendations(): {
    container: string;
    reason: string;
    compatibility: string[];
    features: string[];
  }[] {
    return [
      {
        container: 'mkv',
        reason: 'Most reliable for recording (default)',
        compatibility: ['VLC', 'Windows Media Player', 'Chrome', 'Firefox'],
        features: ['Error recovery', 'Multiple audio tracks', 'Subtitles', 'Chapters']
      },
      {
        container: 'mp4',
        reason: 'Best compatibility for sharing',
        compatibility: ['All browsers', 'Mobile devices', 'Video editors', 'Social media'],
        features: ['Fast streaming', 'Small file size', 'Hardware acceleration']
      }
    ];
  }
}