import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Folder } from 'lucide-react';

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
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Configure output location, file naming, and basic application behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="output-folder">Output Folder</Label>
          <div className="flex gap-2">
            <Input
              id="output-folder"
              value={settings.outputFolder}
              readOnly
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleOutputFolderChange}
            >
              <Folder className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={openRecordingsFolder}
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Where your recordings will be saved
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="filename-template">Filename Template</Label>
            <Input
              id="filename-template"
              value={settings.filenameTemplate}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                filenameTemplate: e.target.value 
              }))}
            />
            <p className="text-sm text-muted-foreground">
              Available variables: {'{date}'}, {'{time}'}, {'{profile}'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="container-format">Container Format</Label>
            <Select
              value={settings.containerFormat}
              onValueChange={(value) => setSettings(prev => ({ 
                ...prev, 
                containerFormat: value 
              }))}
            >
              <SelectTrigger id="container-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mkv">MKV (Recommended - More reliable)</SelectItem>
                <SelectItem value="mp4">MP4 (More compatible)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              MKV is safer for long recordings
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hotkey">Global Hotkey (Start/Stop Recording)</Label>
          <Input
            id="hotkey"
            value={settings.hotkeyStartStop}
            readOnly
            placeholder="Click to set hotkey"
          />
          <p className="text-sm text-muted-foreground">
            Current: Ctrl+Alt+R (Click to change)
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-medium">Application Behavior</h4>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showNotifications"
                checked={settings.showNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  showNotifications: !!checked 
                }))}
              />
              <Label htmlFor="showNotifications" className="text-sm font-normal">
                Show notifications when starting/stopping recordings
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="minimizeToTray"
                checked={settings.minimizeToTrayOnStart}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  minimizeToTrayOnStart: !!checked 
                }))}
              />
              <Label htmlFor="minimizeToTray" className="text-sm font-normal">
                Start minimized to system tray
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="preventSleep"
                checked={settings.preventSleepWhileRecording}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  preventSleepWhileRecording: !!checked 
                }))}
              />
              <Label htmlFor="preventSleep" className="text-sm font-normal">
                Prevent system sleep while recording
              </Label>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button>Save General Settings</Button>
          <Button variant="outline">Reset to Defaults</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralSettings;