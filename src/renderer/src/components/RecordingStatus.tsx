import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Square, Circle, Clock } from 'lucide-react';

interface RecordingStatusProps {
  isRecording: boolean;
  recordingSession?: any;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const RecordingStatus: React.FC<RecordingStatusProps> = ({
  isRecording,
  recordingSession,
  onStartRecording,
  onStopRecording
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isRecording ? (
              <>
                <Circle className="h-5 w-5 text-red-500 animate-pulse fill-current" />
                Recording Status
              </>
            ) : (
              <>
                <Circle className="h-5 w-5 text-gray-400" />
                Recording Status
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isRecording ? 'Recording is currently active' : 'Ready to start recording'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={isRecording ? 'destructive' : 'secondary'} className="text-lg px-4 py-2">
                {isRecording ? 'Recording...' : 'Ready to Record'}
              </Badge>
              {isRecording && (
                <div className="flex items-center gap-2 text-lg font-mono">
                  <Clock className="h-4 w-4" />
                  00:00:00
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {!isRecording ? (
                <Button size="lg" onClick={onStartRecording} className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Start Recording
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  variant="destructive" 
                  onClick={onStopRecording}
                  className="flex items-center gap-2"
                >
                  <Square className="h-5 w-5" />
                  Stop Recording
                </Button>
              )}
            </div>
          </div>

          {isRecording && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Recording Progress</span>
                  <span>No time limit</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!isRecording && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>
              Press <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl+Alt+R</kbd> or click the tray icon to start recording
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Screen recording with audio capture
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Configurable quality profiles
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Silent operation during video calls
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Local file storage (no internet required)
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecordingStatus;