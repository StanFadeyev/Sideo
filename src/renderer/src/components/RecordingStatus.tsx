import React from 'react';

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
    <div className="recording-status">
      <div className="recording-info">
        <div className={`status-indicator ${isRecording ? 'status-recording' : 'status-idle'}`}>
          <div className={`status-dot ${isRecording ? 'recording' : 'idle'}`}></div>
          {isRecording ? 'Recording...' : 'Ready to Record'}
        </div>

        {isRecording && recordingSession && (
          <div className="recording-timer">
            00:00:00
          </div>
        )}

        <div className="recording-controls">
          {!isRecording ? (
            <button className="btn btn-success" onClick={onStartRecording}>
              ● Start Recording
            </button>
          ) : (
            <button className="btn btn-danger" onClick={onStopRecording}>
              ■ Stop Recording
            </button>
          )}
        </div>
      </div>

      {!isRecording && (
        <div className="card">
          <h3>Quick Start</h3>
          <p>Press <kbd>Ctrl+Alt+R</kbd> or click the tray icon to start recording</p>
          <ul>
            <li>Screen recording with audio capture</li>
            <li>Configurable quality profiles</li>
            <li>Silent operation during video calls</li>
            <li>Local file storage (no internet required)</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default RecordingStatus;