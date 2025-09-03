import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Monitor, Square, MousePointer } from 'lucide-react';

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

  const [bitrateValue, setBitrateValue] = useState([settings.bitrateKbps]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Video Settings
        </CardTitle>
        <CardDescription>
          Configure video capture source, quality, and encoding options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="video-source">Video Source</Label>
          <Select
            value={settings.source}
            onValueChange={(value) => setSettings(prev => ({ 
              ...prev, 
              source: value 
            }))}
          >
            <SelectTrigger id="video-source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desktop">Full Desktop (Primary Display)</SelectItem>
              <SelectItem value="region">Custom Region</SelectItem>
              <SelectItem value="window">Specific Window</SelectItem>
              <SelectItem value="secondary">Secondary Display</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {settings.source === 'region' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Square className="h-4 w-4" />
                Region Capture Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="x-offset">X Offset</Label>
                  <Input
                    id="x-offset"
                    type="number"
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
                <div className="space-y-2">
                  <Label htmlFor="y-offset">Y Offset</Label>
                  <Input
                    id="y-offset"
                    type="number"
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
                <div className="space-y-2">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
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
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
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
              <Button variant="outline" className="mt-4">
                <Square className="h-4 w-4 mr-2" />
                Select Region Visually
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="fps">Frame Rate (FPS)</Label>
            <Select
              value={settings.fps.toString()}
              onValueChange={(value) => setSettings(prev => ({ 
                ...prev, 
                fps: parseInt(value) 
              }))}
            >
              <SelectTrigger id="fps">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 FPS (Cinema)</SelectItem>
                <SelectItem value="30">30 FPS (Recommended)</SelectItem>
                <SelectItem value="60">60 FPS (Smooth)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution">Resolution</Label>
            <Select
              value={settings.resolution}
              onValueChange={(value) => setSettings(prev => ({ 
                ...prev, 
                resolution: value 
              }))}
            >
              <SelectTrigger id="resolution">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1280x720">720p (1280x720)</SelectItem>
                <SelectItem value="1920x1080">1080p (1920x1080)</SelectItem>
                <SelectItem value="2560x1440">1440p (2560x1440)</SelectItem>
                <SelectItem value="3840x2160">4K (3840x2160)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Video Bitrate: {bitrateValue[0] / 1000} Mbps</Label>
            <Slider
              value={bitrateValue}
              onValueChange={(value) => {
                setBitrateValue(value);
                setSettings(prev => ({ 
                  ...prev, 
                  bitrateKbps: value[0] 
                }));
              }}
              min={1000}
              max={20000}
              step={500}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>1 Mbps</span>
              <span>20 Mbps</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Higher bitrate = better quality, larger file size
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-medium mb-2">Encoder Priority</h4>
            <p className="text-sm text-muted-foreground mb-4">
              The application will try encoders in this order (hardware first, then software fallback)
            </p>
          </div>
          <div className="space-y-2">
            {settings.encoderPriority.map((encoder, index) => (
              <div key={encoder} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <span className="font-medium">{encoder}</span>
                </div>
                <Badge variant={encoder === 'libx264' ? 'secondary' : 'default'}>
                  {encoder === 'libx264' ? 'Software' : 'Hardware'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="drawMouse"
            checked={settings.drawMouse}
            onCheckedChange={(checked) => setSettings(prev => ({ 
              ...prev, 
              drawMouse: !!checked 
            }))}
          />
          <Label htmlFor="drawMouse" className="text-sm font-normal flex items-center gap-2">
            <MousePointer className="h-4 w-4" />
            Show mouse cursor in recordings
          </Label>
        </div>

        <div className="flex gap-4 pt-4">
          <Button>Save Video Settings</Button>
          <Button variant="outline">Test Encoders</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoSettings;