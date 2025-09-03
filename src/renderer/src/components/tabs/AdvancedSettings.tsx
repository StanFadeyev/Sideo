import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, AlertTriangle } from 'lucide-react';

const AdvancedSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    maxDurationMinutes: 120,
    minDiskSpaceGB: 5,
    logLevel: 'info',
    enableDebugMode: false,
    enableTelemetry: false,
    autoDeleteOldRecordings: false,
    showTechnicalNotifications: false
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Advanced Settings
        </CardTitle>
        <CardDescription>
          Advanced configuration options for power users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Safety & Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-duration">Maximum Recording Duration (minutes)</Label>
                <Input
                  id="max-duration"
                  type="number"
                  value={settings.maxDurationMinutes}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    maxDurationMinutes: parseInt(e.target.value) || 120
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-disk-space">Minimum Disk Space (GB)</Label>
                <Input
                  id="min-disk-space"
                  type="number"
                  value={settings.minDiskSpaceGB}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    minDiskSpaceGB: parseInt(e.target.value) || 5
                  }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Developer Options
            </CardTitle>
            <CardDescription>
              These settings are for debugging and development purposes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="debug-mode"
                  checked={settings.enableDebugMode}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    enableDebugMode: !!checked
                  }))}
                />
                <Label htmlFor="debug-mode" className="text-sm font-normal">
                  Enable debug mode (verbose logging)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="technical-notifications"
                  checked={settings.showTechnicalNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    showTechnicalNotifications: !!checked
                  }))}
                />
                <Label htmlFor="technical-notifications" className="text-sm font-normal">
                  Show technical notifications
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-delete"
                  checked={settings.autoDeleteOldRecordings}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    autoDeleteOldRecordings: !!checked
                  }))}
                />
                <Label htmlFor="auto-delete" className="text-sm font-normal">
                  Auto-delete old recordings (30+ days)
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Application Version:</span>
                  <Badge variant="outline">v0.1.0</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Electron Version:</span>
                  <span>26.2.1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Node.js Version:</span>
                  <span>18.17.1</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform:</span>
                  <span>Windows 11</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Architecture:</span>
                  <span>x64</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">FFmpeg Status:</span>
                  <Badge variant="default">Available</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 pt-4">
          <Button>Save Advanced Settings</Button>
          <Button variant="outline">Reset to Defaults</Button>
          <Button variant="outline">Export Logs</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedSettings;