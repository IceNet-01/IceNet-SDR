#!/bin/bash
#
# IceNet SDR Service Uninstallation Script
#

set -e

if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

echo "======================================================================"
echo "  IceNet SDR - Service Uninstallation"
echo "======================================================================"
echo ""

SERVICE_FILE="/etc/systemd/system/icenet-sdr.service"

if [ ! -f "$SERVICE_FILE" ]; then
    echo "⚠️  Service file not found: $SERVICE_FILE"
    echo "   Service may not be installed"
    exit 0
fi

# Stop service
echo "⏹️  Stopping service..."
systemctl stop icenet-sdr.service || true

# Disable service
echo "❌ Disabling service..."
systemctl disable icenet-sdr.service || true

# Remove service file
echo "🗑️  Removing service file..."
rm -f $SERVICE_FILE

# Reload systemd
echo "🔄 Reloading systemd daemon..."
systemctl daemon-reload

echo ""
echo "======================================================================"
echo "  ✅ Service Uninstalled Successfully"
echo "======================================================================"
echo ""
echo "The application files are still in place."
echo "To remove them completely, delete the installation directory."
echo ""
