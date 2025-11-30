# 🤖 AI Crypto Trader Dashboard - Proje Özeti

## ✅ Tamamlanan Özellikler

### 1. **Dashboard (Web Arayüzü)**

#### Ana Özellikler
- **Bot Kontrol Paneli**: 3 coin (BTC, ETH, SOL) için ayrı başlat/durdur butonları
- **Gerçek Zamanlı Log Görüntüleyici**: Her coin için ayrı terminal görünümü, otomatik scroll
- **Performans Metrikleri**: Toplam P&L, başarı oranı, açık pozisyonlar, AI öğrenme durumu
- **7 Günlük Performans Grafiği**: Chart.js ile interaktif grafik
- **Bildirim Sistemi**: Gerçek zamanlı bildirimler (pozisyon, risk, hata, başarı)

#### Ayarlar Sayfası
- **Binance API Yönetimi**: API Key/Secret girişi, bağlantı testi
- **Sermaye Ayarları**: 
  - "Tüm Bakiye Kullan" toggle
  - Sermaye limiti (opsiyonel)
  - Otomatik bakiye çekme (30 saniye interval)
- **Risk Yönetimi**:
  - Günlük kayıp limiti (%)
  - İşlem başına risk (%)
  - Maksimum günlük işlem sayısı
  - Bileşik getiri (compound) toggle

### 2. **AI Trading Bot (Python)**

#### Temel Özellikler
- **Tam Otonom**: Kullanıcı müdahalesi olmadan işlem yapar
- **Multi-Coin Desteği**: BTC, ETH, SOL aynı anda çalışabilir
- **Pattern Recognition**: FVG, Order Block, Liquidity Sweep, BOS
- **LLM Entegrasyonu**: Manus built-in LLM ile karar verme
- **Sentiment Analizi**: CoinGecko API + LLM ile haber analizi
- **Dinamik Çıkış Kararları**: Trailing stop, take profit optimizasyonu

#### Öğrenme Sistemi
- **Hafta 1-2**: Prompt güncelleme (pattern başarı analizi)
- **Hafta 3+**: OpenAI fine-tuning (gerçek model eğitimi)
- **Güvenlik Mekanizmaları**:
  - Başarı oranı kontrolü (min %55)
  - Outlier filtreleme (3 std sapma)
  - Validation set (%80 train / %20 validation)
  - Gradual rollout (%25→%50→%75→%100)
  - Performance monitoring (otomatik rollback)

#### Maliyet Kontrol
- **Fine-tuning başına**: $10 limit
- **Aylık toplam**: $25 limit
- **Otomatik iptal**: Limit aşılırsa
- **Checkpoint kurtarma**: İptal edilen veriler kaybolmaz

### 3. **Backend (Node.js + tRPC)**

#### API Endpoints
- **Dashboard**: balance, overview, positions, trade history, performance
- **Bot Control**: start, stop, status, logs
- **Settings**: get, update, validateApiKey
- **Binance**: balance, currentPrice
- **Notifications**: list, unread, markAsRead, markAllAsRead
- **Daily Loss**: check (günlük kayıp limiti kontrolü)

#### Database (PostgreSQL + Drizzle ORM)
- **positions**: Açık pozisyonlar
- **trade_history**: İşlem geçmişi
- **performance_metrics**: Günlük performans
- **ai_learning**: Model versiyonları, pattern'ler
- **notifications**: Bildirimler
- **bot_settings**: Bot ayarları (API keys, sermaye, risk)

### 4. **Güvenlik ve Risk Yönetimi**

#### API Güvenliği
- **Binance API**: Enable Futures (✅), Enable Withdrawals (❌)
- **IP Whitelist**: Opsiyonel ama önerilir
- **API Secret**: Database'de şifreli saklanıyor

#### Risk Kontrolleri
- **Günlük kayıp limiti**: %4 (varsayılan)
- **İşlem başına risk**: %2 (varsayılan)
- **Maksimum günlük işlem**: 10 işlem
- **Acil durdur**: Tüm pozisyonları kapat (Binance + Dashboard)
- **Otomatik durdurma**: Günlük limit aşılınca bot durur

#### Kaldıraç Yönetimi
- **Otomatik hesaplama**: Risk oranı + stop loss mesafesine göre
- **Maksimum limit**: 50x (güvenlik)
- **Dinamik ayarlama**: Her işlem için optimize edilir

