/**
 * TypeScript type definitions for IceNet SDR
 */

export interface SDRDevice {
  id: string;
  name: string;
  type: 'rtl-sdr' | 'hackrf' | 'plutosdr' | 'limesdr' | 'microphone';
  description: string;
  connected: boolean;
  capabilities: DeviceCapabilities;
  config?: DeviceConfig;
}

export interface DeviceCapabilities {
  minFreq: number;
  maxFreq: number;
  sampleRates: number[];
  gainModes: string[];
  gains?: number[];
  lnaGains?: number[];
  vgaGains?: number[];
  txCapable?: boolean;
}

export interface DeviceConfig {
  frequency: number;
  sampleRate: number;
  gain: number;
  gainMode: 'auto' | 'manual';
  lnaGain?: number;
  vgaGain?: number;
}

export interface SpectrumData {
  spectrum: number[];
  frequencies: number[];
  centerFrequency: number;
  sampleRate: number;
  timestamp: number;
}

export interface Recording {
  id: string;
  filename: string;
  startTime: number;
  duration: number;
  sampleCount: number;
  device: {
    type: string;
    frequency: number;
    sampleRate: number;
    gain: number;
  };
  filesize: number;
}

export interface RecordingStatus {
  isRecording: boolean;
  id?: string;
  filename?: string;
  elapsed?: number;
  sampleCount?: number;
  duration?: number;
}

export interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
}

export interface AppState {
  // Connection
  connected: boolean;
  connecting: boolean;

  // Devices
  devices: SDRDevice[];
  currentDevice: SDRDevice | null;

  // Spectrum
  isStreaming: boolean;
  spectrumData: SpectrumData | null;
  fftSize: number;
  updateRate: number;

  // Recording
  recordings: Recording[];
  recordingStatus: RecordingStatus;

  // Waterfall
  waterfallData: number[][];
  waterfallHeight: number;

  // UI
  selectedView: 'spectrum' | 'waterfall' | 'recordings' | 'settings';
  showWaterfall: boolean;

  // Actions
  connect: () => void;
  disconnect: () => void;
  scanDevices: () => void;
  connectDevice: (deviceId: string, deviceType: string) => void;
  disconnectDevice: () => void;
  startStreaming: (fftSize?: number, updateRate?: number) => void;
  stopStreaming: () => void;
  setFrequency: (frequency: number) => void;
  setSampleRate: (sampleRate: number) => void;
  setGain: (gain: number, gainMode?: string) => void;
  startRecording: (filename: string, duration?: number) => void;
  stopRecording: () => void;
  getRecordings: () => void;
  setView: (view: AppState['selectedView']) => void;
  updateSpectrumData: (data: SpectrumData) => void;
}

export interface DemodulatorConfig {
  mode: 'AM' | 'FM' | 'SSB-USB' | 'SSB-LSB' | 'CW';
  bandwidth: number;
  squelch: number;
  volume: number;
}
