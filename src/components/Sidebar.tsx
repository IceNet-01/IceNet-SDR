/**
 * Sidebar Navigation Component
 */

import { useAppStore } from '../store/appStore';

const Sidebar = () => {
  const { selectedView, setView, currentDevice, isStreaming, devices } = useAppStore();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'spectrum', label: 'Spectrum Analyzer', icon: '📊' },
    { id: 'waterfall', label: 'Waterfall', icon: '🌊' },
    { id: 'recordings', label: 'Recordings', icon: '💾' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Available devices count */}
      <div className="p-4 border-b border-gray-700 bg-gray-750">
        <div className="text-xs text-gray-400 mb-2">Available Devices</div>
        <div className="text-2xl font-bold text-white">{devices.length}</div>
        <div className="text-xs text-gray-500 mt-1">
          {devices.filter(d => d.id === 'microphone_0' || d.id === 'simulator_0').length} virtual,
          {' '}{devices.filter(d => d.type !== 'microphone').length} hardware
        </div>
      </div>

      {/* Device status */}
      <div className="p-4 border-b border-gray-700">
        <div className="text-xs text-gray-400 mb-2">Current Device</div>
        {currentDevice ? (
          <div>
            <div className="font-medium text-white">{currentDevice.name}</div>
            <div className="text-xs text-gray-400">{currentDevice.description}</div>
            {currentDevice.config && (
              <div className="mt-2 text-xs space-y-1">
                <div className="text-gray-300">
                  📻 {(currentDevice.config.frequency / 1e6).toFixed(3)} MHz
                </div>
                <div className="text-gray-300">
                  📊 {(currentDevice.config.sampleRate / 1e6).toFixed(2)} MS/s
                </div>
                <div className="text-gray-300">
                  🎚️  {currentDevice.config.gain} dB ({currentDevice.config.gainMode})
                </div>
              </div>
            )}
            {isStreaming && (
              <div className="mt-2 inline-flex items-center px-2 py-1 rounded bg-green-600 text-white text-xs">
                <span className="animate-pulse mr-1">●</span> Streaming
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">No device connected</div>
        )}
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setView(item.id as any)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedView === item.id || (selectedView === 'spectrum' && item.id === 'dashboard') || (selectedView === 'waterfall' && item.id === 'dashboard')
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
        <div>© 2025 IceNet-01</div>
        <div>Northern Plains IT, LLC</div>
        <div>OnyxVZ, LLC</div>
      </div>
    </div>
  );
};

export default Sidebar;
