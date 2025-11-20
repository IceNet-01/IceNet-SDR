/**
 * SDR Device Manager
 * Handles connection and control of various SDR devices
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export class SDRDeviceManager extends EventEmitter {
  constructor(logger) {
    super();
    this.logger = logger;
    this.devices = [];
    this.currentDevice = null;
    this.rtlProcess = null;
    this.sampleBuffer = [];
  }

  async initialize() {
    this.logger.info('🔧 Initializing SDR Device Manager...');
    await this.scanDevices();
  }

  /**
   * Scan for available SDR devices
   */
  async scanDevices() {
    this.logger.info('🔍 Scanning for SDR devices...');
    this.devices = [];

    // Scan for RTL-SDR devices
    await this.scanRTLSDR();

    // Scan for HackRF devices
    await this.scanHackRF();

    // Scan for PlutoSDR devices
    await this.scanPlutoSDR();

    this.logger.info(`Found ${this.devices.length} SDR device(s)`);
    return this.devices;
  }

  async scanRTLSDR() {
    return new Promise((resolve) => {
      const rtlTest = spawn('rtl_test', ['-t']);
      let output = '';

      rtlTest.stdout.on('data', (data) => {
        output += data.toString();
      });

      rtlTest.stderr.on('data', (data) => {
        output += data.toString();
      });

      rtlTest.on('close', () => {
        // Parse RTL-SDR device info
        const deviceMatch = output.match(/Found \d+ device\(s\):/);
        if (deviceMatch) {
          const lines = output.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('Realtek, RTL') || lines[i].includes('Generic RTL')) {
              this.devices.push({
                id: `rtl_${this.devices.length}`,
                name: 'RTL-SDR',
                type: 'rtl-sdr',
                description: lines[i].trim(),
                capabilities: {
                  minFreq: 24e6,
                  maxFreq: 1766e6,
                  sampleRates: [250000, 1024000, 1536000, 1800000, 1920000, 2048000, 2400000, 2560000],
                  gainModes: ['auto', 'manual'],
                  gains: [0, 0.9, 1.4, 2.7, 3.7, 7.7, 8.7, 12.5, 14.4, 15.7, 16.6, 19.7, 20.7, 22.9, 25.4, 28.0, 29.7, 32.8, 33.8, 36.4, 37.2, 38.6, 40.2, 42.1, 43.4, 43.9, 44.5, 48.0, 49.6]
                }
              });
              this.logger.info(`✅ Found RTL-SDR device: ${lines[i].trim()}`);
            }
          }
        }
        resolve();
      });

      rtlTest.on('error', (error) => {
        this.logger.debug('RTL-SDR not found or rtl_test not installed');
        resolve();
      });

      // Kill rtl_test after 2 seconds
      setTimeout(() => {
        rtlTest.kill();
      }, 2000);
    });
  }

  async scanHackRF() {
    return new Promise((resolve) => {
      const hackrfInfo = spawn('hackrf_info');
      let output = '';

      hackrfInfo.stdout.on('data', (data) => {
        output += data.toString();
      });

      hackrfInfo.on('close', (code) => {
        if (code === 0 && output.includes('Serial number:')) {
          const serialMatch = output.match(/Serial number: ([\w]+)/);
          const serial = serialMatch ? serialMatch[1] : 'unknown';

          this.devices.push({
            id: `hackrf_${serial}`,
            name: 'HackRF One',
            type: 'hackrf',
            description: `HackRF One (SN: ${serial})`,
            capabilities: {
              minFreq: 1e6,
              maxFreq: 6000e6,
              sampleRates: [2e6, 4e6, 8e6, 10e6, 12.5e6, 16e6, 20e6],
              gainModes: ['manual'],
              lnaGains: [0, 8, 16, 24, 32, 40],
              vgaGains: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62],
              txCapable: true
            }
          });
          this.logger.info(`✅ Found HackRF One: ${serial}`);
        }
        resolve();
      });

      hackrfInfo.on('error', () => {
        this.logger.debug('HackRF not found or hackrf_info not installed');
        resolve();
      });
    });
  }

  async scanPlutoSDR() {
    // PlutoSDR detection would use iio_info or similar
    // This is a placeholder for now
    this.logger.debug('PlutoSDR scanning not yet implemented');
    return Promise.resolve();
  }

  /**
   * Connect to a specific device
   */
  async connectDevice(deviceId, deviceType) {
    this.logger.info(`🔌 Connecting to device: ${deviceId} (${deviceType})`);

    const device = this.devices.find(d => d.id === deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    // Set default configuration
    device.config = {
      frequency: 100e6, // 100 MHz default
      sampleRate: device.capabilities.sampleRates[0],
      gain: device.capabilities.gains ? device.capabilities.gains[0] : 20,
      gainMode: 'auto'
    };

    this.currentDevice = device;
    this.logger.info(`✅ Connected to ${device.name}`);

    return device;
  }

  /**
   * Disconnect current device
   */
  async disconnectDevice() {
    if (this.rtlProcess) {
      this.rtlProcess.kill();
      this.rtlProcess = null;
    }

    this.currentDevice = null;
    this.logger.info('🔌 Device disconnected');
  }

  /**
   * Set center frequency
   */
  async setFrequency(frequency) {
    if (!this.currentDevice) {
      throw new Error('No device connected');
    }

    const { minFreq, maxFreq } = this.currentDevice.capabilities;
    if (frequency < minFreq || frequency > maxFreq) {
      throw new Error(`Frequency out of range (${minFreq} - ${maxFreq})`);
    }

    this.currentDevice.config.frequency = frequency;
    this.logger.info(`📻 Frequency set to ${frequency} Hz (${(frequency / 1e6).toFixed(3)} MHz)`);

    // If streaming, restart with new frequency
    if (this.rtlProcess) {
      await this.stopSampling();
      await this.startSampling();
    }
  }

  /**
   * Set sample rate
   */
  async setSampleRate(sampleRate) {
    if (!this.currentDevice) {
      throw new Error('No device connected');
    }

    this.currentDevice.config.sampleRate = sampleRate;
    this.logger.info(`📊 Sample rate set to ${sampleRate} Hz`);

    // If streaming, restart with new sample rate
    if (this.rtlProcess) {
      await this.stopSampling();
      await this.startSampling();
    }
  }

  /**
   * Set gain
   */
  async setGain(gain, gainMode = 'manual') {
    if (!this.currentDevice) {
      throw new Error('No device connected');
    }

    this.currentDevice.config.gain = gain;
    this.currentDevice.config.gainMode = gainMode;
    this.logger.info(`🎚️  Gain set to ${gain} dB (mode: ${gainMode})`);
  }

  /**
   * Start sampling from device
   */
  async startSampling() {
    if (!this.currentDevice) {
      throw new Error('No device connected');
    }

    const { type, config } = this.currentDevice;

    if (type === 'rtl-sdr') {
      return this.startRTLSDRSampling(config);
    } else if (type === 'hackrf') {
      return this.startHackRFSampling(config);
    }

    throw new Error(`Unsupported device type: ${type}`);
  }

  startRTLSDRSampling(config) {
    const args = [
      '-f', config.frequency.toString(),
      '-s', config.sampleRate.toString(),
      '-'
    ];

    if (config.gainMode === 'manual') {
      args.push('-g', (config.gain * 10).toString());
    }

    this.logger.debug(`Starting rtl_sdr with args: ${args.join(' ')}`);
    this.rtlProcess = spawn('rtl_sdr', args);

    this.rtlProcess.stdout.on('data', (data) => {
      this.sampleBuffer.push(...data);
    });

    this.rtlProcess.stderr.on('data', (data) => {
      this.logger.debug(`rtl_sdr: ${data.toString().trim()}`);
    });

    this.rtlProcess.on('close', (code) => {
      this.logger.info(`rtl_sdr process exited with code ${code}`);
      this.rtlProcess = null;
    });

    this.rtlProcess.on('error', (error) => {
      this.logger.error(`rtl_sdr error: ${error.message}`);
    });
  }

  startHackRFSampling(config) {
    // HackRF sampling implementation
    this.logger.warn('HackRF sampling not yet implemented');
  }

  /**
   * Stop sampling
   */
  async stopSampling() {
    if (this.rtlProcess) {
      this.rtlProcess.kill();
      this.rtlProcess = null;
      this.sampleBuffer = [];
    }
  }

  /**
   * Read samples from buffer
   */
  async readSamples(count) {
    if (!this.rtlProcess) {
      await this.startSampling();
    }

    // Wait for enough samples (with timeout)
    const timeout = 5000;
    const startTime = Date.now();

    while (this.sampleBuffer.length < count * 2) {
      if (Date.now() - startTime > timeout) {
        // Generate simulated data if no real samples available
        return this.generateSimulatedSamples(count);
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Extract samples
    const samples = [];
    for (let i = 0; i < count * 2; i += 2) {
      const I = (this.sampleBuffer[i] - 127.5) / 127.5;
      const Q = (this.sampleBuffer[i + 1] - 127.5) / 127.5;
      samples.push({ re: I, im: Q });
    }

    // Remove processed samples
    this.sampleBuffer.splice(0, count * 2);

    return samples;
  }

  /**
   * Generate simulated samples for testing/demo
   */
  generateSimulatedSamples(count) {
    const samples = [];
    const signalFreq = 0.1; // Normalized frequency

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const signal = Math.sin(2 * Math.PI * signalFreq * t);
      const noise = (Math.random() - 0.5) * 0.1;

      samples.push({
        re: signal + noise,
        im: noise
      });
    }

    return samples;
  }

  getDeviceList() {
    return this.devices.map(device => ({
      id: device.id,
      name: device.name,
      type: device.type,
      description: device.description,
      connected: this.currentDevice?.id === device.id
    }));
  }
}

export default SDRDeviceManager;
