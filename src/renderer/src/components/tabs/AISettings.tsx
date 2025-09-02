import React from 'react';

const AISettings: React.FC = () => {
  return (
    <div className="settings-section ai-section">
      <div className="card-header">
        <h3 className="card-title">AI Features</h3>
        <p className="card-description">
          Transcription and summarization capabilities (Coming Soon)
        </p>
      </div>

      <div className="card ai-feature-disabled">
        <h4>🎯 Video Transcription</h4>
        <p>
          Automatically generate accurate transcripts of your recordings using local AI models.
          No internet connection required - everything runs on your computer.
        </p>
        
        <div className="form-group">
          <label className="form-label">Transcription Engine</label>
          <select className="form-control form-select" disabled>
            <option value="whisper">Whisper.cpp (Recommended)</option>
            <option value="faster-whisper">Faster-Whisper</option>
          </select>
        </div>

        <div className="settings-row">
          <div className="settings-col">
            <div className="form-group">
              <label className="form-label">Model Size</label>
              <select className="form-control form-select" disabled>
                <option value="base">Base (Fast, Good Quality)</option>
                <option value="small">Small (Faster, OK Quality)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="large">Large (Slow, Best Quality)</option>
              </select>
            </div>
          </div>
          
          <div className="settings-col">
            <div className="form-group">
              <label className="form-label">Language</label>
              <select className="form-control form-select" disabled>
                <option value="auto">Auto-detect</option>
                <option value="en">English</option>
                <option value="ru">Russian</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-group">
          <div className="form-check">
            <input type="checkbox" id="generateSRT" disabled />
            <label htmlFor="generateSRT">Generate SRT subtitle files</label>
          </div>
          
          <div className="form-check">
            <input type="checkbox" id="generateJSON" disabled />
            <label htmlFor="generateJSON">Generate detailed JSON transcripts</label>
          </div>
          
          <div className="form-check">
            <input type="checkbox" id="autoTranscribe" disabled />
            <label htmlFor="autoTranscribe">Automatically transcribe after recording</label>
          </div>
        </div>
      </div>

      <div className="card ai-feature-disabled">
        <h4>📝 Content Summarization</h4>
        <p>
          Generate concise summaries and key points from your video transcriptions using 
          local language models.
        </p>
        
        <div className="form-group">
          <label className="form-label">Summarization Model</label>
          <select className="form-control form-select" disabled>
            <option value="phi3-mini">Phi-3 Mini (Fast, 3.8B params)</option>
            <option value="qwen-0.5b">Qwen 0.5B (Very Fast)</option>
            <option value="llama-7b">Llama 7B (Better Quality)</option>
          </select>
        </div>

        <div className="settings-row">
          <div className="settings-col">
            <div className="form-group">
              <label className="form-label">Summary Length</label>
              <select className="form-control form-select" disabled>
                <option value="short">Short (Key points only)</option>
                <option value="medium">Medium (Detailed summary)</option>
                <option value="long">Long (Comprehensive)</option>
              </select>
            </div>
          </div>
          
          <div className="settings-col">
            <div className="form-group">
              <label className="form-label">Output Format</label>
              <select className="form-control form-select" disabled>
                <option value="markdown">Markdown</option>
                <option value="text">Plain Text</option>
                <option value="json">Structured JSON</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-group">
          <div className="form-check">
            <input type="checkbox" id="generateTopics" disabled />
            <label htmlFor="generateTopics">Extract key topics and themes</label>
          </div>
          
          <div className="form-check">
            <input type="checkbox" id="generateTimestamps" disabled />
            <label htmlFor="generateTimestamps">Include timestamp references</label>
          </div>
          
          <div className="form-check">
            <input type="checkbox" id="generateActionItems" disabled />
            <label htmlFor="generateActionItems">Identify action items and decisions</label>
          </div>
        </div>
      </div>

      <div className="card">
        <h4>⚠️ System Requirements</h4>
        <p>AI features require additional system resources:</p>
        <ul>
          <li><strong>RAM:</strong> 8GB+ recommended (4GB minimum)</li>
          <li><strong>Storage:</strong> 2-4GB for AI models</li>
          <li><strong>CPU:</strong> Modern processor with AVX support</li>
          <li><strong>GPU:</strong> Optional CUDA/OpenCL for faster processing</li>
        </ul>
        
        <div className="status-message status-info">
          <strong>Coming in Version 0.2.0:</strong> AI features will be available after the core recording functionality is stable.
        </div>
      </div>

      <div className="card">
        <h4>🔒 Privacy & Security</h4>
        <ul>
          <li>All AI processing happens locally on your computer</li>
          <li>No data is sent to external servers or cloud services</li>
          <li>Models run completely offline</li>
          <li>Your recordings and transcripts never leave your device</li>
        </ul>
      </div>

      <div className="form-group">
        <button type="button" className="btn btn-secondary" disabled>
          Download AI Models
        </button>
        <button type="button" className="btn btn-secondary" disabled style={{ marginLeft: '1rem' }}>
          Test Transcription
        </button>
      </div>
    </div>
  );
};

export default AISettings;