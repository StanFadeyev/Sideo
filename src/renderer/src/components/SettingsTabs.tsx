import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  component: React.ComponentType;
}

// Import tab components (we'll create these)
import GeneralSettings from './tabs/GeneralSettings';
import VideoSettings from './tabs/VideoSettings';
import AudioSettings from './tabs/AudioSettings';
import ProfileSettings from './tabs/ProfileSettings';
import AISettings from './tabs/AISettings';
import AdvancedSettings from './tabs/AdvancedSettings';

const tabs: Tab[] = [
  { id: 'general', label: 'General', component: GeneralSettings },
  { id: 'video', label: 'Video', component: VideoSettings },
  { id: 'audio', label: 'Audio', component: AudioSettings },
  { id: 'profiles', label: 'Profiles', component: ProfileSettings },
  { id: 'ai', label: 'AI Features', component: AISettings },
  { id: 'advanced', label: 'Advanced', component: AdvancedSettings },
];

const SettingsTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="settings-container">
      <div className="tabs">
        <ul className="tab-list">
          {tabs.map(tab => (
            <li key={tab.id} className="tab-item">
              <button
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="tab-content">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default SettingsTabs;