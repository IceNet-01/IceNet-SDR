/**
 * Application State Store (Zustand)
 */

import { create } from 'zustand';
import { AppState, SDRDevice, SpectrumData, Recording, RecordingStatus } from '../types';
import { WebSocketManager } from '../lib/webSocketManager';

const wsUrl = import.meta.env.DEV
  ? 'ws://localhost:8080'
  : `ws://${window.location.host}`;

const wsManager = new WebSocketManager(wsUrl);

export const useAppStore = create<AppState>((set, get) => {
  // Setup WebSocket message handlers
  wsManager.on('welcome', (data) => {
    console.log('Received welcome message:', data);
    set({
      devices: data.devices || [],
      currentDevice: data.currentDevice,
      isStreaming: data.isStreaming
    });
  });

  wsManager.on('devices_list', (data) => {
    set({ devices: data });
  });

  wsManager.on('device_connected', (data) => {
    set({ currentDevice: data });
  });

  wsManager.on('device_disconnected', () => {
    set({ currentDevice: null, isStreaming: false });
  });

  wsManager.on('streaming_started', (data) => {
    set({ isStreaming: true, fftSize: data.fftSize, updateRate: data.updateRate });
  });

  wsManager.on('streaming_stopped', () => {
    set({ isStreaming: false });
  });

  wsManager.on('spectrum_data', (data: SpectrumData) => {
    get().updateSpectrumData(data);
  });

  wsManager.on('frequency_changed', (data) => {
    const currentDevice = get().currentDevice;
    if (currentDevice && currentDevice.config) {
      currentDevice.config.frequency = data.frequency;
      set({ currentDevice: { ...currentDevice } });
    }
  });

  wsManager.on('sample_rate_changed', (data) => {
    const currentDevice = get().currentDevice;
    if (currentDevice && currentDevice.config) {
      currentDevice.config.sampleRate = data.sampleRate;
      set({ currentDevice: { ...currentDevice } });
    }
  });

  wsManager.on('gain_changed', (data) => {
    const currentDevice = get().currentDevice;
    if (currentDevice && currentDevice.config) {
      currentDevice.config.gain = data.gain;
      currentDevice.config.gainMode = data.gainMode;
      set({ currentDevice: { ...currentDevice } });
    }
  });

  wsManager.on('recording_started', (data) => {
    set({
      recordingStatus: {
        isRecording: true,
        id: data.recordingId,
        filename: data.filename,
        elapsed: 0,
        sampleCount: 0
      }
    });
  });

  wsManager.on('recording_stopped', (data) => {
    set({
      recordingStatus: { isRecording: false }
    });
    get().getRecordings();
  });

  wsManager.on('recordings_list', (data) => {
    set({ recordings: data });
  });

  wsManager.on('error', (data) => {
    console.error('Server error:', data.message);
    alert(`Error: ${data.message}`);
  });

  return {
    // Initial state
    connected: false,
    connecting: false,
    devices: [],
    currentDevice: null,
    isStreaming: false,
    spectrumData: null,
    fftSize: 2048,
    updateRate: 30,
    recordings: [],
    recordingStatus: { isRecording: false },
    waterfallData: [],
    waterfallHeight: 100,
    selectedView: 'spectrum',
    showWaterfall: true,

    // Actions
    connect: () => {
      set({ connecting: true });
      wsManager.connect(
        () => set({ connected: true, connecting: false }),
        () => set({ connected: false, connecting: false })
      );
    },

    disconnect: () => {
      wsManager.disconnect();
      set({ connected: false });
    },

    scanDevices: () => {
      wsManager.send('scan_devices');
    },

    connectDevice: (deviceId: string, deviceType: string) => {
      wsManager.send('connect_device', { deviceId, deviceType });
    },

    disconnectDevice: () => {
      wsManager.send('disconnect_device');
    },

    startStreaming: (fftSize = 2048, updateRate = 30) => {
      wsManager.send('start_streaming', { fftSize, updateRate });
    },

    stopStreaming: () => {
      wsManager.send('stop_streaming');
    },

    setFrequency: (frequency: number) => {
      wsManager.send('set_frequency', { frequency });
    },

    setSampleRate: (sampleRate: number) => {
      wsManager.send('set_sample_rate', { sampleRate });
    },

    setGain: (gain: number, gainMode = 'manual') => {
      wsManager.send('set_gain', { gain, gainMode });
    },

    startRecording: (filename: string, duration?: number) => {
      wsManager.send('start_recording', { filename, duration });
    },

    stopRecording: () => {
      wsManager.send('stop_recording');
    },

    getRecordings: () => {
      wsManager.send('get_recordings');
    },

    setView: (view) => {
      set({ selectedView: view });
    },

    updateSpectrumData: (data: SpectrumData) => {
      set({ spectrumData: data });

      // Update waterfall
      const waterfallData = get().waterfallData;
      const newWaterfallData = [data.spectrum, ...waterfallData.slice(0, get().waterfallHeight - 1)];
      set({ waterfallData: newWaterfallData });
    }
  };
});

export default useAppStore;
