import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Zap, HardDrive, Check } from 'lucide-react';

const ProfileSettings: React.FC = () => {
  const [activeProfile, setActiveProfile] = useState('medium');

  const profiles = [
    {
      id: 'low',
      name: 'Low Quality',
      subtitle: 'For weak PCs',
      icon: <HardDrive className="h-5 w-5" />,
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
      icon: <Settings className="h-5 w-5" />,
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
      icon: <Zap className="h-5 w-5" />,
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Quality Profiles
        </CardTitle>
        <CardDescription>
          Choose or customize recording quality presets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {profiles.map(profile => (
            <Card
              key={profile.id}
              className={`cursor-pointer transition-all ${
                activeProfile === profile.id
                  ? 'ring-2 ring-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setActiveProfile(profile.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {profile.icon}
                    <div>
                      <CardTitle className="text-lg">{profile.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{profile.subtitle}</p>
                    </div>
                  </div>
                  {activeProfile === profile.id && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Video:</span>
                    <span className="font-medium">{profile.video.resolution} @ {profile.video.fps}fps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Video Bitrate:</span>
                    <span className="font-medium">{profile.video.bitrateKbps / 1000} Mbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Audio Bitrate:</span>
                    <span className="font-medium">{profile.audio.bitrateKbps} kbps</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {profile.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Customization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You can create custom profiles by modifying the settings in the Video and Audio tabs, then saving them as a new profile.
            </p>
            <div className="flex gap-2">
              <Button variant="outline">Create Custom Profile</Button>
              <Button variant="outline">Import Profile</Button>
              <Button variant="outline">Export Profile</Button>
            </div>
          </CardContent>
        </Card>

        {profiles
          .filter(p => p.id === activeProfile)
          .map(profile => (
            <Card key={profile.id}>
              <CardHeader>
                <CardTitle className="text-lg">Profile Details: {profile.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium mb-3">Video Settings</h5>
                    <ul className="space-y-1 text-sm">
                      <li>Resolution: {profile.video.resolution}</li>
                      <li>Frame Rate: {profile.video.fps} FPS</li>
                      <li>Bitrate: {profile.video.bitrateKbps / 1000} Mbps</li>
                      <li>Encoder: Hardware (with software fallback)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-3">Audio Settings</h5>
                    <ul className="space-y-1 text-sm">
                      <li>Codec: {profile.audio.codec}</li>
                      <li>Bitrate: {profile.audio.bitrateKbps} kbps</li>
                      <li>Channels: Stereo (2.0)</li>
                      <li>Sample Rate: 48 kHz</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6">
                  <h5 className="font-medium mb-3">Estimated File Sizes (per hour)</h5>
                  <ul className="space-y-1 text-sm">
                    <li>Video: ~{Math.round(profile.video.bitrateKbps * 3.6 / 8)} MB</li>
                    <li>Audio: ~{Math.round(profile.audio.bitrateKbps * 3.6 / 8)} MB</li>
                    <li className="font-medium">Total: ~{Math.round((profile.video.bitrateKbps + profile.audio.bitrateKbps) * 3.6 / 8)} MB per hour</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Actual file sizes may vary depending on content complexity
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

        <div className="flex gap-4 pt-4">
          <Button>
            Apply Profile: {profiles.find(p => p.id === activeProfile)?.name}
          </Button>
          <Button variant="outline">
            Test Recording (30 seconds)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;