/**
 * Recording Manager Component
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';

const RecordingManager = () => {
  const {
    recordings,
    recordingStatus,
    currentDevice,
    startRecording,
    stopRecording,
    getRecordings,
  } = useAppStore();

  const [filename, setFilename] = useState('');
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [useDuration, setUseDuration] = useState(false);

  useEffect(() => {
    getRecordings();
  }, [getRecordings]);

  const handleStartRecording = () => {
    if (!filename) {
      alert('Please enter a filename');
      return;
    }

    const recordingDuration = useDuration ? duration : undefined;
    startRecording(filename, recordingDuration);
    setFilename('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white">Recording Manager</h2>

      {/* Recording controls */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
        <h3 className="text-lg font-bold text-white">Record Signal</h3>

        {!currentDevice ? (
          <div className="text-gray-500 text-center py-4">
            Connect a device to start recording
          </div>
        ) : recordingStatus.isRecording ? (
          <div className="space-y-4">
            <div className="p-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-red-500 text-2xl animate-pulse">●</span>
                  <span className="text-white font-bold">Recording in Progress</span>
                </div>
                <button
                  onClick={stopRecording}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  ⏹️  Stop Recording
                </button>
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                <div>Filename: {recordingStatus.filename}</div>
                <div>Duration: {formatDuration(recordingStatus.elapsed || 0)}</div>
                <div>Samples: {recordingStatus.sampleCount?.toLocaleString()}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Filename</label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="my_recording"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-primary-500"
              />
              <div className="text-xs text-gray-500 mt-1">
                Recording will be saved as {filename || 'filename'}.iq
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-white mb-2">
                <input
                  type="checkbox"
                  checked={useDuration}
                  onChange={(e) => setUseDuration(e.target.checked)}
                  className="rounded"
                />
                <span>Auto-stop after duration</span>
              </label>

              {useDuration && (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={duration || ''}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    placeholder="60"
                    min="1"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-primary-500"
                  />
                  <span className="text-gray-400">seconds</span>
                </div>
              )}
            </div>

            <button
              onClick={handleStartRecording}
              disabled={!filename}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              🔴 Start Recording
            </button>
          </div>
        )}
      </div>

      {/* Recordings list */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Saved Recordings</h3>
          <button
            onClick={getRecordings}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {recordings.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No recordings yet. Create your first recording above.
          </div>
        ) : (
          <div className="space-y-2">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-white mb-1">{recording.filename}</div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>
                        📅 {new Date(recording.startTime).toLocaleString()}
                      </div>
                      <div>
                        ⏱️  Duration: {formatDuration(recording.duration)}
                      </div>
                      <div>
                        📻 Frequency: {(recording.device.frequency / 1e6).toFixed(3)} MHz
                      </div>
                      <div>
                        📊 Sample Rate: {(recording.device.sampleRate / 1e6).toFixed(2)} MS/s
                      </div>
                      <div>
                        📦 Size: {formatFileSize(recording.filesize)} ({recording.sampleCount.toLocaleString()} samples)
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded transition-colors">
                      ▶️  Play
                    </button>
                    <button className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors">
                      📥 Export
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingManager;
