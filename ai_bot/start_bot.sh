#!/bin/bash
# Bot starter script with venv activation

cd /home/ubuntu/ai-crypto-trader-dashboard/ai_bot
source venv/bin/activate
exec python -u main.py "$@"
