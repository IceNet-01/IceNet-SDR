/**
 * Settings Component
 */

import { useAppStore } from '../store/appStore';

const Settings = () => {
  const { fftSize, updateRate, showWaterfall } = useAppStore();

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white">Settings</h2>

      {/* Display Settings */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
        <h3 className="text-lg font-bold text-white">Display Settings</h3>

        <div>
          <label className="block text-sm text-gray-400 mb-2">FFT Size</label>
          <select
            value={fftSize}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-primary-500"
          >
            <option value={512}>512</option>
            <option value={1024}>1024</option>
            <option value={2048}>2048</option>
            <option value={4096}>4096</option>
            <option value={8192}>8192</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Update Rate (FPS)</label>
          <select
            value={updateRate}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-primary-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={60}>60</option>
          </select>
        </div>

        <div>
          <label className="flex items-center space-x-2 text-white">
            <input
              type="checkbox"
              checked={showWaterfall}
              className="rounded"
            />
            <span>Show Waterfall Display</span>
          </label>
        </div>
      </div>

      {/* About */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">About IceNet SDR</h3>
        <div className="space-y-2 text-gray-300">
          <div>Version: 1.0.0</div>
          <div>© 2025 Northern Plains IT, LLC and OnyxVZ, LLC</div>
          <div className="pt-4 mt-4 border-t border-gray-700">
            <p className="text-sm">
              IceNet SDR is a comprehensive web-based Software Defined Radio application
              with spectrum analysis, signal recording, and advanced demodulation capabilities.
            </p>
          </div>
          <div className="pt-4">
            <h4 className="font-bold mb-2">Supported Devices:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>RTL-SDR (RTL2832U)</li>
              <li>HackRF One</li>
              <li>PlutoSDR (coming soon)</li>
              <li>LimeSDR (coming soon)</li>
            </ul>
          </div>
          <div className="pt-4">
            <h4 className="font-bold mb-2">Features:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Real-time spectrum analyzer</li>
              <li>Waterfall display</li>
              <li>Signal recording and playback</li>
              <li>Multiple demodulation modes</li>
              <li>Web-based interface</li>
              <li>Cross-platform support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
