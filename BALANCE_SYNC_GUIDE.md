# 💰 Otomatik Bakiye Senkronizasyonu Rehberi

## 🎯 Amaç

Trading bot'unuzun **her işlem öncesi** Binance'den güncel bakiyeyi çekmesini ve kullanıcı ayarlarına göre doğru sermaye miktarını kullanmasını sağlamak.

---

## 🔄 Nasıl Çalışır?

### 1️⃣ **Kullanıcı Ayarları (Settings)**

Dashboard'da kullanıcı 2 farklı mod seçebilir:

#### **Mod A: Tüm Bakiyeyi Kullan** (Varsayılan)
- ✅ `useAllBalance = true`
- ✅ `capitalLimit = null` (boş)
- Bot Binance'deki **tüm USDT bakiyesini** kullanır
- Örnek: Hesapta 523 USDT varsa → Bot 523 USDT ile işlem yapar

#### **Mod B: Sermaye Limiti Belirle**
- ✅ `useAllBalance = false`
- ✅ `capitalLimit = 500` (kullanıcı belirler)
- Bot maksimum **500 USDT** kullanır (hesapta daha fazla olsa bile)
- Örnek: Hesapta 1000 USDT varsa → Bot sadece 500 USDT ile işlem yapar

---

### 2️⃣ **Otomatik Bakiye Kontrolü**

Bot her işlem öncesi şu adımları izler:

```python
from balance_helper import BalanceHelper

# 1. Helper oluştur
helper = BalanceHelper("https://your-dashboard.com")

# 2. Güncel bakiyeyi çek ve kullanılacak sermayeyi hesapla
usable_capital = helper.calculate_usable_capital()
# → Binance'den bakiye çeker
# → Ayarlara göre kullanılacak sermayeyi hesaplar
# → Örnek: 500.00 USDT

# 3. Pozisyon büyüklüğünü hesapla
position_calc = helper.calculate_position_size(
    entry_price=96500.0,
    stop_loss=96000.0,
    direction="LONG"
)

# Sonuç:
# {
#     'usable_capital': 500.0,      # Kullanılacak sermaye
#     'risk_amount': 10.0,          # Risk edilen miktar (%2)
#     'position_size': 1923.0,      # Pozisyon büyüklüğü
#     'leverage': 4,                # Hesaplanan kaldıraç
#     'stop_loss_percent': 0.52,    # Stop loss mesafesi %
# }
```

---

## 📊 Örnek Senaryolar

### **Senaryo 1: Tüm Bakiye Kullanımı**

**Ayarlar:**
- `useAllBalance = true`
- `capitalLimit = null`

**Binance Bakiyesi:** 523.45 USDT

**Sonuç:**
```
💰 Sermaye Hesaplama:
   Mod: Tüm Bakiye Kullan
   Kullanılabilir Bakiye: $523.45 USDT
   Kullanılacak Sermaye: $523.45 USDT

📊 Pozisyon Hesaplama:
   Risk/İşlem: 2% = $10.47 USDT
   Pozisyon Büyüklüğü: $2,013.46 USDT
   Kaldıraç: 4x
```

---

### **Senaryo 2: Sermaye Limiti Kullanımı**

**Ayarlar:**
- `useAllBalance = false`
- `capitalLimit = 500`

**Binance Bakiyesi:** 1,250.00 USDT

**Sonuç:**
```
💰 Sermaye Hesaplama:
   Mod: Sermaye Limiti
   Kullanılabilir Bakiye: $1,250.00 USDT
   Sermaye Limiti: $500.00 USDT
   Kullanılacak Sermaye: $500.00 USDT

📊 Pozisyon Hesaplama:
   Risk/İşlem: 2% = $10.00 USDT
   Pozisyon Büyüklüğü: $1,923.08 USDT
   Kaldıraç: 4x
```

---

### **Senaryo 3: Para Çekme Sonrası**

**Başlangıç:**
- Binance Bakiyesi: 500 USDT
- `useAllBalance = true`

