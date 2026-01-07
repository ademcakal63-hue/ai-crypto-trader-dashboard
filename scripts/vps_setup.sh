#!/bin/bash
# AI Crypto Trader Dashboard - VPS Quick Setup Script
# Run as root on a fresh Ubuntu 22.04 VPS

set -e

echo "🚀 AI Crypto Trader Dashboard - VPS Setup"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: System Update${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}Step 2: Installing Dependencies${NC}"
apt install -y curl git build-essential python3.11 python3.11-venv python3-pip nginx certbot python3-certbot-nginx ufw

echo -e "${YELLOW}Step 3: Installing Node.js 22${NC}"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

echo -e "${YELLOW}Step 4: Installing pnpm${NC}"
npm install -g pnpm

echo -e "${YELLOW}Step 5: Creating ubuntu user${NC}"
if ! id "ubuntu" &>/dev/null; then
    adduser --disabled-password --gecos "" ubuntu
    usermod -aG sudo ubuntu
    echo "ubuntu ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
fi

echo -e "${YELLOW}Step 6: Creating project directory${NC}"
mkdir -p /home/ubuntu/apps
chown -R ubuntu:ubuntu /home/ubuntu/apps

echo -e "${YELLOW}Step 7: Setting up Firewall${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo -e "${YELLOW}Step 8: Creating Swap (2GB)${NC}"
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo ""
echo -e "${GREEN}✅ VPS Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Upload your project to /home/ubuntu/apps/ai-crypto-trader-dashboard"
echo "2. Run: cd /home/ubuntu/apps/ai-crypto-trader-dashboard && pnpm install"
echo "3. Create .env file with your credentials"
echo "4. Setup systemd services (see VULTR_DEPLOY.md)"
echo ""
echo -e "${YELLOW}SSH as ubuntu user:${NC} ssh ubuntu@YOUR_VPS_IP"
