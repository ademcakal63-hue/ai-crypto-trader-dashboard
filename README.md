# 🤖 AI Crypto Trader Dashboard

**Öğrenen, Gelişen, Kazandıran** - Profesyonel AI Trading Dashboard

---

## 🎯 Özellikler

- ✅ **Gerçek Zamanlı Trading** - Binance API entegrasyonu
- ✅ **AI Pattern Analizi** - 6 SMC pattern tespiti
- ✅ **Risk Yönetimi** - Günlük limit, pozisyon boyutlandırma
- ✅ **Performans Takibi** - Equity curve, drawdown, R oranı
- ✅ **Bildirim Sistemi** - Önemli olaylar için gerçek zamanlı alerts
- ✅ **Bileşik Getiri** - Kazançları otomatik sermayeye ekle

---

## 🚀 Hızlı Başlangıç

### 1. Binance API Key Oluştur

1. [Binance](https://www.binance.com) hesabına giriş yap
2. **API Management** → **Create API**
3. **Spot Trading** yetkisi ver (Futures gerekmez)
4. API Key ve Secret'ı kaydet

### 2. Dashboard'a Bağlan

1. Dashboard'u aç
2. Sağ üstteki **⚙️ Ayarlar** butonuna tıkla
3. **Binance API Key** ve **Secret** gir
4. **Bağlantıyı Test Et** butonuna tıkla
5. Bakiyeni gör ve doğrula

### 3. Sermaye Ayarlarını Yap

1. **Kullanılacak Sermaye** gir (örn: 500 USDT)
2. **Tüm Bakiyeyi Kullan** toggle'ını aktif et (isteğe bağlı)
3. **Bileşik Getiri** toggle'ını aktif et (kazançlar sermayeye eklensin)
4. **Günlük Kayıp Limiti** ve **İşlem Başına Risk** ayarla
5. **Ayarları Kaydet** butonuna tıkla

### 4. Bot'u Başlat

Bot'u başlatmak için `bot_example.py` dosyasını kullan:

```python
from bot_example import TradingBotDashboard

# Dashboard API client
dashboard = TradingBotDashboard(api_url="https://YOUR_DASHBOARD_URL/api/bot")

# Pozisyon aç
dashboard.open_position(
    symbol="BTCUSDT",
    direction="LONG",
    entry_price=96500.00,
    stop_loss=95500.00,
    take_profit=98500.00,
    position_size=100.00
)
```

---

## 📊 Dashboard Bölümleri

### Ana Sayfa
- **Mevcut Bakiye** - Binance hesap bakiyesi
- **Bugünkü Kâr/Zarar** - Günlük performans
- **Açık Pozisyonlar** - Aktif işlemler
- **Başarı Oranı** - Win rate

### Risk Yönetimi
- **Günlük Kayıp Limiti** - %4 (varsayılan)
- **İşlem Başına Risk** - %2 (varsayılan)
- **Kullanılan Risk** - Anlık risk durumu

### AI Pattern Analizi
- **Liquidity Sweep** - Stop hunt tespiti
- **Order Block** - Kurumsal destek/direnç
- **Fair Value Gap** - Fiyat dengesizlikleri
- **Market Structure Break** - Trend değişimleri
- **Trend Following** - Ana trend takibi
- **Support/Resistance** - Destek/direnç seviyeleri

### Performans Grafikleri
- **Equity Curve** - Sermaye değişimi
- **Drawdown** - Maksimum düşüş
- **Günlük P&L** - Günlük kâr/zarar
- **R Oranı Dağılımı** - Risk/ödül analizi

### Bildirimler
- Pozisyon açıldı/kapandı
- Risk limiti aşıldı
- Günlük limit doldu
- Bağlantı kesildi

---

## 🔐 Güvenlik

- API Secret'lar şifreli saklanır
- Sadece Spot Trading yetkisi gerekir
- Withdrawal yetkisi verilmemelidir
- IP whitelist kullanılması önerilir

---

## 📝 API Endpoint'leri

### Bot API

```
POST /api/bot/position/open      - Yeni pozisyon aç
POST /api/bot/position/close     - Pozisyon kapat
POST /api/bot/position/update    - Pozisyon güncelle (SL/TP)
POST /api/bot/trade/complete     - İşlem tamamlandı
POST /api/bot/metrics/update     - Performans metriklerini güncelle
POST /api/bot/emergency-stop     - Acil durdur
```

### Dashboard API

```
GET  /api/dashboard/overview     - Ana sayfa verileri
GET  /api/dashboard/positions    - Açık pozisyonlar
GET  /api/dashboard/trades       - İşlem geçmişi
GET  /api/dashboard/balance      - Binance bakiyesi
```

---

## 🛠️ Teknik Detaylar

- **Frontend:** React 19 + Tailwind 4
- **Backend:** Express 4 + tRPC 11
- **Database:** MySQL (TiDB)
- **API:** Binance Spot API
- **Deployment:** Manus Platform

---

## 📞 Destek

Sorularınız için: [help.manus.im](https://help.manus.im)

---

**Not:** Bu dashboard gerçek para ile çalışır. Küçük miktarlarla başlayın ve risk yönetimi kurallarına uyun.
