import React, { useState, useEffect } from 'react';
import './App.css';

// Import components that we'll create
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
    <div className="app">
      <div className="app-header">
        <h1>Sideo - Screen Recorder</h1>
        <div className="version">v0.1.0</div>
      </div>

      <main className="app-main">
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

      <footer className="app-footer">
        <p>Open-source screen recording application for Windows 11</p>
        <div className="footer-links">
          <a href="#" onClick={(e) => {
            e.preventDefault();
            // TODO: Open GitHub repository
          }}>
            GitHub
          </a>
          <span>•</span>
          <a href="#" onClick={(e) => {
            e.preventDefault();
            // TODO: Open documentation
          }}>
            Documentation
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;