**Kullanıcı 200 USDT çekti:**
- Yeni Bakiye: 300 USDT

**Bot'un Davranışı:**
```
💰 Sermaye Hesaplama:
   Mod: Tüm Bakiye Kullan
   Kullanılabilir Bakiye: $300.00 USDT  ← Otomatik güncellendi!
   Kullanılacak Sermaye: $300.00 USDT

📊 Pozisyon Hesaplama:
   Risk/İşlem: 2% = $6.00 USDT  ← Risk de güncellendi!
   Pozisyon Büyüklüğü: $1,153.85 USDT
   Kaldıraç: 4x
```

✅ **Sistem otomatik olarak yeni bakiyeyi kullanır!**

---

## 🔧 Teknik Detaylar

### **API Endpoint'leri**

#### 1. Bakiye Sorgulama
```
GET /api/trpc/dashboard.balance

Response:
{
  "result": {
    "data": {
      "total": 523.45,
      "available": 500.00
    }
  }
}
```

#### 2. Ayarları Sorgulama
```
GET /api/trpc/settings.get

Response:
{
  "result": {
    "data": {
      "capitalLimit": "500",
      "useAllBalance": false,
      "compoundEnabled": false,
      "riskPerTradePercent": "2.00",
      "dailyLossLimitPercent": "4.00",
      ...
    }
  }
}
```

---

### **BalanceHelper Class**

```python
class BalanceHelper:
    def __init__(self, dashboard_api_url: str):
        """Dashboard API URL'i ile başlat"""
        
    def get_current_balance(self) -> Optional[Dict]:
        """Binance'den güncel bakiyeyi çek"""
        
    def get_settings(self) -> Optional[Dict]:
        """Dashboard'dan ayarları çek"""
        
    def calculate_usable_capital(self) -> Optional[float]:
        """Kullanılacak sermayeyi hesapla (ayarlara göre)"""
        
    def calculate_position_size(self, entry_price, stop_loss, direction) -> Optional[Dict]:
        """Pozisyon büyüklüğü, kaldıraç ve risk hesapla"""
```

---

## 🚀 Bot Entegrasyonu

### **Adım 1: Helper'ı Import Et**

```python
from balance_helper import BalanceHelper

# Dashboard URL'inizi buraya yazın
DASHBOARD_URL = "https://your-dashboard.manus.space"
helper = BalanceHelper(DASHBOARD_URL)
```

### **Adım 2: Her İşlem Öncesi Bakiye Kontrol Et**

```python
def open_trade(symbol, entry_price, stop_loss, take_profit, direction):
    """Yeni işlem aç"""
    
    # 1. Pozisyon büyüklüğünü hesapla (güncel bakiyeye göre)
    calc = helper.calculate_position_size(
        entry_price=entry_price,
        stop_loss=stop_loss,
        direction=direction
    )
    
    if not calc:
        print("❌ Bakiye bilgisi alınamadı, işlem iptal!")
        return None
    
    # 2. Hesaplanan değerleri kullan
    position_size = calc['position_size']
    leverage = calc['leverage']
    risk_amount = calc['risk_amount']
    
    print(f"✅ Pozisyon açılıyor:")
    print(f"   Sermaye: ${calc['usable_capital']:.2f}")
    print(f"   Pozisyon: ${position_size:.2f}")
    print(f"   Kaldıraç: {leverage}x")
    print(f"   Risk: ${risk_amount:.2f}")
    
    # 3. Binance'de pozisyon aç
    # ... (Binance API çağrısı)
    
    # 4. Dashboard'a bildir
    dashboard.open_position(
        symbol=symbol,
        direction=direction,
        entry_price=entry_price,
        stop_loss=stop_loss,
        take_profit=take_profit,
        position_size=position_size
    )
```

### **Adım 3: Bileşik Getiri Kontrolü**

