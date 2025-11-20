# IceNet SDR - Software Defined Radio Platform

A **comprehensive web-based Software Defined Radio (SDR) platform** with real-time spectrum analysis, signal recording, waterfall display, and advanced demodulation. Built with React, TypeScript, and Node.js for seamless cross-platform operation.

**Professional-grade SDR software** - Designed for radio enthusiasts, researchers, and professionals who need powerful spectrum analysis and signal processing capabilities.

![License](https://img.shields.io/badge/license-Dual%20(Non--Commercial%2FCommercial)-blue.svg)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-lightgrey.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Type](https://img.shields.io/badge/type-Web%20App-blue.svg)

## Version 1.0.0 🚀

**Modern Architecture:**
- 🌐 **Web-Based Interface** - accessible from any modern browser
- ⚡ **Node.js Backend** - high-performance SDR device control
- 🔌 **WebSocket Communication** - real-time spectrum updates
- 📱 **Responsive Design** - works on desktop, tablet, and mobile
- 🛠️ **System Service Support** - runs as permanent service with auto-start
- 🎨 **Dark Theme** - easy on the eyes for long monitoring sessions

## Features

🎯 **Core SDR Functionality**
- 📡 Support for **multiple SDR devices** (RTL-SDR, HackRF, PlutoSDR, LimeSDR)
- 🔄 **Real-time spectrum analysis** with FFT processing
- 📊 **High-resolution FFT** - configurable from 512 to 8192 bins
- ⚡ **Fast update rates** - up to 60 FPS for smooth visualization
- 🎚️ **Flexible gain control** - manual and automatic modes
- 📻 **Wide frequency coverage** - 24 MHz to 6 GHz (device dependent)

📊 **Spectrum Analysis**
- Real-time power spectrum display
- Configurable FFT size (512, 1024, 2048, 4096, 8192)
- Multiple window functions (Hamming, Hanning, Blackman)
- Peak detection and analysis
- Noise floor calculation
- dB scale with adjustable range

🌊 **Waterfall Display**
- Real-time waterfall visualization
- Color-coded signal strength
- Adjustable height and update rate
- Time-history view
- Signal persistence tracking

💾 **Recording & Playback**
- **IQ sample recording** - capture raw baseband data
- **Metadata tracking** - frequency, sample rate, gain settings
- **Duration control** - manual or auto-stop recording
- **File management** - browse and manage recordings
- **Playback support** - replay recorded signals
- **Export capabilities** - save in multiple formats

🎛️ **Device Control**
- Auto-detection of connected SDR hardware
- Multiple device support
- Frequency tuning with high precision
- Sample rate selection
- Gain control (manual/auto)
- Device-specific settings
- Connection status monitoring

🖥️ **Modern Web Interface**
- Clean, intuitive dark-themed UI
- Responsive design with Tailwind CSS
- Real-time updates via WebSocket
- Multi-view layout (Spectrum, Waterfall, Recordings, Settings)
- Device status sidebar
- Connection health monitoring

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (required for backend server)
- **Modern Browser**: Chrome, Firefox, Edge, Safari
- **SDR Device**: RTL-SDR, HackRF, or compatible hardware
- **SDR Tools**: Device-specific command-line tools
  - RTL-SDR: `rtl-sdr` package (`rtl_test`, `rtl_sdr`)
  - HackRF: `hackrf` tools (`hackrf_info`)

### Installation

#### Linux / macOS

```bash
# Clone the repository
git clone https://github.com/IceNet-01/IceNet-SDR.git
cd IceNet-SDR

# Run installation script
chmod +x install.sh
./install.sh

# Install SDR tools (Ubuntu/Debian)
sudo apt-get install rtl-sdr hackrf

# Install SDR tools (macOS with Homebrew)
brew install librtlsdr hackrf
```

#### Windows

```powershell
# Clone the repository
git clone https://github.com/IceNet-01/IceNet-SDR.git
cd IceNet-SDR

# Install dependencies
npm install

# Install RTL-SDR drivers from:
# https://www.rtl-sdr.com/rtl-sdr-quick-start-guide/

# Install HackRF tools from:
# https://github.com/greatscottgadgets/hackrf/releases
```

### Running the Application

#### Development Mode

Perfect for testing and development with hot-reload:

```bash
npm run start
```

This starts:
- **Backend Server**: http://localhost:8080 (WebSocket + API)
- **Frontend Dev Server**: http://localhost:5173 (Vite with hot-reload)

Open your browser to **http://localhost:5173**

#### Production Mode

Optimized build for deployment:

```bash
# Build the frontend
npm run build

# Run in production mode
npm run production
```

Access at **http://localhost:8080**

### Install as System Service (Linux)

For 24/7 operation and auto-start on boot:

```bash
# Build and install service
sudo ./install-service.sh
```

The service will:
- ✅ Start automatically on system boot
- ✅ Restart automatically if it crashes
- ✅ Run in the background
- ✅ Be accessible on your local network

**Service Management:**
```bash
sudo systemctl start icenet-sdr      # Start
sudo systemctl stop icenet-sdr       # Stop
sudo systemctl restart icenet-sdr    # Restart
sudo systemctl status icenet-sdr     # Status
sudo journalctl -u icenet-sdr -f     # View logs
```

**Uninstall Service:**
```bash
sudo ./uninstall-service.sh
```

## Network Access

### LAN/Remote Access

The server **automatically binds to all network interfaces** (`0.0.0.0`), making it accessible from any device on your network.

**Access from other devices:**
1. Find your server's IP address (shown at startup)
2. Open browser on any device on the same network
3. Navigate to `http://YOUR_SERVER_IP:8080`

**Example:**
```
Server running on:     192.168.1.100
Access from phone:     http://192.168.1.100:8080
Access from tablet:    http://192.168.1.100:8080
Access from laptop:    http://192.168.1.100:8080
Access locally:        http://localhost:8080
```

**Finding Your IP:**
```bash
# Linux
hostname -I | awk '{print $1}'

# macOS
ipconfig getifaddr en0

# Or check the server startup logs
npm run server
# Shows: Access on LAN: http://192.168.1.100:8080
```

## How It Works

### Architecture

**Production Mode** (single server):
```
┌─────────────────┐
│   Web Browser   │ ← You interact here
│  (localhost:8080)│
└────────┬────────┘
         │ HTTP + WebSocket
┌────────▼────────┐
│  SDR Server     │ ← Node.js server
│  (port 8080)    │   - Serves web UI
└────────┬────────┘   - WebSocket API
         │            - SDR control
         │ USB/Serial
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│RTL-SDR│  │HackRF│ ← SDR devices
└──────┘  └──────┘
```

### Signal Processing Pipeline

```
SDR Device → IQ Samples → Window Function → FFT → Magnitude → dB Scale → Display
                                                      │
                                                      ├→ Waterfall
                                                      └→ Recording
```

## Usage

### 1. Connect Your SDR Device

1. Plug in your SDR device via USB
2. Open IceNet SDR in your browser
3. Click **"Scan for SDR Devices"**
4. Select your device from the list
5. Click **"Connect"**

The device will appear in the sidebar with current settings.

### 2. Start Spectrum Analysis

1. Click **"Start Streaming"** to begin real-time analysis
2. Adjust frequency using the frequency control
3. Change sample rate for different bandwidth views
4. Adjust gain for optimal signal level

**Tips:**
- Use auto gain for quick setup
- Use manual gain for precise control
- Higher FFT sizes = better frequency resolution
- Lower FFT sizes = faster update rate

### 3. Recording Signals

1. Navigate to **"Recordings"** view
2. Enter a filename for your recording
3. Optionally set auto-stop duration
4. Click **"Start Recording"**
5. Click **"Stop Recording"** when finished

Recordings are saved as `.iq` files with metadata in `.json` format.

**Recording Format:**
- IQ samples stored as 32-bit float pairs
- Metadata includes frequency, sample rate, gain
- Compatible with GNU Radio and other SDR tools

### 4. Viewing the Waterfall

The waterfall display shows signal history over time:
- **Blue**: Weak signals / noise floor
- **Green**: Moderate signals
- **Yellow**: Strong signals
- **Red**: Very strong signals

Time flows from top to bottom.

### 5. Settings

Adjust application settings in the **Settings** view:
- FFT Size: Resolution vs. speed trade-off
- Update Rate: Display refresh rate (10-60 FPS)
- Waterfall Display: Show/hide waterfall
- Theme: Dark mode (future: light mode)

## Supported SDR Devices

### RTL-SDR (RTL2832U)

**Frequency Range:** 24 MHz - 1766 MHz
**Sample Rates:** 250 kHz - 3.2 MHz
**Typical Use:** General purpose receiving, ADS-B, FM radio, etc.

**Setup:**
```bash
# Linux
sudo apt-get install rtl-sdr
sudo usermod -a -G plugdev $USER  # Allow non-root access

# Test device
rtl_test
```

### HackRF One

**Frequency Range:** 1 MHz - 6 GHz
**Sample Rates:** 2 MHz - 20 MHz
**Typical Use:** Wideband analysis, satellite reception, research

**Setup:**
```bash
# Linux
sudo apt-get install hackrf

# Test device
hackrf_info
```

### PlutoSDR (Coming Soon)

**Frequency Range:** 325 MHz - 3.8 GHz
**Sample Rates:** Up to 61.44 MHz
**Features:** TX/RX capable, portable

### LimeSDR (Coming Soon)

**Frequency Range:** 100 kHz - 3.8 GHz
**Sample Rates:** Up to 61.44 MHz
**Features:** Full duplex, MIMO

## Configuration

### Server Configuration

Edit `config/icenet-sdr.json` (auto-generated):

```json
{
  "server": {
    "port": 8080,
    "host": "0.0.0.0",
    "logLevel": "info"
  },
  "spectrum": {
    "defaultFFTSize": 2048,
    "defaultUpdateRate": 30,
    "windowFunction": "hamming"
  },
  "recording": {
    "recordingsDir": "./recordings",
    "maxRecordingDuration": 3600
  }
}
```

### Logging

Log levels (from most to least verbose):
- `silly`: Everything including debug info
- `debug`: Detailed debugging information
- `verbose`: Verbose operational info
- `info`: Normal operational messages (default)
- `warn`: Warning messages only
- `error`: Error messages only

Set log level:
```bash
export LOG_LEVEL=debug
npm run server
```

Logs are stored in:
- `logs/icenet-sdr.log` - All logs
- `logs/error.log` - Errors only

## Troubleshooting

### Device Not Detected

**Problem:** SDR device not appearing in scan results

**Solutions:**
1. Check USB connection
2. Install device drivers/tools
3. Check permissions (Linux):
   ```bash
   sudo usermod -a -G plugdev $USER
   # Log out and back in
   ```
4. Test device manually:
   ```bash
   rtl_test      # For RTL-SDR
   hackrf_info   # For HackRF
   ```

### Permission Denied Errors (Linux)

**Problem:** Cannot access SDR device

**Solution:**
```bash
# Add udev rules for RTL-SDR
sudo cp /usr/share/doc/rtl-sdr/rtl-sdr.rules /etc/udev/rules.d/
sudo udevadm control --reload-rules

# Add user to plugdev group
sudo usermod -a -G plugdev $USER

# Log out and back in for changes to take effect
```

### Port 8080 Already in Use

**Problem:** Cannot start server, port occupied

**Solution:**
```bash
# Find and kill process using port 8080
lsof -ti:8080 | xargs kill -9

# Or use cleanup script
npm run cleanup-ports
```

### No Spectrum Display

**Problem:** Connected but no spectrum showing

**Solutions:**
1. Click **"Start Streaming"**
2. Check browser console for errors
3. Verify device is actually receiving (check gain settings)
4. Try restarting the stream
5. Check WebSocket connection status

### Slow Performance

**Problem:** Low frame rate or lag

**Solutions:**
1. Reduce FFT size (2048 → 1024)
2. Lower update rate (30 → 20 FPS)
3. Disable waterfall if not needed
4. Close other browser tabs
5. Check CPU usage on server

### Recording Failures

**Problem:** Cannot save recordings

**Solutions:**
1. Check disk space
2. Verify `recordings/` directory exists and is writable
3. Check file permissions
4. Review logs for errors: `tail -f logs/icenet-sdr.log`

## Development

### Project Structure

```
IceNet-SDR/
├── sdr-server/                 # Backend Node.js server
│   ├── index.mjs              # Main server file
│   └── lib/                   # Server libraries
│       ├── logger.mjs         # Winston logging
│       ├── sdrDeviceManager.mjs    # SDR device control
│       ├── spectrumAnalyzer.mjs    # FFT processing
│       ├── recordingManager.mjs    # Recording management
│       └── configManager.mjs       # Configuration
├── src/                       # Frontend React application
│   ├── components/            # React components
│   │   ├── Dashboard.tsx
│   │   ├── Sidebar.tsx
│   │   ├── DeviceControl.tsx
│   │   ├── SpectrumView.tsx
│   │   ├── RecordingManager.tsx
│   │   └── Settings.tsx
│   ├── store/                 # Zustand state management
│   │   └── appStore.ts
│   ├── lib/                   # Frontend utilities
│   │   └── webSocketManager.ts
│   ├── types.ts               # TypeScript types
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── dist/                      # Built frontend (after build)
├── recordings/                # Recorded signals
├── logs/                      # Application logs
├── config/                    # Configuration files
├── install.sh                 # Installation script
├── install-service.sh         # Service installation
├── uninstall-service.sh       # Service removal
├── package.json               # Dependencies
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript config
└── README.md                  # This file
```

### Available Scripts

```bash
# Development
npm run start           # Start backend + frontend dev servers
npm run dev             # Start frontend dev server only
npm run server          # Start backend server only

# Building & Production
npm run build           # Build production frontend
npm run production      # Build + run in production mode
npm run preview         # Preview production build

# Service Management (Linux)
sudo ./install-service.sh       # Install systemd service
sudo ./uninstall-service.sh     # Uninstall systemd service
sudo systemctl start icenet-sdr     # Start service
sudo systemctl stop icenet-sdr      # Stop service
sudo systemctl restart icenet-sdr   # Restart service
sudo systemctl status icenet-sdr    # Check status
sudo journalctl -u icenet-sdr -f    # View live logs

# Utilities
npm run cleanup-ports   # Kill processes on port 8080
```

### Tech Stack

**Backend:**
- Node.js 18+
- Express - HTTP server
- WebSocket (ws) - Real-time communication
- Winston - Logging
- Child processes - SDR device control

**Frontend:**
- React 18 - UI framework
- TypeScript - Type safety
- Vite - Build tool & dev server
- Tailwind CSS - Styling
- Zustand - State management
- Recharts - Spectrum visualization

**SDR Integration:**
- rtl-sdr - RTL-SDR device control
- hackrf - HackRF device control
- Custom FFT implementation

### Adding New SDR Devices

To add support for a new SDR device:

1. **Add device detection** in `sdr-server/lib/sdrDeviceManager.mjs`:
   ```javascript
   async scanYourDevice() {
     // Implement device detection
   }
   ```

2. **Add device capabilities**:
   ```javascript
   {
     id: 'yourdevice_0',
     name: 'Your SDR',
     type: 'yourdevice',
     capabilities: {
       minFreq: 1e6,
       maxFreq: 6000e6,
       sampleRates: [...]
     }
   }
   ```

3. **Implement control methods**:
   ```javascript
   startYourDeviceSampling(config) {
     // Start sample streaming
   }
   ```

4. **Update TypeScript types** in `src/types.ts`

## License

This project is available under a **Dual License**:

1. **Non-Commercial License** (free) - for personal, educational, research, amateur radio, and non-profit use
2. **Commercial License** - requires a separate agreement for commercial use

See the [LICENSE](LICENSE) file for complete terms and conditions.

### Quick License Summary

✅ **Allowed (Non-Commercial):**
- Personal radio monitoring and experimentation
- Educational use in schools and universities
- Research and development
- Amateur radio activities
- Non-profit organization use

❌ **Requires Commercial License:**
- Commercial products or services
- Business operations
- Revenue-generating activities
- Distribution of derivative works for profit

## Regulatory Compliance

⚠️ **Important:** Users are solely responsible for compliance with all applicable regulations:

- **FCC Regulations** (United States)
- **Radio Spectrum Licensing**
- **Communications Regulations** in your jurisdiction
- **Export Control Regulations**

**This software is intended for receiving only.** Transmission requires proper licensing and authorization. Unauthorized transmission may be illegal.

## Contributing

Contributions are welcome! This project is actively developed and we appreciate:

- 🐛 Bug fixes
- ✨ Feature enhancements
- 📝 Documentation improvements
- 🧪 Testing and platform compatibility
- 🎨 UI/UX improvements

**To contribute:**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Roadmap

**Planned Features:**

- 🎧 **Demodulation** - AM, FM, SSB, CW audio demodulation
- 📡 **Signal Decoders** - ADS-B, ACARS, NOAA APT, etc.
- 🔍 **Signal Analysis** - Constellation diagrams, eye diagrams
- 📊 **Advanced Visualization** - 3D waterfall, spectrogram
- 🌐 **Remote Control API** - REST API for automation
- 💾 **More Recording Formats** - WAV, Complex16, Float32
- 🔌 **Plugin System** - Extensible architecture
- 📱 **Mobile Apps** - Native iOS/Android apps
- ☁️ **Cloud Integration** - Remote monitoring and recording

## Acknowledgments

- Inspired by [Mesh-Bridge-GUI](https://github.com/IceNet-01/Mesh-Bridge-GUI)
- Built on excellent SDR community tools (rtl-sdr, hackrf)
- Thanks to all contributors and testers

## Support

- 🐛 [Report Bug](https://github.com/IceNet-01/IceNet-SDR/issues)
- 💡 [Request Feature](https://github.com/IceNet-01/IceNet-SDR/issues)
- 💬 [Discussions](https://github.com/IceNet-01/IceNet-SDR/discussions)

## Authors

**IceNet-01 Team**
- Northern Plains IT, LLC
- OnyxVZ, LLC

---

**Made with ❤️  for the SDR community**

*Copyright © 2025 Northern Plains IT, LLC and OnyxVZ, LLC. All rights reserved.*