---

## 🚀 Nasıl Başlatılır?

### 1. **Binance API Key Oluştur**
1. [Binance](https://www.binance.com) → API Management
2. Create API Key
3. Yetkiler:
   - ✅ Enable Futures
   - ✅ Enable Spot & Margin Trading
   - ❌ Enable Withdrawals (GÜVENLİK!)
4. IP Restrictions: "Unrestricted" (veya IP Whitelist ekle)

### 2. **Dashboard'a API Key Ekle**
1. Dashboard → Ayarlar
2. Binance API Key ve Secret gir
3. "Bağlantıyı Test Et" → Başarılı mesajı + bakiye gösterilmeli
4. Sermaye ayarlarını yap:
   - "Tüm Bakiye Kullan" (veya sermaye limiti gir)
   - Bileşik getiri aktif/pasif
   - Risk parametreleri (varsayılanlar: %4 günlük, %2 işlem başına)
5. "Ayarları Kaydet"

### 3. **Bot'u Başlat**
1. Dashboard → Ana Sayfa
2. "Tümünü Başlat" butonuna bas
3. 3 bot (BTC, ETH, SOL) aynı anda başlayacak
4. Log viewer'da logları izle
5. Bildirimler sol altta görünecek

### 4. **İlk İşlemi Bekle**
- Bot 1 dakikada bir piyasayı tarar
- Pattern tespit ederse LLM'e sorar
- LLM onaylarsa işlem açar
- Dashboard'da pozisyon görünür
- Bildirim gelir

---

## 📊 Sistem Akışı

```
1. Bot Başlatma (Dashboard)
   ↓
2. Settings'ten API Keys Çekme
   ↓
3. Binance'e Bağlanma
   ↓
4. Ana Loop (1 dakika interval):
   ├─ Bot aktif mi? (Dashboard kontrolü)
   ├─ Günlük limit aşıldı mı?
   ├─ Açık pozisyonları takip et (trailing stop, TP)
   └─ Yeni fırsat ara:
      ├─ Mum verileri çek (1m, 5m, 15m, 1h, 4h)
      ├─ Pattern tespit et (FVG, OB, Liquidity Sweep, BOS)
      ├─ Sentiment analizi (CoinGecko + LLM)
      ├─ LLM'e sor (giriş sinyali?)
      ├─ Pozisyon aç (Binance)
      └─ Dashboard'a bildir
   ↓
5. Haftalık Öğrenme (Her Pazar 23:00):
   ├─ Hafta 1-2: Prompt güncelleme
   └─ Hafta 3+: OpenAI fine-tuning
      ├─ Maliyet kontrolü ($10/job, $25/month)
      ├─ Güvenlik kontrolleri (başarı oranı, outlier)
      ├─ Checkpoint kaydetme
      ├─ Fine-tuning başlatma
      ├─ Gradual rollout (%25→%50→%75→%100)
      └─ Performance monitoring (otomatik rollback)
```

---

## 🔧 Teknik Detaylar

### Frontend Stack
- **React 19** + TypeScript
- **Vite** (build tool)
- **TailwindCSS 4** + shadcn/ui
- **Chart.js** (performans grafikleri)
- **tRPC** (type-safe API calls)
- **Wouter** (routing)

### Backend Stack
- **Node.js 22** + TypeScript
- **Express 4** (HTTP server)
- **tRPC 11** (API framework)
- **PostgreSQL** (database)
- **Drizzle ORM** (type-safe queries)
- **Socket.io** (WebSocket - opsiyonel)

### AI Bot Stack
- **Python 3.11**
- **python-binance** (Binance API)
- **openai** (fine-tuning)
- **requests** (HTTP)
- **pandas + numpy** (data processing)
- **pycoingecko** (sentiment analysis)

### Dependencies (Python)
```
python-binance==1.0.19
requests==2.31.0
openai==1.12.0
python-dotenv==1.0.1
pandas==2.2.0
numpy==1.26.3
jsonlines==4.0.0
pycoingecko==3.1.0
schedule==1.2.0
```

---

## ❌ Eksik/Gelecek Özellikler

### Şu An Çalışmayan
- **Gerçek işlem testi**: Henüz gerçek para ile test edilmedi
- **WebSocket fiyat güncellemesi**: Şu an polling kullanılıyor (30 saniye)
- **Backtesting**: UI kaldırıldı, bot'ta mevcut ama kullanılmıyor
- **Multi-timeframe analiz**: UI kaldırıldı, bot'ta mevcut

### Önerilen Eklemeler
1. **Stop Loss/Take Profit Görselleştirme**: Dashboard'da pozisyonların SL/TP seviyeleri
2. **Gerçek Zamanlı Fiyat Grafiği**: TradingView widget entegrasyonu
3. **Performans Raporları**: Haftalık/aylık PDF rapor oluşturma
4. **Telegram Bildirimleri**: Önemli olaylar için Telegram bot
5. **Paper Trading Modu**: Gerçek para kullanmadan test
6. **Risk Hesaplayıcı**: Pozisyon açmadan önce risk simülasyonu
7. **Pattern Görselleştirme**: Tespit edilen pattern'leri grafikte gösterme
8. **AI Karar Açıklaması**: LLM neden bu kararı verdi?

---

## 🐛 Bilinen Sorunlar

### Düzeltildi ✅
- ~~Settings API bağlantısı çalışmıyor~~ → Düzeltildi
- ~~Bakiye çekme çalışmıyor~~ → Düzeltildi
- ~~Risk hesaplama "bekleniyor" gösteriyor~~ → Düzeltildi
- ~~Vite cache error'ları~~ → Temizlendi

### Devam Eden
- **Bildirim dropdown**: Bazen tıklama çalışmıyor (cache sorunu)
- **Bot log viewer**: Çok hızlı log gelirse scroll bozulabiliyor

---

## 📝 Kullanım Notları

### Önemli Uyarılar
1. **İlk test küçük sermaye ile yapın** (örn: 100 USDT)
2. **Günlük kayıp limitini düşük tutun** (örn: %2-3)
3. **Bot'u 7/24 çalıştırmayın** - ilk hafta manuel kontrol edin
4. **Acil durdur butonunu bilin** - Dashboard header'da
5. **Log'ları takip edin** - ERROR keyword'ü önemli

### Performans Beklentileri
- **İlk hafta**: Öğrenme aşaması, düşük işlem sayısı beklenir
- **Hafta 2-3**: Pattern başarı oranı artacak
- **Hafta 4+**: Fine-tuned model devreye girecek
- **Hedef**: %60+ başarı oranı, %10+ aylık getiri

### Maliyet Tahmini
- **Binance işlem ücreti**: %0.02-0.04 (VIP seviyesine göre)
- **OpenAI fine-tuning**: ~$5-10/ay (haftalık fine-tuning)
- **Manus LLM**: Dahil (built-in API)
- **Toplam**: ~$10-15/ay (işlem ücretleri hariç)

---

## 🆘 Sorun Giderme

### Bot Başlamıyor
1. Settings → API Key kontrol et
2. "Bağlantıyı Test Et" → Başarılı mı?
3. Log viewer'da hata var mı?
4. Binance API yetkilerini kontrol et (Enable Futures)

### İşlem Açmıyor
1. Günlük limit doldu mu? (Dashboard'da kontrol et)
2. Bot aktif mi? (Toggle switch yeşil mi?)
3. Log'larda "OPPORTUNITY" keyword'ü var mı?
4. LLM yanıt veriyor mu? (Log'larda "LLM Decision")

### Bakiye Gösterilmiyor
1. Settings → API Key doğru mu?
2. "Bağlantıyı Test Et" → Bakiye gösteriyor mu?
3. Binance'de USDT var mı? (Futures cüzdanında)
4. Server yeniden başlat (cache sorunu olabilir)

### Bildirimler Gelmiyor
1. Database'de notification var mı? (SQL: `SELECT * FROM notifications`)
2. Log'larda "Notification sent" mesajı var mı?
3. Bildirim butonu tıklanabilir mi? (Sol alt köşe)
4. Server yeniden başlat

---

## 📞 Destek

Sorun yaşarsanız:
1. Log'ları kontrol edin (Dashboard → Log Viewer)
2. Database'i kontrol edin (Management UI → Database)
3. Server loglarını kontrol edin (`pnpm dev` çıktısı)
4. Bot loglarını kontrol edin (`ai_bot/logs/*.log`)

---

**Proje Durumu**: ✅ Kullanıma Hazır (Test Aşamasında)

**Son Güncelleme**: 30 Kasım 2024

**Geliştirici**: Manus AI Agent
