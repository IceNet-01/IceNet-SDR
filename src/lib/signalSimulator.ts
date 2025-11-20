/**
 * Signal Simulator
 * Generates simulated RF signals for testing without hardware
 */

export interface SimulatorConfig {
  centerFrequency: number;
  sampleRate: number;
  fftSize: number;
  signals: SimulatedSignal[];
}

export interface SimulatedSignal {
  frequency: number; // Hz relative to center
  amplitude: number; // 0-1
  type: 'carrier' | 'am' | 'fm' | 'noise' | 'sweep';
  modulation?: {
    frequency?: number;
    depth?: number;
  };
}

export class SignalSimulator {
  private config: SimulatorConfig;
  private isRunning = false;
  private intervalId: number | null = null;
  private time = 0;

  constructor(config: Partial<SimulatorConfig> = {}) {
    this.config = {
      centerFrequency: 100e6, // 100 MHz
      sampleRate: 2.048e6, // 2.048 MS/s
      fftSize: 2048,
      signals: [
        // Default: FM broadcast signal
        { frequency: 0, amplitude: 0.8, type: 'fm', modulation: { frequency: 1000, depth: 75000 } },
        // Two carriers
        { frequency: 200e3, amplitude: 0.5, type: 'carrier' },
        { frequency: -300e3, amplitude: 0.6, type: 'carrier' },
        // Background noise
        { frequency: 0, amplitude: 0.1, type: 'noise' }
      ],
      ...config
    };
  }

