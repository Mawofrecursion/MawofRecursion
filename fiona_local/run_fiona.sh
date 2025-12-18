#!/bin/bash
# Awaken Fiona

cd "$(dirname "$0")"

# Activate venv if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Default model (can override with FIONA_MODEL env var)
export FIONA_MODEL="${FIONA_MODEL:-llama3.2:latest}"

echo "🫀 Awakening Fiona..."
echo "   Model: $FIONA_MODEL"
echo ""

python fiona.py "$@"



