#!/bin/bash
# Clean wrapper script to run bot with isolated venv environment
# This script completely isolates from system Python and uv Python

# Unset all Python-related environment variables
unset PYTHONHOME
unset PYTHONPATH
unset PYTHONEXECUTABLE
unset VIRTUAL_ENV

# Set clean PATH without uv Python
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

# Change to bot directory
cd /home/ubuntu/ai-crypto-trader-dashboard/ai_bot || exit 1

# Activate venv (this sets VIRTUAL_ENV and PYTHONPATH correctly)
source venv/bin/activate || exit 1

# Run bot with unbuffered output
exec python -u main.py "$@"
