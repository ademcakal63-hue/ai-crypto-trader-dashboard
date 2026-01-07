#!/bin/bash

# AI Crypto Trader Dashboard - VPS Deploy Script
# Bu script'i VPS'te çalıştırın: bash vps-deploy.sh

set -e

echo "🚀 AI Crypto Trader Dashboard - VPS Deploy"
echo "==========================================="

# Proje dizinine git
cd /root/ai-crypto-trader-dashboard

# .env dosyasını oluştur
echo "📝 .env dosyası oluşturuluyor..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
VITE_APP_TITLE=AI Crypto Trader Dashboard
VITE_APP_LOGO=/logo.png
JWT_SECRET=super-secret-jwt-key-for-vps-deployment-2024-adem
EOF

echo "✅ .env dosyası oluşturuldu"

# PM2 kurulu mu kontrol et
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2 kuruluyor..."
    npm install -g pm2
fi

# Mevcut processleri durdur
echo "🛑 Mevcut processler durduruluyor..."
pm2 delete all 2>/dev/null || true

# Dashboard'u başlat
echo "🌐 Dashboard başlatılıyor..."
pm2 start dist/index.js --name "dashboard" --env production

# Python bot için venv kontrol et ve başlat
echo "🤖 Trading Bot hazırlanıyor..."
cd ai_bot

# Python venv yoksa oluştur
if [ ! -d "venv" ]; then
    echo "📦 Python virtual environment oluşturuluyor..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Bot'u PM2 ile başlat
echo "🤖 Trading Bot başlatılıyor..."
cd /root/ai-crypto-trader-dashboard
pm2 start ai_bot/main_autonomous.py --name "btc-bot" --interpreter ai_bot/venv/bin/python -- --symbol BTCUSDT

# PM2'yi sistem başlangıcına ekle
echo "⚙️ PM2 sistem başlangıcına ekleniyor..."
pm2 startup systemd -u root --hp /root 2>/dev/null || true
pm2 save

# Durumu göster
echo ""
echo "==========================================="
echo "✅ Deploy tamamlandı!"
echo "==========================================="
echo ""
pm2 list
echo ""
echo "📊 Dashboard: http://199.247.0.148:3000"
echo "📧 Login: ademcakal63@gmail.com"
echo "🔑 Şifre: Nabrakon.CYX0"
echo ""
echo "📋 Logları görmek için: pm2 logs"
echo "🔄 Güncellemek için: git pull && pnpm build && pm2 restart all"
