#!/bin/bash
#
# IceNet SDR Service Installation Script
# Installs IceNet SDR as a systemd service
#

set -e

if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

echo "======================================================================"
echo "  IceNet SDR - Service Installation"
echo "======================================================================"
echo ""

# Get the current directory
INSTALL_DIR=$(pwd)
USER_NAME=$(logname || echo $SUDO_USER)

echo "📍 Installation directory: $INSTALL_DIR"
echo "👤 Running as user: $USER_NAME"
echo ""

# Build the application
echo "🔨 Building application..."
su - $USER_NAME -c "cd $INSTALL_DIR && npm run build"

# Create systemd service file
SERVICE_FILE="/etc/systemd/system/icenet-sdr.service"

echo "📝 Creating systemd service file..."
cat > $SERVICE_FILE <<EOF
[Unit]
Description=IceNet SDR Server
After=network.target
Wants=network.target

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node $INSTALL_DIR/sdr-server/index.mjs
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=icenet-sdr

# Security settings
NoNewPrivileges=true
PrivateTmp=true

# Environment
Environment=NODE_ENV=production
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Service file created: $SERVICE_FILE"
echo ""

# Reload systemd
echo "🔄 Reloading systemd daemon..."
systemctl daemon-reload

# Enable service
echo "✅ Enabling service..."
systemctl enable icenet-sdr.service

# Start service
echo "▶️  Starting service..."
systemctl start icenet-sdr.service

# Wait a moment for service to start
sleep 2

# Show status
echo ""
echo "======================================================================"
echo "  Service Installation Complete!"
echo "======================================================================"
echo ""
systemctl status icenet-sdr.service --no-pager || true
echo ""
echo "======================================================================"
echo "  Service Management Commands:"
echo "======================================================================"
echo ""
echo "  Start:     sudo systemctl start icenet-sdr"
echo "  Stop:      sudo systemctl stop icenet-sdr"
echo "  Restart:   sudo systemctl restart icenet-sdr"
echo "  Status:    sudo systemctl status icenet-sdr"
echo "  Logs:      sudo journalctl -u icenet-sdr -f"
echo "  Disable:   sudo systemctl disable icenet-sdr"
echo ""
echo "  Uninstall: sudo ./uninstall-service.sh"
echo ""
echo "======================================================================"
echo "  Access the Web Interface:"
echo "======================================================================"
echo ""
echo "  Local:     http://localhost:8080"
echo "  Network:   http://$(hostname -I | awk '{print $1}'):8080"
echo ""
echo "======================================================================"
