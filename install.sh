#!/bin/bash
#
# IceNet SDR Installation Script
# Installs dependencies and prepares the application for use
#

set -e

echo "======================================================================"
echo "  IceNet SDR - Installation Script"
echo "======================================================================"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "   Please install Node.js 18 or higher from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version is too old (v$NODE_VERSION)"
    echo "   Please install Node.js 18 or higher"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo ""
npm install

echo ""
echo "======================================================================"
echo "  ✅ Installation Complete!"
echo "======================================================================"
echo ""
echo "Next steps:"
echo ""
echo "  Development mode (recommended for first-time setup):"
echo "    npm run start"
echo ""
echo "  Production mode:"
echo "    npm run build"
echo "    npm run production"
echo ""
echo "  Install as system service (Linux only):"
echo "    sudo ./install-service.sh"
echo ""
echo "SDR Device Requirements:"
echo "  - RTL-SDR: Install rtl-sdr tools (rtl_test, rtl_sdr)"
echo "  - HackRF: Install hackrf tools (hackrf_info, hackrf_transfer)"
echo ""
echo "======================================================================"
