/**
 * Main App Component
 */

import { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SpectrumView from './components/SpectrumView';
import RecordingManager from './components/RecordingManager';
import Settings from './components/Settings';
import './index.css';

function App() {
  const { connected, connecting, connect, selectedView } = useAppStore();

  useEffect(() => {
    // Connect to WebSocket on mount
    connect();
  }, [connect]);

  const renderView = () => {
    switch (selectedView) {
      case 'spectrum':
      case 'waterfall':
        return <SpectrumView />;
      case 'recordings':
        return <RecordingManager />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  // Debug: log available devices
  useEffect(() => {
    console.log('Available devices:', useAppStore.getState().devices);
  }, []);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white flex items-center">
                <span className="text-primary-500">⚡</span>
                <span className="ml-2">IceNet SDR</span>
              </h1>
              <span className="text-sm text-gray-400">v1.0.0</span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection status */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connected
                      ? 'bg-green-500 animate-pulse'
                      : connecting
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-red-500'
                  }`}
                />
                <span className="text-sm text-gray-300">
                  {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* View content */}
        <main className="flex-1 overflow-auto bg-gray-900">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
