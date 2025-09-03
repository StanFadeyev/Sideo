import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Volume2, Mic, Speaker } from 'lucide-react';

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

  const [systemVolume, setSystemVolume] = useState([settings.systemVolume]);
  const [micVolume, setMicVolume] = useState([settings.micVolume]);

  const audioDevices = [
    { id: 'stereo-mix', name: 'Stereo Mix (Realtek HD Audio)', type: 'output' },
    { id: 'speakers', name: 'Speakers (High Definition Audio)', type: 'output' },
    { id: 'usb-mic', name: 'Microphone (USB Audio Device)', type: 'input' },
    { id: 'built-in-mic', name: 'Built-in Microphone', type: 'input' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Audio Settings
        </CardTitle>
        <CardDescription>
          Configure audio sources, mixing, and quality settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Audio Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableSystemAudio"
                  checked={settings.enableSystemAudio}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    enableSystemAudio: !!checked 
                  }))}
                />
                <Label htmlFor="enableSystemAudio" className="font-medium flex items-center gap-2">
                  <Speaker className="h-4 w-4" />
                  Capture System Audio (Desktop sounds, music, etc.)
                </Label>
              </div>

              {settings.enableSystemAudio && (
                <div className="ml-6 space-y-4">
                  <div className="space-y-2">
                    <Label>System Audio Device</Label>
                    <Select
                      value={settings.systemDevice}
                      onValueChange={(value) => setSettings(prev => ({ 
                        ...prev, 
                        systemDevice: value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {audioDevices
                          .filter(device => device.type === 'output')
                          .map(device => (
                            <SelectItem key={device.id} value={device.name}>
                              {device.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>System Audio Volume: {systemVolume[0]}%</Label>
                    <Slider
                      value={systemVolume}
                      onValueChange={(value) => {
                        setSystemVolume(value);
                        setSettings(prev => ({ 
                          ...prev, 
                          systemVolume: value[0] 
                        }));
                      }}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableMicAudio"
                  checked={settings.enableMicAudio}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    enableMicAudio: !!checked 
                  }))}
                />
                <Label htmlFor="enableMicAudio" className="font-medium flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Capture Microphone (Your voice, commentary)
                </Label>
              </div>

              {settings.enableMicAudio && (
                <div className="ml-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Microphone Device</Label>
                    <Select
                      value={settings.micDevice}
                      onValueChange={(value) => setSettings(prev => ({ 
                        ...prev, 
                        micDevice: value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {audioDevices
                          .filter(device => device.type === 'input')
                          .map(device => (
                            <SelectItem key={device.id} value={device.name}>
                              {device.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Microphone Volume: {micVolume[0]}%</Label>
                    <Slider
                      value={micVolume}
                      onValueChange={(value) => {
                        setMicVolume(value);
                        setSettings(prev => ({ 
                          ...prev, 
                          micVolume: value[0] 
                        }));
                      }}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>

                  <Button variant="outline">
                    <Mic className="h-4 w-4 mr-2" />
                    Test Microphone
                  </Button>
                </div>
              )}
            </div>

            {settings.enableSystemAudio && settings.enableMicAudio && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mixMicWithSystem"
                    checked={settings.mixMicWithSystem}
                    onCheckedChange={(checked) => setSettings(prev => ({ 
                      ...prev, 
                      mixMicWithSystem: !!checked 
                    }))}
                  />
                  <Label htmlFor="mixMicWithSystem" className="text-sm font-normal">
                    Mix microphone with system audio (single audio track)
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Disable this if you want separate audio tracks for editing
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Audio Quality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Audio Codec</Label>
              <Select value="aac" disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aac">AAC (Recommended)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                AAC provides the best compression and compatibility
              </p>
            </div>

            <div className="space-y-2">
              <Label>Audio Bitrate</Label>
              <Select
                value={settings.aacBitrateKbps.toString()}
                onValueChange={(value) => setSettings(prev => ({ 
                  ...prev, 
                  aacBitrateKbps: parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="128">128 kbps (Good for voice)</SelectItem>
                  <SelectItem value="160">160 kbps (Recommended)</SelectItem>
                  <SelectItem value="192">192 kbps (High quality)</SelectItem>
                  <SelectItem value="256">256 kbps (Maximum quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 pt-4">
          <Button>Save Audio Settings</Button>
          <Button variant="outline">Reset to Defaults</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioSettings;