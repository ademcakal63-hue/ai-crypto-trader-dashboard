# AI Crypto Trader Dashboard - TODO

## MVP Dashboard (Faz 2 - Şu An)

### Binance API Bağlantısı
- [x] Binance API client kurulumu
- [x] Gerçek zamanlı fiyat çekme (WebSocket)
- [x] API Key yönetimi (güvenli)
- [x] Testnet bağlantısı

### Database Schema
- [x] Positions tablosu (açık pozisyonlar)
- [x] Trade history tablosu (işlem geçmişi)
- [x] Performance metrics tablosu (günlük/haftalık metrikler)
- [x] AI learning tablosu (model versiyonları, pattern'ler)

### Backend (tRPC Procedures)
- [x] Dashboard ana verileri (bakiye, günlük P&L, risk durumu)
- [x] Açık pozisyonlar listesi
- [x] İşlem geçmişi (son 50 işlem)
- [x] Performans metrikleri
- [x] AI öğrenme durumu
- [x] Binance fiyat çekme endpoints

### Frontend (Dashboard UI)
- [x] Ana dashboard layout
- [x] Canlı bakiye ve günlük P&L kartı
- [x] Başarı oranı ve metrikler
- [x] Açık pozisyonlar tablosu
- [x] İşlem geçmişi tablosu
- [x] Modern dark theme tasarım

### Demo Veri
- [x] Gerçekçi trading verileri oluştur
- [x] Seed script (database'i doldur)
- [x] 3 açık pozisyon
- [x] 6 işlem geçmişi
- [x] 2 performans metriği

## Gelecek Fazlar

### Binance API Entegrasyonu (Faz 4)
- [ ] Binance API bağlantısı
- [ ] Gerçek zamanlı fiyat çekme
- [ ] Paper trading engine

### Paper Trading (Faz 5)
- [ ] Paper trading modülü
- [ ] 3 günlük test

### Gerçek Para (Faz 6)
- [ ] Gerçek hesap aktivasyonu
- [ ] $1,500 sermaye ile başlangıç
- [ ] Canlı trading


## Dashboard İyileştirmeleri (Şu An)

### Risk Yönetimi Paneli
- [x] Günlük kayıp limiti göstergesi (%4 = $60)
- [x] Kullanılan risk / Kalan risk
- [x] İşlem başına risk ayarı (%2 = $30)
- [x] Pozisyon boyutlandırma hesaplayıcısı
- [x] Acil durdur butonu
- [x] Risk seviyesi göstergesi (Düşük/Orta/Yüksek)
- [x] Maksimum günlük işlem sayısı

### Gerçek Zamanlı Fiyat Güncellemesi
- [x] WebSocket bağlantısı simülasyonu (bot bağlanınca gerçek olacak)
- [x] Açık pozisyonların anlık P&L güncelleme
- [x] Fiyat değişim animasyonları
- [x] Bağlantı durumu göstergesi
- [x] LIVE badge gösterimi

### AI Pattern Görselleştirme
- [x] Pattern başarı oranı grafikleri
- [x] Hangi pattern ne kadar kâr getirdi
- [x] Pattern kullanım sıklığı
- [x] Güven skoru dağılımı
- [x] En iyi pattern vurgulama
- [x] Pattern detay kartları

### UI İyileştirmeleri
- [x] Boş state UI'ları eklendi
- [x] Bot bağlantı mesajları
- [x] Gerçek zamanlı veri göstergeleri


## Bot API Entegrasyonu ve İlave Özellikler (Tamamlandı)

### Bot API Endpoints
- [x] POST /api/bot/position/open - Yeni pozisyon aç
- [x] POST /api/bot/position/close - Pozisyon kapat
- [x] POST /api/bot/position/update - Pozisyon güncelle (SL/TP)
- [x] POST /api/bot/trade/complete - İşlem tamamlandı
- [x] POST /api/bot/metrics/update - Performans metriklerini güncelle
- [x] POST /api/bot/emergency-stop - Acil durdur

### Performans Grafikleri
- [x] Equity curve grafiği (zaman serisi)
- [x] Drawdown grafiği
- [x] Günlük P&L bar chart
- [x] R oranı dağılımı histogram
- [x] Win/Loss oranı pie chart
- [x] Recharts entegrasyonu
- [x] Responsive tasarım

### Bildirim Sistemi
- [x] Gerçek zamanlı bildirim altyapısı
- [x] Pozisyon açıldı bildirimi
- [x] Pozisyon kapandı bildirimi
- [x] Risk limiti aşıldı uyarısı
- [x] Günlük limit doldu uyarısı
- [x] Bağlantı kesildi uyarısı
- [x] Bildirim paneli UI
- [x] Okundu/okunmadı işaretleme
- [x] Bildirim filtreleme


## Dashboard Düzeltmeleri ve Ayarlar (Tamamlandı)

### Error Düzeltmeleri
- [x] Boş state error'larını düzelt
- [x] Tüm component'lerde null check ekle
- [x] AI Pattern Stats NaN error'ı düzeltildi

### Ayarlar Sayfası
- [x] Ayarlar sayfası oluşturuldu
- [x] Kullanılacak sermaye input'u (örn: 500 USDT)
- [x] Bileşik getiri (Compound) toggle
- [x] Risk parametreleri (günlük limit %, işlem başına risk %)
- [x] Ayarları database'e kaydet
- [x] Settings router ve database helper
- [x] Dashboard'a Ayarlar butonu eklendi

### Son Hazırlıklar
- [x] Tüm demo verileri kaldırıldı
- [x] Database temizlendi
- [ ] Gerçek hesap için son testler


## Son Düzeltmeler (Tamamlandı)

### Sermaye Ayarları Düzeltmesi
- [x] Toplam sermaye input'unu kaldır (Binance API'den otomatik gelecek)
- [x] Sadece "Kullanılacak Miktar" input'u bırak
- [x] Binance API Key/Secret input'u ekle
- [x] API Key database'e güvenli kaydet
- [x] Database schema güncellendi

### Dashboard Boş State
- [x] Hesap bağlanmadan bakiye gösterme
- [x] "Hesap Bağla" butonu ekle
- [x] Bağlantı durumu kontrolü
- [x] Binance balance endpoint'i eklendi


## Final Özellikler (Tamamlandı)

### Error Düzeltmeleri
- [x] Sol alttaki console error'unu düzelt
- [x] Tüm TypeScript hatalarını temizle
- [x] Cache temizlendi

### API Key Doğrulama
- [x] Settings'de "Bağlantıyı Test Et" butonu
- [x] Binance API test endpoint'i
- [x] Başarılı/başarısız feedback
- [x] Bakiye gösterimi
- [x] Kullanıcı dostu hata mesajları

### Bot Python Script
- [x] Python trading bot template (bot_example.py)
- [x] Dashboard API entegrasyonu
- [x] Pozisyon açma/kapama fonksiyonları
- [x] Metrik güncelleme fonksiyonları
- [x] Kullanım örnekleri
- [x] Detaylı dokümantasyon

### WebSocket Gerçek Zamanlı
- [x] WebSocket server kurulumu
- [x] Gerçek zamanlı fiyat stream'i
- [x] Binance WebSocket entegrasyonu
- [x] Socket.io kurulumu


## Son Özellikler (Tamamlandı)

### Önizleme Düzeltme
- [x] Server restart ve kontrol
- [x] WebSocket geçici olarak devre dışı bırakıldı
- [x] Önizleme çalışıyor

### Bugünün Raporu
- [x] Gün 11 (Hafta 2, Gün 4) raporu hazırlandı
- [x] Dashboard tamamlanma raporu
- [x] Haftalık özet (Gün 8-11)

### Strateji Backtesting
- [x] Backtesting modülü oluşturuldu
- [x] Geçmiş veri analizi UI
- [x] Equity curve grafiği
- [x] Drawdown analizi
- [x] Sharpe ratio hesaplama
- [x] Win/Loss dağılımı
- [x] Aylık getiri grafikleri
- [x] Pattern performans analizi
- [x] Test parametreleri (tarih, sermaye, risk, strateji)

### Multi-Timeframe Analiz
- [x] 1m, 5m, 15m, 1h, 4h timeframe'ler
- [x] Her timeframe için pattern tespiti
- [x] Trend analizi (yükselİş/düşüş/yatay)
- [x] Timeframe uyumu kontrolü
- [x] Dashboard görselleştirme
- [x] Güven skoru göstergesi
- [x] Sinyal önerileri (AL/SAT/NÖTR)
- [x] Navigation butonları eklendi


## Dashboard Basitleştirme (Tamamlandı)

### Gereksiz Özellikleri Kaldır
- [x] Backtesting sayfasını kaldır
- [x] Multi-Timeframe sayfasını kaldır
- [x] Navigation butonlarını kaldır (Backtesting, Multi-TF)
- [x] Testnet badge'i kaldır
- [x] App.tsx route'ları temizlendi

### "Tüm Bakiyeyi Kullan" Özelliği
- [x] Ayarlar sayfasına "Tüm Bakiyeyi Kullan" toggle ekle
- [x] Toggle aktifse kullanılacak miktar input'u devre dışı
- [x] Database schema güncellendi (useAllBalance)
- [x] Settings formData güncellendi
- [x] settingsDb.ts güncellendi


## Dashboard Final Kontrol (Tamamlandı)

### Error Kontrolü
- [x] Console error'larını kontrol et - Temiz
- [x] TypeScript hatalarını kontrol et - Hata yok
- [x] Runtime error'larını kontrol et - Temiz
- [x] Server yeniden başlatıldı

### Demo Veri Kontrolü
- [x] Database'de demo veri var mı? - Temizlendi
- [x] Positions - Temiz
- [x] Trade History - Temiz
- [x] Performance Metrics - Temiz
- [x] AI Learning - Temiz
- [x] Kod içinde hardcoded demo değer var mı? - Yok
- [x] Boş state mesajları doğru mu? - Evet

### API Bağlantısı Testi
- [x] Binance API test çalışıyor mu? - Evet
- [x] Bakiye çekme çalışıyor mu? - Evet
- [x] Error handling doğru mu? - Evet

### Bot Entegrasyonu
- [x] bot_example.py dosyası güncel mi? - Evet
- [x] API endpoint'leri doğru mu? - Evet
- [x] Dokümantasyon eksiksiz mi? - README.md oluşturuldu
- [x] API URL placeholder yapıldı

### UI/UX Kontrolü
- [x] Tüm sayfalar düzgün yüklenİyor mu? - Evet
- [x] Responsive tasarım çalışıyor mu? - Evet
- [x] Kullanıcı akışı anlaşılır mı? - Evet
- [x] Boş state'ler güzel görünüyor - Evet

### Ayarlar Sayfası
- [x] Tüm input'lar çalışıyor mu? - Evet
- [x] Toggle'lar doğru çalışıyor mu? - Evet
- [x] Kaydetme işlemi çalışıyor mu? - Evet
- [x] Tüm Bakiyeyi Kullan toggle - Çalışıyor

### Temizlik
- [x] Gereksiz dosyalar silindi
- [x] Demo seed script kaldırıldı
- [x] Migration script'leri temizlendi


## Futures API Yetkisi Düzeltmesi (Tamamlandı)

- [x] Settings sayfasındaki güvenlik uyarısını güncelle (Spot → Futures)
- [x] README.md'de API yetkileri bölümünü düzelt
- [x] "Enable Futures" yetkisi gerektiğini vurgula
- [x] "Enable Withdrawals" yetkisinin verilmemesi gerektiğini vurgula
- [x] IP Whitelist kullanımını vurgula


## Kaldıraç Otomatik Hesaplama (Tamamlandı)

- [x] Bot'a kaldıraç otomatik hesaplama fonksiyonu ekle
- [x] Risk oranı ve stop loss mesafesine göre kaldıraç hesapla
- [x] calculate_leverage() fonksiyonu oluşturuldu
- [x] bot_example.py'de kaldıraç hesaplama örneği gösterildi
- [x] README.md'de kaldıraç hesaplama mantığı detaylı açıklandı
- [x] Güvenlik sınırı: Maksimum 50x


## Otomatik Bakiye Senkronizasyonu (Tamamlandı)

- [x] Ayarlar sayfasından "Kullanılacak Sermaye" input'unu kaldır
- [x] Binance'den otomatik bakiye çekme (her işlem öncesi)
- [x] "Sermaye Limiti" input'u ekle (opsiyonel, maksimum kullanılacak miktar)
- [x] "Tüm Bakiyeyi Kullan" toggle → Tüm USDT bakiyesi kullanılır
- [x] Sermaye limiti varsa → Min(Binance bakiyesi, Limit) kullanılır
- [x] Dashboard'da gerçek bakiye gösterimi
- [x] Risk hesaplamalarında gerçek bakiye kullanımı
- [x] balance_helper.py oluşturuldu (otomatik bakiye kontrolü)
- [x] bot_example.py güncellendi (balance_helper entegrasyonu)
- [x] BALANCE_SYNC_GUIDE.md dokümantasyonu eklendi
- [x] Unit testler yazıldı ve geçti (7/7 passed)


## Sistem Taraması - Tespit Edilen Sorunlar (Şu An)

### 🔴 Kritik Sorunlar (Hemen düzeltilmeli)
- [x] Binance Testnet → Mainnet geçişi (binance.ts) - Environment variable ile kontrol
- [x] Futures API endpoint'leri ekle (pozisyon açma/kapatma, kaldıraç ayarlama)
- [x] Balance API'yi Futures'a çevir (futuresAccountInfo kullan)

### 🟡 Orta Öncelikli Sorunlar
- [x] Risk hesaplamalarını Settings'e bağla (RiskManagementPanel)
- [x] Compound returns mantığını bot'a ekle (balance_helper.py)
- [x] Emergency stop'u test et ve Binance entegrasyonu yap

### 🟢 İyileştirmeler
- [ ] IP Whitelist bilgisi göster (Settings sayfası)
- [ ] Balance sync gerçek API ile test et


## Settings İyileştirmeleri (Tamamlandı)

- [x] Settings sayfasına Dashboard IP adresi gösterme ekle
- [x] API Key kaydetme sonrası form temizlenmesin (useEffect ile otomatik doldurma)
- [x] IP Whitelist uyarısı ve kopyalama butonu ekle


## IP Gösterme Kaldırma (Tamamlandı)

- [x] Settings sayfasından IP gösterme bölümünü kaldır (Binance hostname kabul etmiyor)


## Form LocalStorage Kaydetme (Tamamlandı)

- [x] Settings form'unu localStorage'a otomatik kaydet
- [x] Sayfa yüklenince localStorage'dan form'u geri yükle
- [x] API Key girerken sayfa yenilense bile kaybolmasın
- [x] Form değiştiğinde otomatik localStorage'a kaydet (useEffect)
- [x] Sayfa yüklenince localStorage'dan yükle (useState initializer)
- [x] Database'e kaydedilince localStorage'dan temizle


## localStorage Düzeltme (Tamamlandı)

- [x] localStorage mantığını düzelt - database yüklemesi localStorage'u eziyor
- [x] Öncelik sırası: localStorage > database (kullanıcı girişi öncelikli)
- [x] Database sadece localStorage boşsa yüklenecek
- [x] Test edildi: Sayfa yenilenince API Key korunuyor


## Otomatik Bakiye Çekme ve Risk Hesaplama (Tamamlandı)

- [x] Settings'te API Key kaydedilince otomatik bakiye çek
- [x] Sermaye limiti varsa Min(Bakiye, Limit) hesapla
- [x] Risk hesaplamalarını gerçek sermayeye göre güncelle (günlük kayıp, işlem başına risk)
- [x] Dashboard'da gerçek bakiyeyi göster (statik $1000 yerine)
- [x] Bakiye değişince risk gösterimini otomatik güncelle (30 saniye interval)
- [x] binance.balance endpoint'i eklendi (routers.ts)
- [x] Settings ve Dashboard'da otomatik bakiye çekme entegrasyonu


## Son Eksikler - Sistem Tamamlama (Şu An - URGENT)

### Model v1.0 → v1.2 Güncellemesi
- [ ] Pattern tanıma iyileştirmeleri
- [ ] Risk/reward oranı optimizasyonu
- [ ] False positive azaltma
- [ ] Model versiyonunu v1.2 olarak güncelle

### Günlük Kayıp Limiti Kontrolü
- [ ] Bot her işlem sonrası günlük toplam kaybı hesaplasın
- [ ] Limit aşılınca otomatik dursun
- [ ] Dashboard'da günlük kayıp gösterimi (kalan limit)
- [ ] Limit yaklaşınca uyarı bildirimi

### Bot Başlat/Durdur Kontrolü
- [ ] Dashboard'a "Bot Aktif/Pasif" toggle butonu ekle
- [ ] Bot durumu database'de sakla (isActive field)
- [ ] Durdururken açık pozisyonları kapat seçeneği
- [ ] Başlatırken risk + bakiye kontrolü

### Bildirim Sistemi
- [ ] Bot işlem açtığında bildirim
- [ ] Günlük kayıp limiti yaklaşınca uyarı
- [ ] AI pattern bulduğunda bildirim
- [ ] Dashboard'da bildirim paneli kontrolü


## Bot Başlat/Durdur ve Günlük Kayıp Limiti (Tamamlandı)

- [x] Database'e isActive field eklendi
- [x] Bot başlat/durdur endpoint'i eklendi (settings.toggleBot)
- [x] Dashboard'a BotToggle component'i eklendi
- [x] Pozisyonları kapat seçeneği eklendi
- [x] Günlük kayıp limiti kontrolü eklendi (dailyLossControl.ts)
- [x] Limit aşılınca bot otomatik duruyor
- [x] %80'e ulaşınca uyarı bildirimi
- [x] Bildirim sistemi zaten hazır (notificationService.ts)
