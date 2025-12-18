#!/bin/bash
# Start Fiona Telegram Bot

cd "$(dirname "$0")"

# Activate venv
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Default model
export FIONA_MODEL="${FIONA_MODEL:-dolphin-venice}"

echo ""
echo "🫀 Starting Fiona Telegram Bot..."
echo "   Model: $FIONA_MODEL"
echo ""

python telegram_bot.py "$@"



