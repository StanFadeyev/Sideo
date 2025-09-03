import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import tab components
import GeneralSettings from './tabs/GeneralSettings';
import VideoSettings from './tabs/VideoSettings';
import AudioSettings from './tabs/AudioSettings';
import ProfileSettings from './tabs/ProfileSettings';
import AISettings from './tabs/AISettings';
import AdvancedSettings from './tabs/AdvancedSettings';

interface TabItem {
  id: string;
  label: string;
  component: React.ComponentType;
}

const tabs: TabItem[] = [
  { id: 'general', label: 'General', component: GeneralSettings },
  { id: 'video', label: 'Video', component: VideoSettings },
  { id: 'audio', label: 'Audio', component: AudioSettings },
  { id: 'profiles', label: 'Profiles', component: ProfileSettings },
  { id: 'ai', label: 'AI Features', component: AISettings },
  { id: 'advanced', label: 'Advanced', component: AdvancedSettings },
];

const SettingsTabs: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {tabs.map(tab => {
          const Component = tab.component;
          return (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              <Component />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default SettingsTabs;