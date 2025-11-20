/**
 * Microphone Manager
 * Handles microphone audio capture and FFT processing using Web Audio API
 */

export class MicrophoneManager {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private isActive = false;
  private animationFrameId: number | null = null;

  async initialize(): Promise<void> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000
        }
      });

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: 48000 });

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.3;

      // Connect microphone to analyser
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);

      this.isActive = true;
      console.log('✅ Microphone initialized successfully');
    } catch (error) {
      console.error('Failed to initialize microphone:', error);
      throw error;
    }
  }

  setFFTSize(size: number): void {
    if (this.analyser) {
      this.analyser.fftSize = size;
    }
  }

  setSmoothingTimeConstant(value: number): void {
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = value;
    }
  }

  getFFTData(): { magnitude: number[]; frequencies: number[] } {
    if (!this.analyser || !this.audioContext) {
      return { magnitude: [], frequencies: [] };
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Convert to dB scale
    const magnitude = Array.from(dataArray).map((value) => {
      // Convert 0-255 range to dB (-100 to 0)
      const normalized = value / 255;
      return normalized > 0 ? 20 * Math.log10(normalized) : -100;
    });

    // Generate frequency bins
    const sampleRate = this.audioContext.sampleRate;
    const frequencies = [];
    for (let i = 0; i < bufferLength; i++) {
      frequencies.push((i * sampleRate) / (bufferLength * 2));
    }

    return { magnitude, frequencies };
  }

  getTimeDomainData(): Float32Array {
    if (!this.analyser) {
      return new Float32Array(0);
    }

    const bufferLength = this.analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    this.analyser.getFloatTimeDomainData(dataArray);

    return dataArray;
  }

  startStreaming(callback: (data: { magnitude: number[]; frequencies: number[] }) => void): void {
    if (!this.isActive || !this.analyser) {
      console.warn('Microphone not initialized');
      return;
    }

    const update = () => {
      if (!this.isActive) return;

      const data = this.getFFTData();
      callback(data);

      this.animationFrameId = requestAnimationFrame(update);
    };

    update();
  }

  stopStreaming(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  async stop(): Promise<void> {
    this.stopStreaming();
    this.isActive = false;

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    console.log('✅ Microphone stopped');
  }

  isInitialized(): boolean {
    return this.isActive;
  }

  getSampleRate(): number {
    return this.audioContext?.sampleRate || 48000;
  }

  getFFTSize(): number {
    return this.analyser?.fftSize || 2048;
  }
}

export default MicrophoneManager;
