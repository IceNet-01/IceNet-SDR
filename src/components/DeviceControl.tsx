/**
 * Device Control Component
 */

import { useState } from 'react';
import { useAppStore } from '../store/appStore';

const DeviceControl = () => {
  const {
    devices,
    currentDevice,
    isStreaming,
    scanDevices,
    connectDevice,
    disconnectDevice,
    startStreaming,
    stopStreaming,
    setFrequency,
    setSampleRate,
    setGain,
  } = useAppStore();

  const [frequency, setFrequencyInput] = useState(100);
  const [sampleRate, setSampleRateInput] = useState(2.048);
  const [gain, setGainInput] = useState(20);
  const [gainMode, setGainMode] = useState<'auto' | 'manual'>('auto');

  const handleConnect = (deviceId: string, deviceType: string) => {
    connectDevice(deviceId, deviceType);
  };

  const handleSetFrequency = () => {
    setFrequency(frequency * 1e6);
  };

  const handleSetSampleRate = () => {
    setSampleRate(sampleRate * 1e6);
  };

  const handleSetGain = () => {
    setGain(gain, gainMode);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
      <h3 className="text-lg font-bold text-white">Device Control</h3>

      {/* Device selection */}
      {!currentDevice ? (
        <div>
          <button
            onClick={scanDevices}
            className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            🔍 Scan for SDR Devices
          </button>

          {devices.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-sm text-gray-400">Select a device:</div>
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => handleConnect(device.id, device.type)}
                  className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-left rounded-lg transition-colors"
                >
                  <div className="font-medium text-white">{device.name}</div>
                  <div className="text-sm text-gray-400">{device.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected device info */}
          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white">{currentDevice.name}</div>
                <div className="text-sm text-gray-400">{currentDevice.description}</div>
              </div>
              <button
                onClick={disconnectDevice}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* Streaming control */}
          <div>
            {!isStreaming ? (
              <button
                onClick={() => startStreaming()}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                ▶️  Start Streaming
              </button>
            ) : (
              <button
                onClick={stopStreaming}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                ⏸️  Stop Streaming
              </button>
            )}
          </div>

          {/* Frequency control */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Frequency (MHz)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={frequency}
                onChange={(e) => setFrequencyInput(parseFloat(e.target.value))}
                step="0.001"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={handleSetFrequency}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
              >
                Set
              </button>
            </div>
          </div>

          {/* Sample rate control */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Sample Rate (MS/s)
            </label>
            <div className="flex space-x-2">
              <select
                value={sampleRate}
                onChange={(e) => setSampleRateInput(parseFloat(e.target.value))}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-primary-500"
              >
                {currentDevice.capabilities.sampleRates.map((rate) => (
                  <option key={rate} value={rate / 1e6}>
                    {(rate / 1e6).toFixed(3)} MS/s
                  </option>
                ))}
              </select>
              <button
                onClick={handleSetSampleRate}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
              >
                Set
              </button>
            </div>
          </div>

          {/* Gain control */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Gain Control
            </label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <label className="flex items-center space-x-2 text-white">
                  <input
                    type="radio"
                    value="auto"
                    checked={gainMode === 'auto'}
                    onChange={(e) => setGainMode(e.target.value as 'auto')}
                    className="text-primary-600"
                  />
                  <span>Auto</span>
                </label>
                <label className="flex items-center space-x-2 text-white">
                  <input
                    type="radio"
                    value="manual"
                    checked={gainMode === 'manual'}
                    onChange={(e) => setGainMode(e.target.value as 'manual')}
                    className="text-primary-600"
                  />
                  <span>Manual</span>
                </label>
              </div>

              {gainMode === 'manual' && (
                <div className="flex space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={gain}
                    onChange={(e) => setGainInput(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-16 text-white text-center">{gain} dB</span>
                  <button
                    onClick={handleSetGain}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
                  >
                    Set
                  </button>
                </div>
              )}

              {gainMode === 'auto' && (
                <button
                  onClick={handleSetGain}
                  className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
                >
                  Enable Auto Gain
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceControl;
