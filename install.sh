#!/bin/bash
#
# IceNet SDR Installation Script
# Installs all dependencies including system SDR tools
#

set -e

echo "======================================================================"
echo "  IceNet SDR - Comprehensive Installation Script"
echo "======================================================================"
echo ""

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            OS=$ID
            OS_VERSION=$VERSION_ID
        else
            OS="unknown"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        OS="unknown"
    fi
}

# Check if running as root (needed for system packages)
check_sudo() {
    if [ "$EUID" -eq 0 ]; then
        SUDO=""
    else
        if command -v sudo &> /dev/null; then
            SUDO="sudo"
        else
            echo "⚠️  Warning: sudo not available and not running as root"
            echo "   System package installation may fail"
            SUDO=""
        fi
    fi
}

detect_os
check_sudo

echo "🔍 Detected OS: $OS"
echo ""

# ============================================================
# Step 1: Check Node.js
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Step 1: Checking Node.js"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "   Attempting to install Node.js..."

    case "$OS" in
        ubuntu|debian)
            echo "Installing Node.js via NodeSource repository..."
            curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO bash -
            $SUDO apt-get install -y nodejs
            ;;
        fedora|rhel|centos)
            echo "Installing Node.js via NodeSource repository..."
            curl -fsSL https://rpm.nodesource.com/setup_20.x | $SUDO bash -
            $SUDO dnf install -y nodejs || $SUDO yum install -y nodejs
            ;;
        arch|manjaro)
            echo "Installing Node.js via pacman..."
            $SUDO pacman -S --noconfirm nodejs npm
            ;;
        macos)
            if command -v brew &> /dev/null; then
                echo "Installing Node.js via Homebrew..."
                brew install node
            else
                echo "❌ Homebrew not found. Please install from https://brew.sh/"
                echo "   Then run: brew install node"
                exit 1
            fi
            ;;
        *)
            echo "❌ Automatic Node.js installation not supported for your OS"
            echo "   Please install Node.js 18+ manually from https://nodejs.org/"
            exit 1
            ;;
    esac
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version is too old (v$NODE_VERSION)"
    echo "   Please upgrade to Node.js 18 or higher"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo "✅ npm $(npm -v) detected"
echo ""

# ============================================================
# Step 2: Install SDR System Tools
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Step 2: Installing SDR System Tools"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

case "$OS" in
    ubuntu|debian)
        echo "📦 Installing RTL-SDR and HackRF tools..."
        $SUDO apt-get update
        $SUDO apt-get install -y rtl-sdr hackrf libusb-1.0-0-dev pkg-config

        # Add user to plugdev group for device access
        if [ -n "$SUDO_USER" ]; then
            $SUDO usermod -a -G plugdev $SUDO_USER
            echo "✅ Added $SUDO_USER to plugdev group"
        elif [ -n "$USER" ] && [ "$USER" != "root" ]; then
            $SUDO usermod -a -G plugdev $USER
            echo "✅ Added $USER to plugdev group"
        fi

        # Install udev rules
        echo "📝 Installing udev rules for SDR devices..."
        if [ -f /lib/udev/rules.d/rtl-sdr.rules ]; then
            $SUDO cp /lib/udev/rules.d/rtl-sdr.rules /etc/udev/rules.d/ 2>/dev/null || true
        fi
        $SUDO udevadm control --reload-rules 2>/dev/null || true
        $SUDO udevadm trigger 2>/dev/null || true
        ;;

    fedora|rhel|centos)
        echo "📦 Installing RTL-SDR and HackRF tools..."
        $SUDO dnf install -y rtl-sdr hackrf libusb-devel || $SUDO yum install -y rtl-sdr hackrf libusb-devel

        # Add user to dialout group
        if [ -n "$SUDO_USER" ]; then
            $SUDO usermod -a -G dialout $SUDO_USER
            echo "✅ Added $SUDO_USER to dialout group"
        elif [ -n "$USER" ] && [ "$USER" != "root" ]; then
            $SUDO usermod -a -G dialout $USER
            echo "✅ Added $USER to dialout group"
        fi
        ;;

    arch|manjaro)
        echo "📦 Installing RTL-SDR and HackRF tools..."
        $SUDO pacman -S --noconfirm rtl-sdr hackrf libusb

        # Add user to uucp group
        if [ -n "$SUDO_USER" ]; then
            $SUDO usermod -a -G uucp $SUDO_USER
            echo "✅ Added $SUDO_USER to uucp group"
        elif [ -n "$USER" ] && [ "$USER" != "root" ]; then
            $SUDO usermod -a -G uucp $USER
            echo "✅ Added $USER to uucp group"
        fi
        ;;

    macos)
        if command -v brew &> /dev/null; then
            echo "📦 Installing RTL-SDR and HackRF tools via Homebrew..."
            brew install librtlsdr hackrf
        else
            echo "⚠️  Homebrew not found. SDR tools not installed."
            echo "   Install Homebrew from https://brew.sh/"
            echo "   Then run: brew install librtlsdr hackrf"
        fi
        ;;

    *)
        echo "⚠️  Automatic SDR tool installation not supported for your OS"
        echo "   Please install manually:"
        echo "   - RTL-SDR: https://www.rtl-sdr.com/rtl-sdr-quick-start-guide/"
        echo "   - HackRF: https://github.com/greatscottgadgets/hackrf/releases"
        ;;
