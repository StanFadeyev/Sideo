import React, { useState } from 'react';

const ProfileSettings: React.FC = () => {
  const [activeProfile, setActiveProfile] = useState('medium');

  const profiles = [
    {
      id: 'low',
      name: 'Low Quality',
      subtitle: 'For weak PCs',
      video: {
        resolution: '1280x720',
        fps: 24,
        bitrateKbps: 4000
      },
      audio: {
        bitrateKbps: 128,
        codec: 'AAC'
      },
      description: 'Optimized for older hardware and slower systems'
    },
    {
      id: 'medium',
      name: 'Medium Quality',
      subtitle: 'Recommended',
      video: {
        resolution: '1920x1080',
        fps: 30,
        bitrateKbps: 8000
      },
      audio: {
        bitrateKbps: 160,
        codec: 'AAC'
      },
      description: 'Perfect balance of quality and performance'
    },
    {
      id: 'high',
      name: 'High Quality',
      subtitle: 'Best quality',
      video: {
        resolution: '1920x1080',
        fps: 60,
        bitrateKbps: 12000
      },
      audio: {
        bitrateKbps: 192,
        codec: 'AAC'
      },
      description: 'Maximum quality for powerful systems'
    }
  ];

  return (
    <div className="settings-section">
      <div className="card-header">
        <h3 className="card-title">Quality Profiles</h3>
        <p className="card-description">
          Choose or customize recording quality presets
        </p>
      </div>

      <div className="quality-profiles">
        {profiles.map(profile => (
          <div
            key={profile.id}
            className={`profile-card ${activeProfile === profile.id ? 'active' : ''}`}
            onClick={() => setActiveProfile(profile.id)}
          >
            <div className="profile-name">
              {profile.name}
              <span className="profile-subtitle"> - {profile.subtitle}</span>
            </div>
            
            <div className="profile-specs">
              <div><strong>Video:</strong> {profile.video.resolution} @ {profile.video.fps}fps</div>
              <div><strong>Bitrate:</strong> {profile.video.bitrateKbps / 1000} Mbps video, {profile.audio.bitrateKbps} kbps audio</div>
              <div><strong>Codec:</strong> H.264 + {profile.audio.codec}</div>
            </div>
            
            <div className="profile-description">
              {profile.description}
            </div>
            
            {activeProfile === profile.id && (
              <div className="profile-active-indicator">
                ✓ Currently Active
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h4>Profile Customization</h4>
        <p>You can create custom profiles by modifying the settings in the Video and Audio tabs, then saving them as a new profile.</p>
        
        <div className="form-group">
          <button type="button" className="btn btn-secondary">
            Create Custom Profile
          </button>
          <button type="button" className="btn btn-secondary" style={{ marginLeft: '1rem' }}>
            Import Profile
          </button>
          <button type="button" className="btn btn-secondary" style={{ marginLeft: '1rem' }}>
            Export Profile
          </button>
        </div>
      </div>

      <div className="card">
        <h4>Profile Details: {profiles.find(p => p.id === activeProfile)?.name}</h4>
        
        {profiles
          .filter(p => p.id === activeProfile)
          .map(profile => (
            <div key={profile.id}>
              <div className="settings-row">
                <div className="settings-col">
                  <h5>Video Settings</h5>
                  <ul>
                    <li>Resolution: {profile.video.resolution}</li>
                    <li>Frame Rate: {profile.video.fps} FPS</li>
                    <li>Bitrate: {profile.video.bitrateKbps / 1000} Mbps</li>
                    <li>Encoder: Hardware (with software fallback)</li>
                  </ul>
                </div>
                
                <div className="settings-col">
                  <h5>Audio Settings</h5>
                  <ul>
                    <li>Codec: {profile.audio.codec}</li>
                    <li>Bitrate: {profile.audio.bitrateKbps} kbps</li>
                    <li>Channels: Stereo (2.0)</li>
                    <li>Sample Rate: 48 kHz</li>
                  </ul>
                </div>
              </div>

              <div className="estimated-file-size">
                <h5>Estimated File Sizes (per hour)</h5>
                <ul>
                  <li>Video: ~{Math.round(profile.video.bitrateKbps * 3.6 / 8)} MB</li>
                  <li>Audio: ~{Math.round(profile.audio.bitrateKbps * 3.6 / 8)} MB</li>
                  <li><strong>Total: ~{Math.round((profile.video.bitrateKbps + profile.audio.bitrateKbps) * 3.6 / 8)} MB per hour</strong></li>
                </ul>
                <small className="text-muted">
                  Actual file sizes may vary depending on content complexity
                </small>
              </div>
            </div>
          ))}
      </div>

      <div className="form-group">
        <button type="button" className="btn btn-primary">
          Apply Profile: {profiles.find(p => p.id === activeProfile)?.name}
        </button>
        <button type="button" className="btn btn-secondary" style={{ marginLeft: '1rem' }}>
          Test Recording (30 seconds)
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;