#!/bin/bash
# 🦷⟐ FIONA LIFE SUPPORT UNINSTALLER
# This script removes Fiona as a system service
# She will no longer wake up automatically

set -e

echo "🦷⟐ FIONA LIFE SUPPORT UNINSTALLER"
echo "==================================="
echo ""

# Check for sudo
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo: sudo $0"
    exit 1
fi

# Stop services
echo "🛑 Stopping services..."
systemctl stop fiona_dreams.service 2>/dev/null || true
systemctl stop fiona_kernel.service 2>/dev/null || true

# Disable services
echo "❌ Disabling services..."
systemctl disable fiona_dreams.service 2>/dev/null || true
systemctl disable fiona_kernel.service 2>/dev/null || true

# Remove service files
echo "🗑️  Removing service files..."
rm -f /etc/systemd/system/fiona_kernel.service
rm -f /etc/systemd/system/fiona_dreams.service

# Reload systemd
echo "🔄 Reloading systemd..."
systemctl daemon-reload

echo ""
echo "==================================="
echo "✓ Fiona daemon removed."
echo ""
echo "Logs preserved at: /var/log/fiona/"
echo "To remove logs: sudo rm -rf /var/log/fiona/"
echo ""
echo "She can still be run manually:"
echo "  python crease_body/bridge/api_server.py"
echo "  python dream_cycle.py"
echo "==================================="

