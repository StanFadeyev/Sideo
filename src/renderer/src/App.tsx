import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Monitor, Settings } from 'lucide-react';

// Import components
import SettingsTabs from './components/SettingsTabs';
import RecordingStatus from './components/RecordingStatus';

interface AppState {
  isRecording: boolean;
  recordingSession?: any;
  currentView: 'status' | 'settings';
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    isRecording: false,
    currentView: 'settings'
  });

  useEffect(() => {
    // Load initial app state
    loadAppState();

    // Handle hash routing for settings window
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/settings') {
        setAppState(prev => ({ ...prev, currentView: 'settings' }));
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check initial hash

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const loadAppState = async () => {
    try {
      if (window.electronAPI) {
        const state = await window.electronAPI.getAppState();
        setAppState(prev => ({
          ...prev,
          isRecording: state.isRecording,
          recordingSession: state.recordingSession
        }));
      }
    } catch (error) {
      console.error('Failed to load app state:', error);
    }
  };

  const handleStartRecording = async () => {
    try {
      if (window.electronAPI) {
        const success = await window.electronAPI.startRecording();
        if (success) {
          setAppState(prev => ({ ...prev, isRecording: true }));
        }
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      if (window.electronAPI) {
        const success = await window.electronAPI.stopRecording();
        if (success) {
          setAppState(prev => ({ ...prev, isRecording: false }));
        }
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Sideo</h1>
                <p className="text-sm text-muted-foreground">Screen Recorder</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">v0.1.0</Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAppState(prev => ({
                  ...prev, 
                  currentView: prev.currentView === 'settings' ? 'status' : 'settings'
                }))}
              >
                <Settings className="h-4 w-4 mr-2" />
                {appState.currentView === 'settings' ? 'Status' : 'Settings'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {appState.currentView === 'status' && (
          <RecordingStatus
            isRecording={appState.isRecording}
            recordingSession={appState.recordingSession}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
          />
        )}

        {appState.currentView === 'settings' && (
          <SettingsTabs />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Open-source screen recording application for Windows 11
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Button variant="link" size="sm" className="h-auto p-0">
                GitHub
              </Button>
              <span className="text-muted-foreground">•</span>
              <Button variant="link" size="sm" className="h-auto p-0">
                Documentation
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;