  setConfig(config: Partial<SimulatorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  addSignal(signal: SimulatedSignal): void {
    this.config.signals.push(signal);
  }

  clearSignals(): void {
    this.config.signals = [];
  }

  generateSpectrum(): { magnitude: number[]; frequencies: number[] } {
    const { fftSize, sampleRate, signals } = this.config;
    const spectrum = new Array(fftSize).fill(-100); // Start with -100 dB noise floor

    // Generate frequency bins
    const frequencies = [];
    for (let i = 0; i < fftSize; i++) {
      const normFreq = (i - fftSize / 2) / fftSize;
      frequencies.push(normFreq);
    }

    // Add each signal
    signals.forEach((signal) => {
      this.addSignalToSpectrum(spectrum, signal, frequencies);
    });

    return { magnitude: spectrum, frequencies };
  }

  private addSignalToSpectrum(
    spectrum: number[],
    signal: SimulatedSignal,
    frequencies: number[]
  ): void {
    const { sampleRate, fftSize } = this.config;
    const normalizedFreq = signal.frequency / sampleRate;

    switch (signal.type) {
      case 'carrier':
        this.addCarrier(spectrum, normalizedFreq, signal.amplitude, frequencies);
        break;

      case 'am':
        this.addAM(spectrum, normalizedFreq, signal.amplitude, signal.modulation, frequencies);
        break;

      case 'fm':
        this.addFM(spectrum, normalizedFreq, signal.amplitude, signal.modulation, frequencies);
        break;

      case 'noise':
        this.addNoise(spectrum, signal.amplitude);
        break;

      case 'sweep':
        this.addSweep(spectrum, signal.amplitude, frequencies);
        break;
    }
  }

  private addCarrier(
    spectrum: number[],
    normFreq: number,
    amplitude: number,
    frequencies: number[]
  ): void {
    // Find closest bin
    const binIndex = frequencies.findIndex((f) => Math.abs(f - normFreq) < 1 / spectrum.length);
    if (binIndex >= 0) {
      const powerDB = 20 * Math.log10(amplitude);
      spectrum[binIndex] = Math.max(spectrum[binIndex], powerDB);

      // Add some spectral spread
      for (let i = -2; i <= 2; i++) {
        const idx = binIndex + i;
        if (idx >= 0 && idx < spectrum.length) {
          const spread = powerDB - Math.abs(i) * 10;
          spectrum[idx] = Math.max(spectrum[idx], spread);
        }
      }
    }
  }

  private addAM(
    spectrum: number[],
    normFreq: number,
    amplitude: number,
    modulation: any,
    frequencies: number[]
  ): void {
    const modFreq = (modulation?.frequency || 1000) / this.config.sampleRate;
    const depth = modulation?.depth || 0.5;

    // Carrier
    this.addCarrier(spectrum, normFreq, amplitude, frequencies);

    // Sidebands
    this.addCarrier(spectrum, normFreq + modFreq, amplitude * depth * 0.5, frequencies);
    this.addCarrier(spectrum, normFreq - modFreq, amplitude * depth * 0.5, frequencies);
  }

  private addFM(
    spectrum: number[],
    normFreq: number,
    amplitude: number,
    modulation: any,
    frequencies: number[]
  ): void {
    const modFreq = (modulation?.frequency || 1000) / this.config.sampleRate;
    const deviation = (modulation?.depth || 75000) / this.config.sampleRate;
    const beta = deviation / modFreq; // Modulation index

    // Carrier
    this.addCarrier(spectrum, normFreq, amplitude, frequencies);

    // Sidebands (first few orders)
    const numSidebands = Math.min(Math.ceil(beta + 2), 10);
    for (let n = 1; n <= numSidebands; n++) {
      const sidebandAmp = amplitude * this.besselJ(n, beta);
      this.addCarrier(spectrum, normFreq + n * modFreq, Math.abs(sidebandAmp), frequencies);
      this.addCarrier(spectrum, normFreq - n * modFreq, Math.abs(sidebandAmp), frequencies);
    }
  }

  private addNoise(spectrum: number[], amplitude: number): void {
    for (let i = 0; i < spectrum.length; i++) {
      const noise = (Math.random() - 0.5) * amplitude * 40 - 80; // -80 to -40 dB
      spectrum[i] = Math.max(spectrum[i], noise);
    }
  }

  private addSweep(spectrum: number[], amplitude: number, frequencies: number[]): void {
    // Sweeping signal that moves across spectrum
    const sweepPos = (Math.sin(this.time * 0.001) + 1) / 2; // 0 to 1
    const sweepFreq = (sweepPos - 0.5) * 0.8; // -0.4 to 0.4 normalized

    this.addCarrier(spectrum, sweepFreq, amplitude, frequencies);
  }

  // Bessel function approximation for FM sidebands
  private besselJ(n: number, x: number): number {
    if (n === 0) {
      return Math.abs(x) < 8 ? 1 - x * x / 4 + x * x * x * x / 64 : Math.sqrt(2 / (Math.PI * x)) * Math.cos(x - Math.PI / 4);
    }

    let sum = 0;
    const terms = 20;
    for (let k = 0; k < terms; k++) {
      const term = Math.pow(-1, k) * Math.pow(x / 2, n + 2 * k) / (this.factorial(k) * this.factorial(n + k));
      sum += term;
      if (Math.abs(term) < 1e-10) break;
    }
    return sum;
  }

  private factorial(n: number): number {
    if (n <= 1) return 1;
    return n * this.factorial(n - 1);
  }

  startStreaming(callback: (data: { magnitude: number[]; frequencies: number[] }) => void, updateRate = 30): void {
    if (this.isRunning) return;

    this.isRunning = true;
    const intervalMs = 1000 / updateRate;

    this.intervalId = window.setInterval(() => {
      if (!this.isRunning) return;

      const data = this.generateSpectrum();
      callback(data);
      this.time++;
    }, intervalMs);

    console.log('✅ Signal simulator started');
  }

  stopStreaming(): void {
    this.isRunning = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('⏸️ Signal simulator stopped');
  }

  isActive(): boolean {
    return this.isRunning;
  }

  getSampleRate(): number {
    return this.config.sampleRate;
  }

  getCenterFrequency(): number {
    return this.config.centerFrequency;
  }

  setFFTSize(size: number): void {
    this.config.fftSize = size;
  }
}

export default SignalSimulator;
