/**
 * Recording Manager
 * Handles signal recording and playback
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export class RecordingManager {
  constructor(logger) {
    this.logger = logger;
    this.recordingsDir = path.join(process.cwd(), 'recordings');
    this.currentRecording = null;
    this.recordingBuffer = [];
  }

  async initialize() {
    // Create recordings directory if it doesn't exist
    try {
      await mkdir(this.recordingsDir, { recursive: true });
      this.logger.info(`📁 Recordings directory: ${this.recordingsDir}`);
    } catch (error) {
      this.logger.error(`Failed to create recordings directory: ${error.message}`);
    }
  }

  /**
   * Start recording
   */
  async startRecording(filename, device, duration = null) {
    if (this.currentRecording) {
      throw new Error('Recording already in progress');
    }

    await this.initialize();

    const recordingId = `rec_${Date.now()}`;
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filepath = path.join(this.recordingsDir, `${sanitizedFilename}.iq`);

    this.currentRecording = {
      id: recordingId,
      filename: sanitizedFilename,
      filepath: filepath,
      startTime: Date.now(),
      duration: duration,
      device: {
        type: device.type,
        frequency: device.config.frequency,
        sampleRate: device.config.sampleRate,
        gain: device.config.gain
      },
      sampleCount: 0
    };

    this.recordingBuffer = [];

    this.logger.info(`🔴 Started recording: ${sanitizedFilename}`);
    this.logger.info(`   Frequency: ${device.config.frequency} Hz`);
    this.logger.info(`   Sample Rate: ${device.config.sampleRate} Hz`);
    this.logger.info(`   Duration: ${duration ? duration + 's' : 'manual stop'}`);

    // Auto-stop after duration if specified
    if (duration) {
      setTimeout(() => {
        if (this.currentRecording?.id === recordingId) {
          this.stopRecording();
        }
      }, duration * 1000);
    }

    return recordingId;
  }

  /**
   * Add samples to current recording
   */
  addSamples(samples) {
    if (!this.currentRecording) {
      return;
    }

    this.recordingBuffer.push(...samples);
    this.currentRecording.sampleCount += samples.length;
  }

  /**
   * Stop recording
   */
  async stopRecording() {
    if (!this.currentRecording) {
      throw new Error('No recording in progress');
    }

    const recording = this.currentRecording;
    const duration = (Date.now() - recording.startTime) / 1000;

    this.logger.info(`⏹️  Stopping recording: ${recording.filename}`);
    this.logger.info(`   Duration: ${duration.toFixed(2)}s`);
    this.logger.info(`   Samples: ${recording.sampleCount}`);

    // Convert IQ samples to binary format
    const buffer = this.samplesToBuffer(this.recordingBuffer);

    // Write to file
    await this.saveRecording(recording, buffer);

    // Create metadata file
    const metadata = {
      id: recording.id,
      filename: recording.filename,
      startTime: recording.startTime,
      duration: duration,
      sampleCount: recording.sampleCount,
      device: recording.device,
      filesize: buffer.length
    };

    await writeFile(
      recording.filepath + '.json',
      JSON.stringify(metadata, null, 2)
    );

    this.currentRecording = null;
    this.recordingBuffer = [];

    this.logger.info(`💾 Recording saved: ${recording.filepath}`);

    return metadata;
  }

  /**
   * Convert IQ samples to binary buffer
   */
  samplesToBuffer(samples) {
    // Format: interleaved I/Q samples as 32-bit floats
    const buffer = Buffer.allocUnsafe(samples.length * 8); // 2 floats per sample

    for (let i = 0; i < samples.length; i++) {
      buffer.writeFloatLE(samples[i].re, i * 8);
      buffer.writeFloatLE(samples[i].im, i * 8 + 4);
    }

    return buffer;
  }

  /**
   * Convert binary buffer to IQ samples
   */
  bufferToSamples(buffer) {
    const samples = [];
    const sampleCount = buffer.length / 8;

    for (let i = 0; i < sampleCount; i++) {
      samples.push({
        re: buffer.readFloatLE(i * 8),
        im: buffer.readFloatLE(i * 8 + 4)
      });
    }

    return samples;
  }

  /**
   * Save recording to file
   */
  async saveRecording(recording, buffer) {
    await writeFile(recording.filepath, buffer);
  }

  /**
   * Get list of recordings
   */
  async getRecordingsList() {
    await this.initialize();

    try {
      const files = await readdir(this.recordingsDir);
      const recordings = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filepath = path.join(this.recordingsDir, file);
          const content = await readFile(filepath, 'utf8');
          const metadata = JSON.parse(content);
          recordings.push(metadata);
        }
      }

      // Sort by start time (newest first)
      recordings.sort((a, b) => b.startTime - a.startTime);

      return recordings;
    } catch (error) {
      this.logger.error(`Failed to list recordings: ${error.message}`);
      return [];
    }
  }

  /**
   * Load recording
   */
  async loadRecording(recordingId) {
    const recordings = await this.getRecordingsList();
    const recording = recordings.find(r => r.id === recordingId);

    if (!recording) {
      throw new Error(`Recording not found: ${recordingId}`);
    }

    const iqPath = path.join(this.recordingsDir, `${recording.filename}.iq`);
    const buffer = await readFile(iqPath);
    const samples = this.bufferToSamples(buffer);

    return {
      metadata: recording,
      samples: samples
    };
  }

  /**
   * Delete recording
   */
  async deleteRecording(recordingId) {
    const recordings = await this.getRecordingsList();
    const recording = recordings.find(r => r.id === recordingId);

    if (!recording) {
      throw new Error(`Recording not found: ${recordingId}`);
    }

    const iqPath = path.join(this.recordingsDir, `${recording.filename}.iq`);
    const jsonPath = iqPath + '.json';

    await promisify(fs.unlink)(iqPath);
    await promisify(fs.unlink)(jsonPath);

    this.logger.info(`🗑️  Deleted recording: ${recording.filename}`);
  }

  /**
   * Get current recording status
   */
  getRecordingStatus() {
    if (!this.currentRecording) {
      return {
        isRecording: false
      };
    }

    const elapsed = (Date.now() - this.currentRecording.startTime) / 1000;

    return {
      isRecording: true,
      id: this.currentRecording.id,
      filename: this.currentRecording.filename,
      elapsed: elapsed,
      sampleCount: this.currentRecording.sampleCount,
      duration: this.currentRecording.duration
    };
  }
}

export default RecordingManager;
