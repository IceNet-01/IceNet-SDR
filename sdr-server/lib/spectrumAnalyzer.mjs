/**
 * Spectrum Analyzer
 * FFT processing and signal analysis
 */

export class SpectrumAnalyzer {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Process FFT on IQ samples
   */
  processFFT(samples, fftSize = 2048) {
    if (!samples || samples.length < fftSize) {
      this.logger.warn(`Not enough samples for FFT: ${samples?.length} < ${fftSize}`);
      return this.generateEmptySpectrum(fftSize);
    }

    // Apply window function (Hamming)
    const windowed = this.applyWindow(samples.slice(0, fftSize), 'hamming');

    // Compute FFT
    const fftResult = this.fft(windowed);

    // Compute magnitude spectrum
    const magnitude = this.computeMagnitude(fftResult);

    // FFT shift (move DC to center)
    const shifted = this.fftShift(magnitude);

    // Convert to dB
    const magnitudeDB = shifted.map(val => 10 * Math.log10(val + 1e-10));

    // Generate frequency bins
    const frequencies = this.generateFrequencyBins(fftSize);

    return {
      magnitude: magnitudeDB,
      frequencies: frequencies,
      fftSize: fftSize
    };
  }

  /**
   * Apply window function to reduce spectral leakage
   */
  applyWindow(samples, windowType = 'hamming') {
    const N = samples.length;
    const windowed = [];

    for (let i = 0; i < N; i++) {
      let w = 1.0;

      switch (windowType) {
        case 'hamming':
          w = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1));
          break;
        case 'hanning':
          w = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
          break;
        case 'blackman':
          w = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)) + 0.08 * Math.cos(4 * Math.PI * i / (N - 1));
          break;
        case 'rectangular':
        default:
          w = 1.0;
      }

      windowed.push({
        re: samples[i].re * w,
        im: samples[i].im * w
      });
    }

    return windowed;
  }

  /**
   * Cooley-Tukey FFT algorithm
   */
  fft(x) {
    const N = x.length;

    // Base case
    if (N <= 1) return x;

    // Ensure power of 2
    if (N & (N - 1)) {
      this.logger.warn(`FFT size ${N} is not a power of 2, padding...`);
      const nextPow2 = Math.pow(2, Math.ceil(Math.log2(N)));
      while (x.length < nextPow2) {
        x.push({ re: 0, im: 0 });
      }
      return this.fft(x);
    }

    // Divide
    const even = [];
    const odd = [];
    for (let i = 0; i < N; i += 2) {
      even.push(x[i]);
      odd.push(x[i + 1]);
    }

    // Conquer
    const fftEven = this.fft(even);
    const fftOdd = this.fft(odd);

    // Combine
    const result = new Array(N);
    for (let k = 0; k < N / 2; k++) {
      const angle = -2 * Math.PI * k / N;
      const twiddle = {
        re: Math.cos(angle),
        im: Math.sin(angle)
      };

      const t = this.complexMultiply(twiddle, fftOdd[k]);

      result[k] = this.complexAdd(fftEven[k], t);
      result[k + N / 2] = this.complexSubtract(fftEven[k], t);
    }

    return result;
  }

  /**
   * Complex number multiplication
   */
  complexMultiply(a, b) {
    return {
      re: a.re * b.re - a.im * b.im,
      im: a.re * b.im + a.im * b.re
    };
  }

  /**
   * Complex number addition
   */
  complexAdd(a, b) {
    return {
      re: a.re + b.re,
      im: a.im + b.im
    };
  }

  /**
   * Complex number subtraction
   */
  complexSubtract(a, b) {
    return {
      re: a.re - b.re,
      im: a.im - b.im
    };
  }

  /**
   * Compute magnitude from complex FFT result
   */
  computeMagnitude(fftResult) {
    return fftResult.map(c => Math.sqrt(c.re * c.re + c.im * c.im));
  }

  /**
   * FFT shift - move zero frequency to center
   */
  fftShift(array) {
    const N = array.length;
    const half = Math.floor(N / 2);
    return [...array.slice(half), ...array.slice(0, half)];
  }

  /**
   * Generate frequency bins
   */
  generateFrequencyBins(fftSize) {
    const bins = [];
    for (let i = 0; i < fftSize; i++) {
      bins.push((i - fftSize / 2) / fftSize);
    }
    return bins;
  }

  /**
   * Generate empty spectrum (for when no samples available)
   */
  generateEmptySpectrum(fftSize) {
    return {
      magnitude: new Array(fftSize).fill(-100),
      frequencies: this.generateFrequencyBins(fftSize),
      fftSize: fftSize
    };
  }

  /**
   * Compute average noise floor
   */
  computeNoiseFloor(magnitude) {
    const sorted = [...magnitude].sort((a, b) => a - b);
    const percentile25 = sorted[Math.floor(sorted.length * 0.25)];
    return percentile25;
  }

  /**
   * Detect peaks in spectrum
   */
  detectPeaks(magnitude, threshold = 10) {
    const peaks = [];
    const noiseFloor = this.computeNoiseFloor(magnitude);

    for (let i = 1; i < magnitude.length - 1; i++) {
      const isPeak = magnitude[i] > magnitude[i - 1] &&
                     magnitude[i] > magnitude[i + 1] &&
                     magnitude[i] > noiseFloor + threshold;

      if (isPeak) {
        peaks.push({
          bin: i,
          magnitude: magnitude[i]
        });
      }
    }

    return peaks;
  }
}

export default SpectrumAnalyzer;
