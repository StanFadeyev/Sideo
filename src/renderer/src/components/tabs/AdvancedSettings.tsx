import React, { useState } from 'react';

const AdvancedSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    ffmpegPath: 'C:\\ffmpeg\\bin\\ffmpeg.exe',
    stderrLogLevel: 'info',
    minFreeSpaceMb: 1024,
    maxDurationMinutes: 240,
    segmentEnabled: true,
    segmentMinutes: 30,
    enableAutoRecovery: true,
    enablePerformanceMonitoring: true,
    bufferSizeMb: 64,
    threadCount: 0 // 0 = auto
  });

  return (
    <div className="settings-section">
      <div className="card-header">
        <h3 className="card-title">Advanced Settings</h3>
        <p className="card-description">
          Configure FFmpeg paths, logging, safety limits, and performance options
        </p>
      </div>

      <div className="advanced-warning">
        <span className="warning-icon">⚠️</span>
        <strong>Warning:</strong> These settings are for advanced users only. 
        Incorrect values may cause recording failures or system instability.
      </div>

      <div className="card">
        <h4>FFmpeg Configuration</h4>
        
        <div className="form-group">
          <label className="form-label">FFmpeg Binary Path</label>
          <div className="path-input-group">
            <input
              type="text"
              className="form-control path-input"
              value={settings.ffmpegPath}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                ffmpegPath: e.target.value 
              }))}
            />
            <button type="button" className="btn btn-secondary browse-button">
              Browse
            </button>
            <button type="button" className="btn btn-secondary browse-button">
              Test
            </button>
          </div>
          <small className="text-muted">
            Path to ffmpeg.exe. Leave empty for auto-detection.
          </small>
        </div>

        <div className="form-group">
          <label className="form-label">Log Level</label>
          <select
            className="form-control form-select"
            value={settings.stderrLogLevel}
            onChange={(e) => setSettings(prev => ({ 
              ...prev, 
              stderrLogLevel: e.target.value 
            }))}
          >
            <option value="error">Error (Minimal logging)</option>
            <option value="warning">Warning</option>
            <option value="info">Info (Recommended)</option>
            <option value="debug">Debug (Verbose)</option>
          </select>
        </div>

        <div className="settings-row">
          <div className="settings-col">
            <div className="form-group">
              <label className="form-label">Thread Count</label>
              <input
                type="number"
                min="0"
                max="32"
                className="form-control"
                value={settings.threadCount}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  threadCount: parseInt(e.target.value) || 0 
                }))}
              />
              <small className="text-muted">0 = Auto-detect</small>
            </div>
          </div>

          <div className="settings-col">
            <div className="form-group">
              <label className="form-label">Buffer Size (MB)</label>
              <input
                type="number"
                min="16"
                max="512"
                step="16"
                className="form-control"
                value={settings.bufferSizeMb}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  bufferSizeMb: parseInt(e.target.value) || 64 
                }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h4>Safety Controls</h4>
        
        <div className="settings-row">
          <div className="settings-col">
            <div className="form-group">
              <label className="form-label">Minimum Free Space (MB)</label>
              <input
                type="number"
                min="100"
                max="10240"
                step="100"
                className="form-control"
                value={settings.minFreeSpaceMb}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  minFreeSpaceMb: parseInt(e.target.value) || 1024 
                }))}
              />
              <small className="text-muted">
                Recording stops when disk space is low
              </small>
            </div>
          </div>

          <div className="settings-col">
            <div className="form-group">
              <label className="form-label">Max Recording Duration (minutes)</label>
              <input
                type="number"
                min="30"
                max="1440"
                step="30"
                className="form-control"
                value={settings.maxDurationMinutes}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  maxDurationMinutes: parseInt(e.target.value) || 240 
                }))}
              />
              <small className="text-muted">
                Auto-stop after this duration (0 = no limit)
              </small>
            </div>
          </div>
        </div>

        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              id="segmentEnabled"
              checked={settings.segmentEnabled}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                segmentEnabled: e.target.checked 
              }))}
            />
            <label htmlFor="segmentEnabled">
              Enable automatic segmentation for long recordings
            </label>
          </div>
          
          {settings.segmentEnabled && (
            <div className="ml-4">
              <label className="form-label">Segment Duration (minutes)</label>
              <input
                type="number"
                min="10"
                max="120"
                step="10"
                className="form-control"
                value={settings.segmentMinutes}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  segmentMinutes: parseInt(e.target.value) || 30 
                }))}
              />
              <small className="text-muted">
                Split recordings into smaller files every N minutes
              </small>
            </div>
          )}
        </div>

        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              id="enableAutoRecovery"
              checked={settings.enableAutoRecovery}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                enableAutoRecovery: e.target.checked 
              }))}
            />
            <label htmlFor="enableAutoRecovery">
              Enable automatic recovery from FFmpeg crashes
            </label>
          </div>

          <div className="form-check">
            <input
              type="checkbox"
              id="enablePerformanceMonitoring"
              checked={settings.enablePerformanceMonitoring}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                enablePerformanceMonitoring: e.target.checked 
              }))}
            />
            <label htmlFor="enablePerformanceMonitoring">
              Monitor performance and show warnings
            </label>
          </div>
        </div>
      </div>

      <div className="card">
        <h4>System Information</h4>
        <div className="system-info">
          <div className="info-row">
            <span className="info-label">Operating System:</span>
            <span className="info-value">Windows 11</span>
          </div>
          <div className="info-row">
            <span className="info-label">Application Version:</span>
            <span className="info-value">0.1.0</span>
          </div>
          <div className="info-row">
            <span className="info-label">Electron Version:</span>
            <span className="info-value">26.2.1</span>
          </div>
          <div className="info-row">
            <span className="info-label">Node.js Version:</span>
            <span className="info-value">18.17.1</span>
          </div>
        </div>
        
        <button type="button" className="btn btn-secondary mt-2">
          📋 Copy System Information
        </button>
      </div>

      <div className="card">
        <h4>Maintenance</h4>
        
        <div className="maintenance-actions">
          <button type="button" className="btn btn-secondary">
            🗂️ Open Logs Folder
          </button>
          <button type="button" className="btn btn-secondary">
            🧹 Clear Application Cache
          </button>
          <button type="button" className="btn btn-secondary">
            📊 Export Configuration
          </button>
          <button type="button" className="btn btn-secondary">
            📥 Import Configuration
          </button>
        </div>
        
        <div className="danger-zone mt-3">
          <h5 className="text-danger">Danger Zone</h5>
          <button type="button" className="btn btn-danger">
            🔄 Reset All Settings to Defaults
          </button>
        </div>
      </div>

      <div className="form-group">
        <button type="button" className="btn btn-primary">
          Save Advanced Settings
        </button>
        <button type="button" className="btn btn-secondary" style={{ marginLeft: '1rem' }}>
          Test Configuration
        </button>
      </div>
    </div>
  );
};

export default AdvancedSettings;