esac

# Verify installations
echo ""
echo "🔍 Verifying SDR tool installations..."
if command -v rtl_test &> /dev/null; then
    echo "✅ RTL-SDR tools installed (rtl_test found)"
else
    echo "⚠️  RTL-SDR tools not found (rtl_test not in PATH)"
fi

if command -v hackrf_info &> /dev/null; then
    echo "✅ HackRF tools installed (hackrf_info found)"
else
    echo "⚠️  HackRF tools not found (hackrf_info not in PATH)"
fi

echo ""

# ============================================================
# Step 3: Install Node.js Dependencies
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Step 3: Installing Node.js Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📦 Running npm install..."
npm install

echo ""

# ============================================================
# Step 4: Create Required Directories
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Step 4: Creating Required Directories"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

mkdir -p logs recordings config
echo "✅ Created logs, recordings, and config directories"
echo ""

# ============================================================
# Installation Complete!
# ============================================================
echo ""
echo "======================================================================"
echo "  ✅ Installation Complete!"
echo "======================================================================"
echo ""
echo "🎉 IceNet SDR is ready to use!"
echo ""
echo "Quick Start:"
echo ""
echo "  1. Development mode (with hot-reload):"
echo "     npm run start"
echo "     Then open: http://localhost:5173"
echo ""
echo "  2. Production mode:"
echo "     npm run build"
echo "     npm run production"
echo "     Then open: http://localhost:8080"
echo ""
echo "  3. Install as system service (Linux only):"
echo "     sudo ./install-service.sh"
echo ""
echo "Installed Components:"
echo "  ✅ Node.js $(node -v)"
echo "  ✅ npm $(npm -v)"
if command -v rtl_test &> /dev/null; then
    echo "  ✅ RTL-SDR tools"
fi
if command -v hackrf_info &> /dev/null; then
    echo "  ✅ HackRF tools"
fi
echo "  ✅ IceNet SDR application"
echo ""

if [[ "$OS" == "linux-gnu"* ]] || [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]] || [[ "$OS" == "fedora" ]] || [[ "$OS" == "arch" ]]; then
    echo "⚠️  IMPORTANT: You may need to log out and back in for USB device"
    echo "   permissions to take effect (if you were added to a group)"
    echo ""
fi

echo "Supported SDR Devices:"
echo "  📡 RTL-SDR (RTL2832U) - 24 MHz to 1.7 GHz"
echo "  📡 HackRF One - 1 MHz to 6 GHz"
echo "  📡 PlutoSDR - 325 MHz to 3.8 GHz (coming soon)"
echo "  📡 LimeSDR - 100 kHz to 3.8 GHz (coming soon)"
echo ""
echo "======================================================================"
echo ""
echo "Ready to start! Run: npm run start"
echo ""
