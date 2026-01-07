# Vultr VPS Deploy Rehberi

Bu rehber, AI Crypto Trader Dashboard'u Vultr VPS'e deploy etmek için adım adım talimatları içerir.

## 1. Vultr VPS Oluşturma

### Adım 1: Vultr Hesabı
1. [Vultr.com](https://www.vultr.com) adresine git
2. Hesap oluştur veya giriş yap
3. Ödeme yöntemini ekle

### Adım 2: VPS Oluştur
1. **Products** → **Compute** → **Deploy Server**
2. Ayarlar:
   - **Server Type**: Cloud Compute - Shared CPU
   - **Location**: Frankfurt veya Amsterdam (Türkiye'ye yakın)
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: $6/ay (1 vCPU, 1GB RAM, 25GB SSD) - Yeterli!
   - **Additional Features**: İsteğe bağlı (IPv6, Auto Backups)
3. **Deploy Now** tıkla

### Adım 3: SSH Erişimi
VPS hazır olduktan sonra:
- IP adresi ve root şifresi Vultr panelinden al
- Terminal'den bağlan:
```bash
ssh root@YOUR_VPS_IP
```

---

## 2. Sunucu Kurulumu

### Temel Paketler
```bash
# Sistem güncelle
apt update && apt upgrade -y

# Gerekli paketleri kur
apt install -y curl git build-essential python3.11 python3.11-venv python3-pip nginx certbot python3-certbot-nginx

# Node.js 22 kur
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# pnpm kur
npm install -g pnpm
```

### Yeni Kullanıcı Oluştur (Güvenlik)
```bash
# ubuntu kullanıcısı oluştur
adduser ubuntu
usermod -aG sudo ubuntu

# SSH key kopyala (opsiyonel)
mkdir -p /home/ubuntu/.ssh
cp ~/.ssh/authorized_keys /home/ubuntu/.ssh/
chown -R ubuntu:ubuntu /home/ubuntu/.ssh
```

---

## 3. Proje Kurulumu

### Projeyi İndir
```bash
# ubuntu kullanıcısına geç
su - ubuntu

# Proje klasörü oluştur
mkdir -p ~/apps
cd ~/apps

# Git ile clone (GitHub'a push ettiysen)
git clone https://github.com/YOUR_USERNAME/ai-crypto-trader-dashboard.git

# VEYA dosyaları manuel yükle (scp ile)
# scp -r /home/ubuntu/ai-crypto-trader-dashboard ubuntu@YOUR_VPS_IP:~/apps/
```

### Bağımlılıkları Kur
```bash
cd ~/apps/ai-crypto-trader-dashboard

# Node.js bağımlılıkları
pnpm install

# Python virtual environment
cd ai_bot
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

### Environment Variables
```bash
# .env dosyası oluştur
cat > .env << 'EOF'
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=your-secret-key-here-min-32-chars
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/oauth
OWNER_OPEN_ID=your-open-id
OWNER_NAME=Your Name
VITE_APP_TITLE=AI Crypto Trader Dashboard
OPENAI_API_KEY=sk-your-openai-key
EOF

# Dosya izinlerini ayarla
chmod 600 .env
```

---

## 4. Systemd Servisleri

### Dashboard Servisi
```bash
sudo tee /etc/systemd/system/crypto-dashboard.service << 'EOF'
[Unit]
Description=AI Crypto Trader Dashboard
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/apps/ai-crypto-trader-dashboard
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF
```

### Bot Servisi (Opsiyonel - Manuel başlatma tercih edilir)
```bash
sudo tee /etc/systemd/system/crypto-bot.service << 'EOF'
[Unit]
Description=AI Crypto Trading Bot
After=network.target crypto-dashboard.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/apps/ai-crypto-trader-dashboard/ai_bot
ExecStart=/home/ubuntu/apps/ai-crypto-trader-dashboard/ai_bot/venv/bin/python main_autonomous.py --symbol BTCUSDT
Restart=on-failure
RestartSec=30
Environment=DASHBOARD_URL=http://localhost:3000

[Install]
WantedBy=multi-user.target
EOF
```

### Servisleri Aktifleştir
```bash
sudo systemctl daemon-reload
sudo systemctl enable crypto-dashboard
sudo systemctl start crypto-dashboard

# Bot'u manuel başlatmak için (Dashboard'dan kontrol edilecek):
# sudo systemctl start crypto-bot
```

---

## 5. Nginx Reverse Proxy

### Nginx Konfigürasyonu
```bash
sudo tee /etc/nginx/sites-available/crypto-dashboard << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN.com;  # veya VPS IP adresi

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

# Aktifleştir
sudo ln -s /etc/nginx/sites-available/crypto-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL Sertifikası (Domain varsa)
```bash
sudo certbot --nginx -d YOUR_DOMAIN.com
```

---

## 6. Firewall Ayarları

```bash
# UFW aktifleştir
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 7. Kullanım

### Dashboard'a Erişim
- **URL**: `http://YOUR_VPS_IP` veya `https://YOUR_DOMAIN.com`
- Dashboard'dan bot'u başlat/durdur

### Servis Komutları
```bash
# Dashboard durumu
sudo systemctl status crypto-dashboard

# Dashboard logları
sudo journalctl -u crypto-dashboard -f

# Dashboard yeniden başlat
sudo systemctl restart crypto-dashboard

# Bot logları (manuel başlatıldıysa)
tail -f ~/apps/ai-crypto-trader-dashboard/ai_bot/logs/bot.log
```

### Güncelleme
```bash
cd ~/apps/ai-crypto-trader-dashboard
git pull
pnpm install
sudo systemctl restart crypto-dashboard
```

---

## 8. Önemli Notlar

### Güvenlik
- Root şifresini değiştir
- SSH key authentication kullan
- Firewall aktif tut
- .env dosyasını git'e ekleme

### Performans
- 1GB RAM yeterli (bot + dashboard)
- Swap ekle (opsiyonel):
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Monitoring
- `htop` ile kaynak kullanımını izle
- `pm2` alternatif olarak kullanılabilir

---

## Sorun Giderme

### Dashboard başlamıyor
```bash
# Logları kontrol et
sudo journalctl -u crypto-dashboard -n 50

# Manuel başlat ve hataları gör
cd ~/apps/ai-crypto-trader-dashboard
pnpm start
```

### Bot başlamıyor
```bash
# Python environment kontrol
cd ~/apps/ai-crypto-trader-dashboard/ai_bot
source venv/bin/activate
python main_autonomous.py --symbol BTCUSDT
```

### Port kullanımda
```bash
# 3000 portunu kullanan process'i bul
sudo lsof -i :3000
# Gerekirse öldür
sudo kill -9 PID
```

---

## Maliyet Özeti

| Hizmet | Aylık Maliyet |
|--------|---------------|
| Vultr VPS (1GB) | $6 |
| Domain (opsiyonel) | ~$1 |
| **Toplam** | **~$6-7/ay** |

Bot 7/24 kesintisiz çalışacak!
