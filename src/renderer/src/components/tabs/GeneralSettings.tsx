import React, { useState } from 'react';

const GeneralSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    outputFolder: 'D:\\Recordings',
    filenameTemplate: '{date}_{time}_{profile}',
    containerFormat: 'mkv',
    hotkeyStartStop: 'CommandOrControl+Alt+R',
    showNotifications: true,
    minimizeToTrayOnStart: true,
    preventSleepWhileRecording: true
  });

  const handleOutputFolderChange = async () => {
    try {
      if (window.electronAPI) {
        const selectedPath = await window.electronAPI.selectOutputFolder();
        if (selectedPath) {
          setSettings(prev => ({ ...prev, outputFolder: selectedPath }));
        }
      }
    } catch (error) {
      console.error('Failed to select output folder:', error);
    }
  };

  const openRecordingsFolder = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.openRecordingsFolder();
      }
    } catch (error) {
      console.error('Failed to open recordings folder:', error);
    }
  };

  return (
    <div className="settings-section">
      <div className="card-header">
        <h3 className="card-title">General Settings</h3>
        <p className="card-description">
          Configure output location, file naming, and basic application behavior
        </p>
      </div>

      <div className="form-group">
        <label className="form-label">Output Folder</label>
        <div className="path-input-group">
          <input
            type="text"
            className="form-control path-input"
            value={settings.outputFolder}
            readOnly
          />
          <button
            type="button"
            className="btn btn-secondary browse-button"
            onClick={handleOutputFolderChange}
          >
            Browse
          </button>
          <button
            type="button"
            className="btn btn-secondary browse-button"
            onClick={openRecordingsFolder}
          >
            Open
          </button>
        </div>
        <small className="text-muted">
          Where your recordings will be saved
        </small>
      </div>

      <div className="settings-row">
        <div className="settings-col">
          <div className="form-group">
            <label className="form-label">Filename Template</label>
            <input
              type="text"
              className="form-control"
              value={settings.filenameTemplate}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                filenameTemplate: e.target.value 
              }))}
            />
            <small className="text-muted">
              Available variables: {'{date}'}, {'{time}'}, {'{profile}'}
            </small>
          </div>
        </div>

        <div className="settings-col">
          <div className="form-group">
            <label className="form-label">Container Format</label>
            <select
              className="form-control form-select"
              value={settings.containerFormat}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                containerFormat: e.target.value 
              }))}
            >
              <option value="mkv">MKV (Recommended - More reliable)</option>
              <option value="mp4">MP4 (More compatible)</option>
            </select>
            <small className="text-muted">
              MKV is safer for long recordings
            </small>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Global Hotkey (Start/Stop Recording)</label>
        <input
          type="text"
          className="form-control hotkey-input"
          value={settings.hotkeyStartStop}
          readOnly
          placeholder="Click to set hotkey"
        />
        <small className="text-muted">
          Current: Ctrl+Alt+R (Click to change)
        </small>
      </div>

      <div className="form-group">
        <h4>Application Behavior</h4>
        
        <div className="form-check">
          <input
            type="checkbox"
            id="showNotifications"
            checked={settings.showNotifications}
            onChange={(e) => setSettings(prev => ({ 
              ...prev, 
              showNotifications: e.target.checked 
            }))}
          />
          <label htmlFor="showNotifications">
            Show notifications when starting/stopping recordings
          </label>
        </div>

        <div className="form-check">
          <input
            type="checkbox"
            id="minimizeToTray"
            checked={settings.minimizeToTrayOnStart}
            onChange={(e) => setSettings(prev => ({ 
              ...prev, 
              minimizeToTrayOnStart: e.target.checked 
            }))}
          />
          <label htmlFor="minimizeToTray">
            Start minimized to system tray
          </label>
        </div>

        <div className="form-check">
          <input
            type="checkbox"
            id="preventSleep"
            checked={settings.preventSleepWhileRecording}
            onChange={(e) => setSettings(prev => ({ 
              ...prev, 
              preventSleepWhileRecording: e.target.checked 
            }))}
          />
          <label htmlFor="preventSleep">
            Prevent system sleep while recording
          </label>
        </div>
      </div>

      <div className="form-group">
        <button type="button" className="btn btn-primary">
          Save General Settings
        </button>
        <button type="button" className="btn btn-secondary" style={{ marginLeft: '1rem' }}>
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default GeneralSettings;