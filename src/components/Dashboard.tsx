/**
 * Dashboard Component
 */

import { useAppStore } from '../store/appStore';
import DeviceControl from './DeviceControl';

const Dashboard = () => {
  const { devices, currentDevice, scanDevices } = useAppStore();

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white">Dashboard</h2>

      {/* Device control */}
      <DeviceControl />

      {/* Quick stats */}
      {currentDevice && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Device Type</div>
            <div className="text-xl font-bold text-white">{currentDevice.type.toUpperCase()}</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Frequency Range</div>
            <div className="text-xl font-bold text-white">
              {(currentDevice.capabilities.minFreq / 1e6).toFixed(0)} -{' '}
              {(currentDevice.capabilities.maxFreq / 1e6).toFixed(0)} MHz
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Status</div>
            <div className="text-xl font-bold text-green-500">Connected</div>
          </div>
        </div>
      )}

      {/* Available devices */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Available Devices</h3>
          <button
            onClick={scanDevices}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            🔍 Scan Devices
          </button>
        </div>

        {devices.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No devices found. Click "Scan Devices" to search for SDR hardware.
          </div>
        ) : (
          <div className="space-y-2">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`p-4 rounded-lg border ${
                  device.connected
                    ? 'bg-primary-900 border-primary-700'
                    : 'bg-gray-700 border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{device.name}</div>
                    <div className="text-sm text-gray-400">{device.description}</div>
                  </div>
                  {device.connected && (
                    <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                      Connected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
