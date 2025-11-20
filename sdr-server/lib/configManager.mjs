/**
 * Configuration Manager
 * Manages application configuration
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export class ConfigManager {
  constructor() {
    this.configDir = path.join(process.cwd(), 'config');
    this.configPath = path.join(this.configDir, 'icenet-sdr.json');
    this.config = this.getDefaultConfig();
  }

  getDefaultConfig() {
    return {
      server: {
        port: 8080,
        host: '0.0.0.0',
        logLevel: 'info'
      },
      spectrum: {
        defaultFFTSize: 2048,
        defaultUpdateRate: 30,
        windowFunction: 'hamming'
      },
      recording: {
        recordingsDir: './recordings',
        maxRecordingDuration: 3600, // 1 hour
        defaultFormat: 'iq'
      },
      devices: {
        autoConnect: false,
        defaultDevice: null,
        rtlsdr: {
          defaultFrequency: 100e6,
          defaultSampleRate: 2048000,
          defaultGain: 20,
          defaultGainMode: 'auto'
        },
        hackrf: {
          defaultFrequency: 100e6,
          defaultSampleRate: 8e6,
          defaultLNAGain: 16,
          defaultVGAGain: 20
        }
      },
      ui: {
        theme: 'dark',
        defaultView: 'spectrum',
        showWaterfall: true,
        waterfallHeight: 200
      }
    };
  }

  async initialize() {
    try {
      await mkdir(this.configDir, { recursive: true });
      await this.load();
    } catch (error) {
      console.warn('Using default configuration');
    }
  }

  async load() {
    try {
      const content = await readFile(this.configPath, 'utf8');
      const loaded = JSON.parse(content);
      this.config = { ...this.config, ...loaded };
    } catch (error) {
      // Config file doesn't exist, use defaults
      await this.save();
    }
  }

  async save() {
    try {
      await mkdir(this.configDir, { recursive: true });
      await writeFile(
        this.configPath,
        JSON.stringify(this.config, null, 2)
      );
    } catch (error) {
      console.error('Failed to save configuration:', error.message);
    }
  }

  get(key) {
    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }

    return value;
  }

  set(key, value) {
    const keys = key.split('.');
    let obj = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in obj) || typeof obj[k] !== 'object') {
        obj[k] = {};
      }
      obj = obj[k];
    }

    obj[keys[keys.length - 1]] = value;
  }

  getAll() {
    return { ...this.config };
  }
}

export default ConfigManager;