```python
def check_compound_enabled():
    """Bileşik getiri aktif mi kontrol et"""
    settings = helper.get_settings()
    if settings:
        return settings.get('compoundEnabled', False)
    return False

# Kullanım:
if check_compound_enabled():
    print("✅ Bileşik getiri aktif - Kazançlar sermayeye eklenecek")
else:
    print("ℹ️ Bileşik getiri pasif - Sabit sermaye kullanılacak")
```

---

## ✅ Test Etme

### **Test 1: Bakiye Kontrolü**

```bash
cd /home/ubuntu/ai-crypto-trader-dashboard
python3 balance_helper.py
```

**Beklenen Çıktı:**
```
============================================================
Örnek: BTC Long Pozisyon Hesaplama
============================================================

💰 Sermaye Hesaplama:
   Mod: Tüm Bakiye Kullan
   Kullanılabilir Bakiye: $500.00 USDT
   Kullanılacak Sermaye: $500.00 USDT

📊 Pozisyon Hesaplama:
   Kullanılacak Sermaye: $500.00 USDT
   Risk/İşlem: 2.0% = $10.00 USDT
   Stop Loss Mesafesi: 1.00%
   Pozisyon Büyüklüğü: $1000.00 USDT
   Kaldıraç: 2x

✅ Hesaplama başarılı!

Bot şimdi $1000.00 USDT pozisyon açabilir
Kaldıraç: 2x
```

### **Test 2: Bot Entegrasyonu**

```bash
cd /home/ubuntu/ai-crypto-trader-dashboard
python3 bot_example.py
```

**Beklenen Çıktı:**
```
🤖 AI Crypto Trader Bot - Dashboard Test
==================================================

0️A️⃣ Güncel bakiye kontrol ediliyor...

💰 Sermaye Hesaplama:
   Mod: Tüm Bakiye Kullan
   Kullanılabilir Bakiye: $500.00 USDT
   Kullanılacak Sermaye: $500.00 USDT

✅ Kullanılacak sermaye: $500.00 USDT

0️B️⃣ Pozisyon büyüklüğü hesaplanıyor...

📊 Pozisyon Hesaplama:
   Kullanılacak Sermaye: $500.00 USDT
   Risk/İşlem: 2.0% = $10.00 USDT
   Stop Loss Mesafesi: 0.52%
   Pozisyon Büyüklüğü: $1923.08 USDT
   Kaldıraç: 4x

✅ Pozisyon hesaplaması tamamlandı!
   Pozisyon Büyüklüğü: $1923.08 USDT
   Kaldıraç: 4x
   Risk: $10.00 USDT
```

---

## 🎯 Özet

### ✅ **Yapılanlar:**

1. **Settings.tsx** güncellendi:
   - `capitalLimit` (opsiyonel sermaye limiti)
   - `useAllBalance` toggle (tüm bakiye/limit seçimi)
   
2. **Database schema** hazır:
   - `botSettings` tablosu güncel
   
3. **Backend API** hazır:
   - `dashboard.balance` → Binance bakiyesi
   - `settings.get` → Kullanıcı ayarları
   
4. **BalanceHelper** oluşturuldu:
   - Otomatik bakiye kontrolü
   - Sermaye hesaplama
   - Pozisyon büyüklüğü hesaplama
   
5. **bot_example.py** güncellendi:
   - BalanceHelper entegrasyonu
   - Örnek kullanım senaryoları

### 🚀 **Sonraki Adım:**

Bot'unuzu çalıştırın ve her işlem öncesi `balance_helper.calculate_position_size()` fonksiyonunu kullanın. Sistem otomatik olarak:
- ✅ Binance'den güncel bakiyeyi çeker
- ✅ Kullanıcı ayarlarına göre sermayeyi hesaplar
- ✅ Pozisyon büyüklüğünü ve kaldıracı belirler
- ✅ Risk miktarını kontrol eder

**Artık para çekseniz bile bot otomatik olarak yeni bakiyeyi kullanır!** 🎉
