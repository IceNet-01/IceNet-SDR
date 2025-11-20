/**
 * Application State Store (Zustand)
 */

import { create } from 'zustand';
import { AppState, SDRDevice, SpectrumData } from '../types';
import { WebSocketManager } from '../lib/webSocketManager';
import { MicrophoneManager } from '../lib/microphoneManager';
import { SignalSimulator } from '../lib/signalSimulator';

const wsUrl = import.meta.env.DEV
  ? 'ws://localhost:8080'
  : `ws://${window.location.host}`;

const wsManager = new WebSocketManager(wsUrl);
const micManager = new MicrophoneManager();
const simulator = new SignalSimulator();

export const useAppStore = create<AppState>((set, get) => {
  // Setup WebSocket message handlers
  wsManager.on('welcome', (data) => {
    console.log('Received welcome message:', data);

    // Add virtual devices to the list
    const virtualDevices: SDRDevice[] = [
      {
        id: 'microphone_0',
        name: 'Computer Microphone',
        type: 'microphone',
        description: 'Built-in or external microphone (audio spectrum 0-24 kHz)',
        connected: false,
        capabilities: {
          minFreq: 0,
          maxFreq: 24000,
          sampleRates: [48000, 44100],
          gainModes: ['auto'],
          gains: []
        }
      },
      {
        id: 'simulator_0',
        name: 'Signal Simulator',
        type: 'microphone',
        description: 'Virtual RF signal generator (simulated signals for testing)',
        connected: false,
        capabilities: {
          minFreq: 24e6,
          maxFreq: 1766e6,
          sampleRates: [2048000, 1024000],
          gainModes: ['manual'],
          gains: [0]
        }
      }
    ];

    const allDevices = [...virtualDevices, ...(data.devices || [])];

    set({
      devices: allDevices,
      currentDevice: data.currentDevice,
      isStreaming: data.isStreaming
    });
  });

  wsManager.on('devices_list', (data) => {
    // Keep virtual devices and add hardware devices
    const virtualDevices = get().devices.filter(d => d.id === 'microphone_0' || d.id === 'simulator_0');
    set({ devices: [...virtualDevices, ...data] });
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

  wsManager.on('recording_stopped', () => {
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
    devices: [
      {
        id: 'microphone_0',
        name: 'Computer Microphone',
        type: 'microphone',
        description: 'Built-in or external microphone (audio spectrum 0-24 kHz)',
        connected: false,
        capabilities: {
          minFreq: 0,
          maxFreq: 24000,
          sampleRates: [48000, 44100],
          gainModes: ['auto'],
          gains: []
        }
      },
      {
        id: 'simulator_0',
        name: 'Signal Simulator',
        type: 'microphone',
        description: 'Virtual RF signal generator (simulated signals for testing)',
        connected: false,
        capabilities: {
          minFreq: 24e6,
          maxFreq: 1766e6,
          sampleRates: [2048000, 1024000],
          gainModes: ['manual'],
          gains: [0]
        }
      }
    ],
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

    connectDevice: async (deviceId: string, deviceType: string) => {
      // Handle microphone connection
      if (deviceId === 'microphone_0') {
        try {
          await micManager.initialize();

          const micDevice: SDRDevice = {
            id: deviceId,
            name: 'Computer Microphone',
            type: 'microphone',
            description: 'Built-in or external microphone (audio spectrum 0-24 kHz)',
            connected: true,
            capabilities: {
              minFreq: 0,
              maxFreq: 24000,
              sampleRates: [48000, 44100],
              gainModes: ['auto'],
              gains: []
            },
            config: {
              frequency: 12000,
              sampleRate: micManager.getSampleRate(),
              gain: 0,
              gainMode: 'auto'
            }
          };

          set({ currentDevice: micDevice });
          console.log('✅ Microphone connected');
        } catch (error) {
          console.error('Failed to connect microphone:', error);
          alert('Failed to access microphone. Please grant microphone permissions in your browser.');
        }
        return;
      }

      // Handle simulator connection
      if (deviceId === 'simulator_0') {
        const simDevice: SDRDevice = {
          id: deviceId,
          name: 'Signal Simulator',
          type: 'microphone',
          description: 'Virtual RF signal generator (simulated signals for testing)',
          connected: true,
          capabilities: {
            minFreq: 24e6,
            maxFreq: 1766e6,
            sampleRates: [2048000, 1024000],
            gainModes: ['manual'],
            gains: [0]
          },
          config: {
            frequency: 100e6,
            sampleRate: 2048000,
            gain: 0,
            gainMode: 'manual'
          }
        };

        set({ currentDevice: simDevice });
        console.log('✅ Signal simulator connected');
        return;
      }

      // Handle physical SDR device
      wsManager.send('connect_device', { deviceId, deviceType });
    },

    disconnectDevice: async () => {
      const currentDevice = get().currentDevice;

      if (currentDevice?.id === 'microphone_0') {
        get().stopStreaming();
        await micManager.stop();
        set({ currentDevice: null });
        console.log('✅ Microphone disconnected');
        return;
      }

      if (currentDevice?.id === 'simulator_0') {
        get().stopStreaming();
        simulator.stopStreaming();
        set({ currentDevice: null });
        console.log('✅ Signal simulator disconnected');
        return;
      }

      wsManager.send('disconnect_device');
    },

    startStreaming: (fftSize = 2048, updateRate = 30) => {
      const currentDevice = get().currentDevice;

      // Handle microphone streaming
      if (currentDevice?.id === 'microphone_0') {
        micManager.setFFTSize(fftSize);

        micManager.startStreaming((data) => {
          const spectrumData: SpectrumData = {
            spectrum: data.magnitude,
            frequencies: data.frequencies.map(f => f / micManager.getSampleRate()),
            centerFrequency: 12000,
            sampleRate: micManager.getSampleRate(),
            timestamp: Date.now()
          };

          get().updateSpectrumData(spectrumData);
        });

        set({ isStreaming: true, fftSize, updateRate });
        console.log('✅ Started microphone streaming');
        return;
      }

      // Handle simulator streaming
      if (currentDevice?.id === 'simulator_0') {
        simulator.setFFTSize(fftSize);

        simulator.startStreaming((data) => {
          const spectrumData: SpectrumData = {
            spectrum: data.magnitude,
            frequencies: data.frequencies,
            centerFrequency: simulator.getCenterFrequency(),
            sampleRate: simulator.getSampleRate(),
            timestamp: Date.now()
          };

          get().updateSpectrumData(spectrumData);
        }, updateRate);

        set({ isStreaming: true, fftSize, updateRate });
        console.log('✅ Started signal simulator streaming');
        return;
      }

      // Handle physical SDR streaming
      wsManager.send('start_streaming', { fftSize, updateRate });
    },

    stopStreaming: () => {
      const currentDevice = get().currentDevice;

      if (currentDevice?.id === 'microphone_0') {
        micManager.stopStreaming();
        set({ isStreaming: false });
        console.log('⏸️ Stopped microphone streaming');
        return;
      }

      if (currentDevice?.id === 'simulator_0') {
        simulator.stopStreaming();
        set({ isStreaming: false });
        console.log('⏸️ Stopped signal simulator streaming');
        return;
      }

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
