import React, { useState } from 'react';

const AudioSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    systemDevice: 'Stereo Mix (Realtek HD Audio)',
    micDevice: 'Microphone (USB Audio Device)',
    mixMicWithSystem: true,
    aacBitrateKbps: 160,
    enableSystemAudio: true,
    enableMicAudio: false,
    micVolume: 70,
    systemVolume: 100
  });

  const [audioDevices] = useState([
    { id: 'stereo-mix', name: 'Stereo Mix (Realtek HD Audio)', type: 'output' },
    { id: 'speakers', name: 'Speakers (High Definition Audio)', type: 'output' },
    { id: 'usb-mic', name: 'Microphone (USB Audio Device)', type: 'input' },
    { id: 'built-in-mic', name: 'Built-in Microphone', type: 'input' }
  ]);

  return (
    <div className="settings-section">
      <div className="card-header">
        <h3 className="card-title">Audio Settings</h3>
        <p className="card-description">
          Configure audio sources, mixing, and quality settings
        </p>
      </div>

      <div className="card">
        <h4>Audio Sources</h4>
        
        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              id="enableSystemAudio"
              checked={settings.enableSystemAudio}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                enableSystemAudio: e.target.checked 
              }))}
            />
            <label htmlFor="enableSystemAudio">
              <strong>Capture System Audio</strong> (Desktop sounds, music, etc.)
            </label>
          </div>

          {settings.enableSystemAudio && (
            <div className="ml-4">
              <label className="form-label">System Audio Device</label>
              <select
                className="form-control form-select"
                value={settings.systemDevice}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  systemDevice: e.target.value 
                }))}
              >
                {audioDevices
                  .filter(device => device.type === 'output')
                  .map(device => (
                    <option key={device.id} value={device.name}>
                      {device.name}
                    </option>
                  ))}
              </select>
              
              <div className="form-group mt-2">
                <label className="form-label">System Audio Volume: {settings.systemVolume}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.systemVolume}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    systemVolume: parseInt(e.target.value) 
                  }))}
                />
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              id="enableMicAudio"
              checked={settings.enableMicAudio}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                enableMicAudio: e.target.checked 
              }))}
            />
            <label htmlFor="enableMicAudio">
              <strong>Capture Microphone</strong> (Your voice, commentary)
            </label>
          </div>

          {settings.enableMicAudio && (
            <div className="ml-4">
              <label className="form-label">Microphone Device</label>
              <select
                className="form-control form-select"
                value={settings.micDevice}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  micDevice: e.target.value 
                }))}
              >
                {audioDevices
                  .filter(device => device.type === 'input')
                  .map(device => (
                    <option key={device.id} value={device.name}>
                      {device.name}
                    </option>
                  ))}
              </select>
              
              <div className="form-group mt-2">
                <label className="form-label">Microphone Volume: {settings.micVolume}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.micVolume}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    micVolume: parseInt(e.target.value) 
                  }))}
                />
              </div>

              <button type="button" className="btn btn-secondary mt-2">
                🎤 Test Microphone
              </button>
            </div>
          )}
        </div>

        {settings.enableSystemAudio && settings.enableMicAudio && (
          <div className="form-group">
            <div className="form-check">
              <input
                type="checkbox"
                id="mixMicWithSystem"
                checked={settings.mixMicWithSystem}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  mixMicWithSystem: e.target.checked 
                }))}
              />
              <label htmlFor="mixMicWithSystem">
                Mix microphone with system audio (single audio track)
              </label>
            </div>
            <small className="text-muted">
              Disable this if you want separate audio tracks for editing
            </small>
          </div>
        )}
      </div>

      <div className="card">
        <h4>Audio Quality</h4>
        
        <div className="form-group">
          <label className="form-label">Audio Codec</label>
          <select className="form-control form-select" value="aac" disabled>
            <option value="aac">AAC (Recommended)</option>
          </select>
          <small className="text-muted">
            AAC provides the best compression and compatibility
          </small>
        </div>

        <div className="form-group">
          <label className="form-label">Audio Bitrate</label>
          <select
            className="form-control form-select"
            value={settings.aacBitrateKbps}
            onChange={(e) => setSettings(prev => ({ 
              ...prev, 
              aacBitrateKbps: parseInt(e.target.value) 
            }))}
          >
            <option value={128}>128 kbps (Good for voice)</option>
            <option value={160}>160 kbps (Recommended)</option>
            <option value={192}>192 kbps (High quality)</option>
            <option value={256}>256 kbps (Maximum quality)</option>
          </select>
        </div>
      </div>

      <div className="card">
        <h4>Audio Device Information</h4>
        <div className="device-list">
          {audioDevices.map(device => (
            <div key={device.id} className="device-item">
              <div className="device-info">
                <div className="device-name">{device.name}</div>
                <div className="device-type">
                  {device.type === 'input' ? '🎤 Input Device' : '🔊 Output Device'}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-secondary mt-2">
          🔄 Refresh Device List
        </button>
      </div>

      <div className="form-group">
        <button type="button" className="btn btn-primary">
          Save Audio Settings
        </button>
        <button type="button" className="btn btn-secondary" style={{ marginLeft: '1rem' }}>
          Test Audio Capture
        </button>
      </div>
    </div>
  );
};

export default AudioSettings;