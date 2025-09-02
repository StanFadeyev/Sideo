import React, { useState } from 'react';

const VideoSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    source: 'desktop',
    fps: 30,
    resolution: '1920x1080',
    encoderPriority: ['h264_nvenc', 'h264_qsv', 'h264_amf', 'libx264'],
    bitrateKbps: 8000,
    maxrateKbps: 8000,
    bufsizeKbps: 16000,
    drawMouse: true,
    regionCapture: {
      enabled: false,
      offsetX: 0,
      offsetY: 0,
      width: 1920,
      height: 1080
    }
  });

  return (
    <div className="settings-section">
      <div className="card-header">
        <h3 className="card-title">Video Settings</h3>
        <p className="card-description">
          Configure video capture source, quality, and encoding options
        </p>
      </div>

      <div className="form-group">
        <label className="form-label">Video Source</label>
        <select
          className="form-control form-select"
          value={settings.source}
          onChange={(e) => setSettings(prev => ({ 
            ...prev, 
            source: e.target.value 
          }))}
        >
          <option value="desktop">Full Desktop (Primary Display)</option>
          <option value="region">Custom Region</option>
          <option value="window">Specific Window</option>
          <option value="secondary">Secondary Display</option>
        </select>
      </div>

      {settings.source === 'region' && (
        <div className="card">
          <h4>Region Capture Settings</h4>
          <div className="settings-row">
            <div className="settings-col">
              <label className="form-label">X Offset</label>
              <input
                type="number"
                className="form-control"
                value={settings.regionCapture.offsetX}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  regionCapture: {
                    ...prev.regionCapture,
                    offsetX: parseInt(e.target.value) || 0
                  }
                }))}
              />
            </div>
            <div className="settings-col">
              <label className="form-label">Y Offset</label>
              <input
                type="number"
                className="form-control"
                value={settings.regionCapture.offsetY}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  regionCapture: {
                    ...prev.regionCapture,
                    offsetY: parseInt(e.target.value) || 0
                  }
                }))}
              />
            </div>
            <div className="settings-col">
              <label className="form-label">Width</label>
              <input
                type="number"
                className="form-control"
                value={settings.regionCapture.width}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  regionCapture: {
                    ...prev.regionCapture,
                    width: parseInt(e.target.value) || 1920
                  }
                }))}
              />
            </div>
            <div className="settings-col">
              <label className="form-label">Height</label>
              <input
                type="number"
                className="form-control"
                value={settings.regionCapture.height}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  regionCapture: {
                    ...prev.regionCapture,
                    height: parseInt(e.target.value) || 1080
                  }
                }))}
              />
            </div>
          </div>
          <button type="button" className="btn btn-secondary mt-2">
            Select Region Visually
          </button>
        </div>
      )}

      <div className="settings-row">
        <div className="settings-col">
          <div className="form-group">
            <label className="form-label">Frame Rate (FPS)</label>
            <select
              className="form-control form-select"
              value={settings.fps}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                fps: parseInt(e.target.value) 
              }))}
            >
              <option value={24}>24 FPS (Cinema)</option>
              <option value={30}>30 FPS (Recommended)</option>
              <option value={60}>60 FPS (Smooth)</option>
            </select>
          </div>
        </div>

        <div className="settings-col">
          <div className="form-group">
            <label className="form-label">Resolution</label>
            <select
              className="form-control form-select"
              value={settings.resolution}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                resolution: e.target.value 
              }))}
            >
              <option value="1280x720">720p (1280x720)</option>
              <option value="1920x1080">1080p (1920x1080)</option>
              <option value="2560x1440">1440p (2560x1440)</option>
              <option value="3840x2160">4K (3840x2160)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Video Bitrate (kbps)</label>
        <input
          type="range"
          min="1000"
          max="20000"
          step="500"
          value={settings.bitrateKbps}
          onChange={(e) => setSettings(prev => ({ 
            ...prev, 
            bitrateKbps: parseInt(e.target.value) 
          }))}
        />
        <div className="range-labels">
          <span>1 Mbps</span>
          <span><strong>{settings.bitrateKbps / 1000} Mbps</strong></span>
          <span>20 Mbps</span>
        </div>
        <small className="text-muted">
          Higher bitrate = better quality, larger file size
        </small>
      </div>

      <div className="form-group">
        <h4>Encoder Priority</h4>
        <p className="text-muted">
          The application will try encoders in this order (hardware first, then software fallback)
        </p>
        <div className="encoder-list">
          {settings.encoderPriority.map((encoder, index) => (
            <div key={encoder} className="encoder-item">
              <span className="encoder-priority">{index + 1}.</span>
              <span className="encoder-name">{encoder}</span>
              <span className="encoder-type">
                {encoder === 'libx264' ? '(Software)' : '(Hardware)'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <div className="form-check">
          <input
            type="checkbox"
            id="drawMouse"
            checked={settings.drawMouse}
            onChange={(e) => setSettings(prev => ({ 
              ...prev, 
              drawMouse: e.target.checked 
            }))}
          />
          <label htmlFor="drawMouse">
            Show mouse cursor in recordings
          </label>
        </div>
      </div>

      <div className="form-group">
        <button type="button" className="btn btn-primary">
          Save Video Settings
        </button>
        <button type="button" className="btn btn-secondary" style={{ marginLeft: '1rem' }}>
          Test Encoders
        </button>
      </div>
    </div>
  );
};

export default VideoSettings;