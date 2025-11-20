# IceNet SDR - Quick Start Guide

## 30-Second Setup

```bash
# 1. Clone and install
git clone https://github.com/IceNet-01/IceNet-SDR.git
cd IceNet-SDR
./install.sh

# 2. Start the application
npm run start

# 3. Open browser
# Go to: http://localhost:5173
```

## First Time Usage

1. **Connect SDR Device** - Plug in your RTL-SDR or HackRF via USB

2. **Scan for Devices** - Click "Scan for SDR Devices" button

3. **Connect** - Click on your device to connect

4. **Start Streaming** - Click "Start Streaming" to view spectrum

5. **Tune** - Enter frequency in MHz and click "Set"

That's it! You're now viewing live spectrum data.

## Common Frequencies to Try

- **FM Radio:** 88-108 MHz
- **Air Band:** 118-137 MHz
- **Weather Satellites (NOAA):** 137.1, 137.62, 137.9125 MHz
- **ISS:** 145.8 MHz
- **ADS-B Aircraft:** 1090 MHz

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the waterfall display
- Try recording signals
- Adjust gain and sample rate for optimal reception

## Need Help?

- Check [Troubleshooting](README.md#troubleshooting) section
- Open an [Issue](https://github.com/IceNet-01/IceNet-SDR/issues)
- Join our [Discussions](https://github.com/IceNet-01/IceNet-SDR/discussions)
