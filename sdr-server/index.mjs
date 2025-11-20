#!/usr/bin/env node

/**
 * IceNet SDR Server
 * Main server file handling SDR devices, spectrum analysis, and WebSocket communication
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './lib/logger.mjs';
import { SDRDeviceManager } from './lib/sdrDeviceManager.mjs';
import { SpectrumAnalyzer } from './lib/spectrumAnalyzer.mjs';
import { RecordingManager } from './lib/recordingManager.mjs';
import { ConfigManager } from './lib/configManager.mjs';
import { networkInterfaces } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SDRServer {
  constructor() {
    this.port = process.env.PORT || 8080;
    this.logger = new Logger('SDRServer');
    this.config = new ConfigManager();
    this.deviceManager = new SDRDeviceManager(this.logger);
    this.spectrumAnalyzer = new SpectrumAnalyzer(this.logger);
    this.recordingManager = new RecordingManager(this.logger);
    this.clients = new Set();
    this.isProduction = process.env.NODE_ENV === 'production';

    // Server state
    this.currentDevice = null;
    this.isStreaming = false;
    this.streamInterval = null;
  }

  async initialize() {
    this.logger.info('🚀 Initializing IceNet SDR Server...');

    // Initialize Express app
    this.app = express();
    this.app.use(express.json());

    // Serve static files in production
    if (this.isProduction) {
      const distPath = path.join(__dirname, '..', 'dist');
      this.app.use(express.static(distPath));
      this.logger.info(`📁 Serving static files from: ${distPath}`);
    }

    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        version: '1.0.0',
        uptime: process.uptime(),
        devices: this.deviceManager.getDeviceList()
      });
    });

    // Create HTTP server
    this.httpServer = createServer(this.app);

    // Create WebSocket server
    this.wss = new WebSocketServer({ server: this.httpServer });
    this.setupWebSocket();

    // Initialize device manager
    await this.deviceManager.initialize();

    this.logger.info('✅ Server initialization complete');
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const clientId = `client_${Date.now()}`;
      this.logger.info(`🔌 New WebSocket connection: ${clientId} from ${req.socket.remoteAddress}`);

      this.clients.add(ws);
      ws.clientId = clientId;

      // Send welcome message with current state
      ws.send(JSON.stringify({
        type: 'welcome',
        data: {
          version: '1.0.0',
          devices: this.deviceManager.getDeviceList(),
          currentDevice: this.currentDevice,
          isStreaming: this.isStreaming
        }
      }));

      // Handle incoming messages
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleClientMessage(ws, data);
        } catch (error) {
          this.logger.error(`Error handling client message: ${error.message}`);
          ws.send(JSON.stringify({
            type: 'error',
            message: error.message
          }));
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.logger.info(`🔌 Client disconnected: ${clientId}`);
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        this.logger.error(`WebSocket error for ${clientId}: ${error.message}`);
      });
    });
  }

  async handleClientMessage(ws, data) {
    const { type, payload } = data;

    switch (type) {
      case 'scan_devices':
        await this.handleScanDevices(ws);
        break;

      case 'connect_device':
        await this.handleConnectDevice(ws, payload);
        break;

      case 'disconnect_device':
        await this.handleDisconnectDevice(ws);
        break;

      case 'start_streaming':
        await this.handleStartStreaming(ws, payload);
        break;

      case 'stop_streaming':
        await this.handleStopStreaming(ws);
        break;

      case 'set_frequency':
        await this.handleSetFrequency(ws, payload);
        break;

      case 'set_sample_rate':
        await this.handleSetSampleRate(ws, payload);
        break;

      case 'set_gain':
        await this.handleSetGain(ws, payload);
        break;

      case 'start_recording':
        await this.handleStartRecording(ws, payload);
        break;

      case 'stop_recording':
        await this.handleStopRecording(ws);
        break;

      case 'get_recordings':
        await this.handleGetRecordings(ws);
        break;

      case 'playback_recording':
        await this.handlePlaybackRecording(ws, payload);
        break;

      default:
        this.logger.warn(`Unknown message type: ${type}`);
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${type}`
        }));
    }
  }

  async handleScanDevices(ws) {
    this.logger.info('🔍 Scanning for SDR devices...');
    const devices = await this.deviceManager.scanDevices();

    ws.send(JSON.stringify({
      type: 'devices_list',
      data: devices
    }));

    this.broadcast({
      type: 'devices_list',
      data: devices
    });
  }

  async handleConnectDevice(ws, payload) {
    const { deviceId, deviceType } = payload;
    this.logger.info(`🔌 Connecting to device: ${deviceId} (${deviceType})`);

    try {
      const device = await this.deviceManager.connectDevice(deviceId, deviceType);
      this.currentDevice = device;

      this.broadcast({
        type: 'device_connected',
        data: device
      });

      this.logger.info(`✅ Connected to ${device.name}`);
    } catch (error) {
      this.logger.error(`Failed to connect to device: ${error.message}`);
      ws.send(JSON.stringify({
        type: 'error',
        message: `Failed to connect: ${error.message}`
      }));
    }
  }

  async handleDisconnectDevice(ws) {
    if (!this.currentDevice) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'No device connected'
      }));
      return;
    }

    this.logger.info('🔌 Disconnecting device...');
    await this.handleStopStreaming(ws);
    await this.deviceManager.disconnectDevice();
    this.currentDevice = null;

    this.broadcast({
      type: 'device_disconnected'
    });
  }

  async handleStartStreaming(ws, payload) {
    if (!this.currentDevice) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'No device connected'
      }));
      return;
    }

    if (this.isStreaming) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Already streaming'
      }));
      return;
    }

    const { fftSize = 2048, updateRate = 30 } = payload || {};

    this.logger.info(`📡 Starting spectrum streaming (FFT: ${fftSize}, Rate: ${updateRate}Hz)`);
    this.isStreaming = true;

    // Start streaming spectrum data
    const intervalMs = 1000 / updateRate;
    this.streamInterval = setInterval(async () => {
      try {
        const samples = await this.deviceManager.readSamples(fftSize);
        const spectrumData = this.spectrumAnalyzer.processFFT(samples, fftSize);

        this.broadcast({
          type: 'spectrum_data',
          data: {
            spectrum: spectrumData.magnitude,
            frequencies: spectrumData.frequencies,
            centerFrequency: this.currentDevice.config.frequency,
            sampleRate: this.currentDevice.config.sampleRate,
            timestamp: Date.now()
          }
        });
      } catch (error) {
        this.logger.error(`Streaming error: ${error.message}`);
      }
    }, intervalMs);

    this.broadcast({
      type: 'streaming_started',
      data: { fftSize, updateRate }
    });
  }

  async handleStopStreaming(ws) {
    if (!this.isStreaming) {
      return;
    }

    this.logger.info('⏸️  Stopping spectrum streaming');
    this.isStreaming = false;

    if (this.streamInterval) {
      clearInterval(this.streamInterval);
      this.streamInterval = null;
    }

    this.broadcast({
      type: 'streaming_stopped'
    });
  }

  async handleSetFrequency(ws, payload) {
    if (!this.currentDevice) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'No device connected'
      }));
      return;
    }

    const { frequency } = payload;
    this.logger.info(`📻 Setting frequency to ${frequency} Hz`);

    await this.deviceManager.setFrequency(frequency);
    this.currentDevice.config.frequency = frequency;

    this.broadcast({
      type: 'frequency_changed',
      data: { frequency }
    });
  }

  async handleSetSampleRate(ws, payload) {
    if (!this.currentDevice) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'No device connected'
      }));
      return;
    }

    const { sampleRate } = payload;
    this.logger.info(`📊 Setting sample rate to ${sampleRate} Hz`);

    await this.deviceManager.setSampleRate(sampleRate);
    this.currentDevice.config.sampleRate = sampleRate;

    this.broadcast({
      type: 'sample_rate_changed',
      data: { sampleRate }
    });
  }

  async handleSetGain(ws, payload) {
    if (!this.currentDevice) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'No device connected'
      }));
      return;
    }

    const { gain, gainMode } = payload;
    this.logger.info(`🎚️  Setting gain to ${gain} (mode: ${gainMode})`);

    await this.deviceManager.setGain(gain, gainMode);
    this.currentDevice.config.gain = gain;
    this.currentDevice.config.gainMode = gainMode;

    this.broadcast({
      type: 'gain_changed',
      data: { gain, gainMode }
    });
  }

  async handleStartRecording(ws, payload) {
    if (!this.currentDevice) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'No device connected'
      }));
      return;
    }

    const { filename, duration } = payload;
    this.logger.info(`🔴 Starting recording: ${filename}`);

    const recordingId = await this.recordingManager.startRecording(
      filename,
      this.currentDevice,
      duration
    );

    this.broadcast({
      type: 'recording_started',
      data: { recordingId, filename }
    });
  }

  async handleStopRecording(ws) {
    this.logger.info('⏹️  Stopping recording');

    const recordingInfo = await this.recordingManager.stopRecording();

    this.broadcast({
      type: 'recording_stopped',
      data: recordingInfo
    });
  }

  async handleGetRecordings(ws) {
    const recordings = await this.recordingManager.getRecordingsList();

    ws.send(JSON.stringify({
      type: 'recordings_list',
      data: recordings
    }));
  }

  async handlePlaybackRecording(ws, payload) {
    const { recordingId } = payload;
    this.logger.info(`▶️  Playing back recording: ${recordingId}`);

    // Implement playback logic
    // This would stream the recorded samples back through the spectrum analyzer

    ws.send(JSON.stringify({
      type: 'playback_started',
      data: { recordingId }
    });
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    this.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(messageStr);
        sentCount++;
      }
    });

    if (sentCount > 0) {
      this.logger.debug(`📢 Broadcast to ${sentCount} clients: ${message.type}`);
    }
  }

  getLocalIPAddresses() {
    const interfaces = networkInterfaces();
    const addresses = [];

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push({
            interface: name,
            address: iface.address
          });
        }
      }
    }

    return addresses;
  }

  async start() {
    await this.initialize();

    return new Promise((resolve) => {
      this.httpServer.listen(this.port, '0.0.0.0', () => {
        const addresses = this.getLocalIPAddresses();

        console.log('\n' + '='.repeat(70));
        console.log('🎉 IceNet SDR Server is running!');
        console.log('='.repeat(70));
        console.log(`\n📡 Version: 1.0.0`);
        console.log(`🔧 Mode: ${this.isProduction ? 'Production' : 'Development'}`);
        console.log(`\n🌐 Access URLs:`);
        console.log(`   Local:      http://localhost:${this.port}`);
        console.log(`   Local IP:   http://127.0.0.1:${this.port}`);

        if (addresses.length > 0) {
          console.log(`\n📱 LAN Access (from other devices):`);
          addresses.forEach(({ interface: iface, address }) => {
            console.log(`   ${iface}:  http://${address}:${this.port}`);
          });
        }

        console.log(`\n📊 WebSocket: ws://localhost:${this.port}`);
        console.log(`\n${this.isProduction ? '📦 Serving built frontend from /dist' : '⚡ Development mode - use Vite dev server on port 5173'}`);
        console.log('\n' + '='.repeat(70));
        console.log('💡 Tip: Use Ctrl+C to stop the server');
        console.log('='.repeat(70) + '\n');

        this.logger.info(`Server listening on port ${this.port}`);
        resolve();
      });
    });
  }

  async stop() {
    this.logger.info('🛑 Shutting down server...');

    // Stop streaming
    if (this.isStreaming) {
      await this.handleStopStreaming();
    }

    // Disconnect device
    if (this.currentDevice) {
      await this.deviceManager.disconnectDevice();
    }

    // Close all WebSocket connections
    this.clients.forEach((client) => {
      client.close();
    });

    // Close servers
    this.wss.close();
    this.httpServer.close();

    this.logger.info('👋 Server stopped');
  }
}

// Start the server
const server = new SDRServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Received SIGINT, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Received SIGTERM, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

// Start server
server.start().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export default SDRServer;
