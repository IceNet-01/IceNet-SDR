#!/bin/bash
#
# IceNet SDR Uninstallation Script
#

echo "======================================================================"
echo "  IceNet SDR - Uninstallation"
echo "======================================================================"
echo ""

# Check if service is installed
if [ -f "/etc/systemd/system/icenet-sdr.service" ]; then
    echo "⚠️  System service detected!"
    echo "   Please run: sudo ./uninstall-service.sh first"
    echo ""
fi

echo "⚠️  This will remove all dependencies and generated files."
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Uninstallation cancelled."
    exit 0
fi

echo ""
echo "🗑️  Removing node_modules..."
rm -rf node_modules

echo "🗑️  Removing dist..."
rm -rf dist

echo "🗑️  Removing logs..."
rm -rf logs

echo "🗑️  Removing recordings..."
rm -rf recordings

echo "🗑️  Removing config..."
rm -rf config

echo ""
echo "======================================================================"
echo "  ✅ Uninstallation Complete"
echo "======================================================================"
echo ""
echo "Application has been cleaned up."
echo "You can now safely delete this directory if desired."
echo ""
