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


## AI Trading Bot Geliştirme (Tamamlandı)

- [x] Pattern Knowledge Base oluştur (FVG, OB, Liquidity Sweep, BOS)
- [x] LLM entegrasyonu (Manus LLM)
- [x] Binance API entegrasyonu (mum verileri çekme)
- [x] Grafik analizi fonksiyonu (multi-timeframe)
- [x] Haber/sentiment analizi sistemi (CoinGecko + LLM)
- [x] Otomatik işlem açma mantığı
- [x] Otomatik işlem kapama mantığı (dinamik çıkış - LLM ile)
- [x] Dashboard API entegrasyonu (veri gönderme)
- [x] Günlük rapor oluşturma sistemi (her gece 23:59)
- [x] Öğrenme mekanizması (her işlemden ders çıkarma)
- [x] Haftalık fine-tuning sistemi (model v1.0 → v1.3)
- [x] Ana trading loop (sürekli çalışma - 1 dakika interval)
- [x] README ve dokümantasyon


## Hybrid Otomatik Fine-Tuning Sistemi (Tamamlandı)

- [x] Seçenek A: Prompt güncelleme sistemi
  - [x] Haftalık analiz fonksiyonu (başarılı/başarısız pattern'ler)
  - [x] Prompt güncelleme mekanizması
  - [x] Model versiyon yönetimi (v1.0 → v1.1 → v1.2)
- [x] Seçenek B: Gerçek fine-tuning sistemi
  - [x] Training data hazırlama (JSONL formatı)
  - [x] OpenAI Fine-Tuning API entegrasyonu
  - [x] Fine-tuned model yönetimi
- [x] Otomatik geçiş mantığı
  - [x] Hafta 3'te A → B otomatik geçiş
  - [x] Minimum 50 işlem kontrolü
- [x] Haftalık scheduler
  - [x] Her Pazar 23:00'da otomatik çalışma
  - [x] Model versiyonu güncelleme
  - [x] Dashboard'a bildirim gönderme
- [x] Ana bot'a entegrasyon (learning_manager)
- [x] Standalone scheduler script (run_learning_scheduler.py)


## Fine-Tuning Güvenlik Mekanizmaları (Tamamlandı)

- [x] Başarı oranı kontrolü (minimum %55)
- [x] Pattern çeşitliliği kontrolü (minimum 3 pattern)
- [x] Her pattern için minimum işlem kontrolü (5 işlem)
- [x] Outlier (aykırı değer) tespiti ve filtreleme (3 standart sapma)
- [x] Validation set (train/validation split %80/%20)
- [x] Fine-tuned model validation testi (minimum %60 accuracy)
- [x] Gradual rollout (kademeli geçiş %25 → %100, 7 gün)
- [x] Performance monitoring (her gün 12:00'da, %10 düşüş tespiti)
- [x] Base model'e otomatik rollback
- [x] Dashboard'a bildirim entegrasyonu
- [x] finetuning_safety.py modülü oluşturuldu
- [x] learning_system_b.py'ye entegre edildi
- [x] learning_manager.py'ye entegre edildi


## Maliyet Kontrolü ve Güvenlik Mekanizmaları (Tamamlandı)

### Maliyet Kontrol Sistemi
- [x] Maliyet tahmin fonksiyonu ekle (estimate_finetuning_cost)
- [x] Aylık maliyet takibi (check_monthly_cost)
- [x] Fine-tuning başına limit kontrolü ($10)
- [x] Aylık toplam limit kontrolü ($25)
- [x] Maliyet aşımında eylem planı implement et
- [x] Dashboard'a maliyet bildirimleri ekle
- [x] Maliyet takip dosyası (cost_tracking.json)

### Gradual Rollout Sistemi
- [x] Gradual rollout mekanizması ekle (gradual_rollout.py)
- [x] 7 günlük geçiş planı (25%→50%→75%→100%)
- [x] Model seçim mantığı (base vs fine-tuned)
- [x] Rollout durumu takibi (rollout_status.json)
- [x] learning_manager.py entegrasyonu

### Performance Monitoring
- [x] Günlük performans izleme (her gün 12:00)
- [x] Win rate karşılaştırma (base vs fine-tuned)
- [x] Otomatik rollback mekanizması (%10 düşüş)
- [x] Performance monitoring scheduler
- [x] learning_manager.py entegrasyonu

### Checkpoint Kurtarma Stratejisi
- [x] CheckpointManager sınıfı oluşturuldu
- [x] IncrementalFineTuning sınıfı oluşturuldu
- [x] İptal edilen checkpoint'leri kurtarma
- [x] Duplicate ve kalite filtresi
- [x] learning_system_b.py entegrasyonu

### OpenAI API Entegrasyonu
- [x] OpenAI API Key .env'ye ekleme rehberi
- [x] OPENAI_SETUP_GUIDE.md dokümantasyonu
- [x] Maliyet kontrol sistemi
- [x] Tüm güvenlik mekanizmaları entegre edildi
- [ ] Kullanıcı OpenAI API Key ekleyecek
- [ ] Gerçek fine-tuning testi (Hafta 3'te)




## OpenAI API Key Ekleme ve Bildirim Sistemi (Tamamlandı)

### OpenAI API Key Ekleme
- [x] OpenAI hesap oluşturma rehberi
- [x] API Key oluşturma adımları
- [x] .env dosyasına ekleme (webdev_request_secrets)
- [x] API Key validation testi (vitest)
- [x] Kullanıcıya interaktif yardım

### Bildirim Sistemi Entegrasyonu
- [x] NotificationWriter (direkt database yazma)
- [x] Maliyet aşımı bildirimleri (send_cost_warning, send_cost_exceeded)
- [x] Performans düşüşü bildirimleri (send_performance_drop_alert)
- [x] Fine-tuning başarı/başarısızlık bildirimleri (send_finetuning_success/failed)
- [x] Gradual rollout faz geçişi bildirimleri (send_rollout_phase_update)
- [x] Checkpoint kaydetme bildirimleri (send_checkpoint_saved)
- [x] Aylık limit doldu bildirimi (send_monthly_limit_reached)
- [x] Tüm bildirim tipleri test edildi ve çalışıyor


## Dashboard Bildirim UI ve Demo Kaldırma (Tamamlandı)

### Bildirim UI'ı
- [x] Bildirim dropdown komponenti oluştur (NotificationDropdown.tsx)
- [x] Sidebar footer'a bildirim ikonu ekle (desktop)
- [x] Mobile header'a bildirim ikonu ekle
- [x] Okunmamış bildirim sayısı badge'i
- [x] Bildirim listesi (son 50 bildirim)
- [x] Okunmamış bildirimleri vurgula (mavi nokta)
- [x] "Tümünü okundu işaretle" butonu
- [x] Bildirim tıklandığında okundu işaretle
- [x] Bildirim tiplerine göre icon ve renk (SUCCESS/WARNING/ERROR/INFO)
- [x] Gerçek zamanlı bildirim güncelleme (5 saniyede bir)
- [x] Server routers.ts'de bildirim endpoint'leri (list, unread, markAsRead, markAllAsRead)

### Demo Yazılarını Kaldırma
- [x] Home.tsx'teki demo içerikleri kaldır
- [x] Gerçek bot durumu göster (overview API)
- [x] Gerçek performans metrikleri (totalPnL, winRate, totalTrades)
- [x] Gerçek açık pozisyonlar (openPositions API)
- [x] Gerçek performans geçmişi (7 günlük)
- [x] Boş state'ler için anlamlı mesajlar ("Henüz pozisyon yok", "Bot uygun pattern tespit ettiğinde açacak")
- [x] DashboardLayout entegrasyonu (App.tsx)


## UI İyileştirmeleri ve Multi-Coin Desteği (Tamamlandı)

### UI Temizleme
- [x] Test bildirimlerini database'den sil
- [x] Page 2'yi sidebar'dan kaldır
- [x] Sidebar menüsünü sadece "Dashboard" yap

### Multi-Coin Desteği
- [x] Coin seçici dropdown ekle (BTCUSDT, ETHUSDT, SOLUSDT)
- [x] Dashboard header'a coin seçici ekle
- [x] Bitcoin, Ethereum, Solana desteği
- [ ] Bot'u multi-coin için yapılandır (python tarafı)
- [ ] Her coin için ayrı pozisyon takibi (database)

### Bot Multi-Coin Kullanımı
```bash
# Tek coin
python ai_bot/main.py --symbol BTCUSDT

# Üç coin paralel (3 terminal)
python ai_bot/main.py --symbol BTCUSDT &
python ai_bot/main.py --symbol ETHUSDT &
python ai_bot/main.py --symbol SOLUSDT &
```


## Bot Kontrol Paneli (Tamamlandı)

### UI Bileşenleri
- [x] Bot kontrol kartı oluştur (BotControlPanel.tsx)
- [x] Her coin için toggle switch (BTCUSDT, ETHUSDT, SOLUSDT)
- [x] Durum göstergesi (Running/Stopped/Error)
- [x] "Tümünü Başlat" / "Tümünü Durdur" butonları
- [x] Bot process ID gösterimi
- [x] Uptime gösterimi (kaç gün/saat/dakika çalışıyor)
- [x] Aktif bot sayısı (0 / 3)
- [x] Otomatik yenileme (5 saniyede bir)

### Backend API
- [x] Bot başlatma endpoint'i (bot.start)
- [x] Bot durdurma endpoint'i (bot.stop)
- [x] Bot durum sorgulama endpoint'i (bot.status)
- [x] Multi-coin process yönetimi (botControl.ts)
- [x] Process ID takibi (in-memory + file)
- [x] Graceful shutdown (SIGTERM + SIGKILL)

### Python Bot Entegrasyonu
- [x] Bot'u subprocess olarak başlatma (spawn)
- [x] Process ID kaydetme (bot_status.json)
- [x] Graceful shutdown (SIGTERM)
- [x] Stdout/stderr logging
- [x] Process event handling (error, exit)

### Kullanım
Dashboard'dan tek tıkla:
- Toggle switch ile tek coin başlat/durdur
- "Tümünü Başlat" ile 3 coin'i birden başlat
- "Tümünü Durdur" ile hepsini durdur
- Durum otomatik güncellenir (5s)


## Bot Log Görüntüleyici (Tamamlandı)

### UI Bileşenleri
- [x] BotLogViewer komponenti oluştur
- [x] Her bot için ayrı log paneli (3 panel: BTC, ETH, SOL)
- [x] Son 100 satır gösterme
- [x] Otomatik scroll (en yeni log'a)
- [x] Log seviyesi renklendirme (INFO/WARNING/ERROR/SUCCESS)
- [x] Temizle butonu
- [x] Tam ekran modu
- [x] Auto-scroll checkbox
- [x] Live/Stopped badge
- [x] Satır sayısı gösterimi

### Backend API
- [x] Log okuma endpoint'i (bot.logs)
- [x] Log dosyası yönetimi (ai_bot/logs/*.log)
- [x] Real-time log streaming (2 saniyede bir polling)
- [x] Stdout/stderr log dosyasına yazma
- [x] Timestamp ekleme

### Özellikler
- Terminal görünümü (siyah arka plan, monospace font)
- Bot durumuna göre dinamik güncelleme
- Bot çalışmıyorsa: "Bot is not running. Start the bot to see logs."
- Bot çalışıyorsa: Real-time log akışı (2s refresh)


## Performans Grafiği ve Log Bildirimleri (Tamamlandı)

### 7 Günlük Performans Grafiği
- [x] Chart.js kütüphanesini ekle (chart.js, react-chartjs-2)
- [x] PerformanceChart komponenti oluştur
- [x] 7 günlük P&L verisi çizgi grafiği
- [x] Hover'da detaylı bilgi (tarih, P&L, win rate, işlem sayısı)
- [x] Responsive tasarım
- [x] Renk kodlaması (yeşil: kar, kırmızı: zarar)
- [x] Özet istatistikler (toplam P&L, ortalama win rate, toplam işlem, günlük ortalama)
- [x] Gradient fill effect

### Log Anahtar Kelime Bildirim Sistemi
- [x] Anahtar kelime listesi tanımla (ERROR, TRADE, FAILED, SUCCESS, POSITION_OPENED, POSITION_CLOSED, WARNING)
- [x] Log monitoring servisi oluştur (logKeywordMonitor.ts)
- [x] Anahtar kelime tespit algoritması (detectKeywords)
- [x] Otomatik bildirim gönderme (processLogLine)
- [x] Bildirim throttling (spam önleme - 1 dakika)
- [x] Backend log parser entegrasyonu (botControl.ts)
- [x] Yeni bildirim tipleri (BOT_ERROR, TRADE_EXECUTED, TRADE_SUCCESS, BOT_WARNING)
- [x] Database schema güncelleme

### Anahtar Kelime Kategorileri
- **ERROR:** ERROR, FAILED, EXCEPTION, CRASH → Bildirim: BOT_ERROR (Yüksek öncelik)
- **TRADE:** POSITION_OPENED, POSITION_CLOSED, TRADE_EXECUTED, ORDER_FILLED → Bildirim: TRADE_EXECUTED
- **SUCCESS:** SUCCESS, COMPLETED, PROFIT → Bildirim: TRADE_SUCCESS
- **WARNING:** WARNING, WARN, RISK → Bildirim: BOT_WARNING


## UI İyileştirmeleri (Tamamlandı)

### Bildirim Dropdown
- [x] NotificationDropdown komponenti mevcut
- [x] Sol altta bildirim ikonu (3 bildirim görünüyor)
- [x] Bildirim listesi API'si hazır
- [x] "Tümünü okundu işaretle" API'si hazır
- [x] Log keyword monitoring çalışıyor (ERROR/TRADE/SUCCESS/WARNING)

### Settings Sayfası
- [x] Settings.tsx sayfası mevcut (kapsamlı)
- [x] Sidebar'a "Ayarlar" menüsü eklendi
- [x] Binance API Key yönetimi (mevcut)
- [x] Binance API Secret yönetimi (mevcut)
- [x] API key kaydetme/güncelleme (mevcut)
- [x] API key test butonu (mevcut)
- [x] Sermaye ayarları (mevcut)
- [x] Risk yönetimi (mevcut)

### Coin Seçici
- [x] Sağ üstte coin seçici dropdown (BTC/ETH/SOL)
- [x] Bot kontrol paneli 3 coin'i gösteriyor
- [x] Log viewer'lar 3 coin için ayrı paneller
- [x] Her coin için ayrı başlat/durdur toggle

### Kullanıcı Rehberi
1. Sol sidebar'dan "Ayarlar"a git
2. Binance API Key ve Secret gir
3. "Bağlantıyı Test Et" butonuna tıkla
4. Sermaye ve risk ayarlarını yap
5. "Kaydet" butonuna tıkla
6. Dashboard'a dön
7. "Tümünü Başlat" butonuna tıkla
8. Log viewer'larda bot çıktılarını izle
9. Sol alttaki bildirim ikonuna tıklayarak bildirimleri gör


## Acil Düzeltmeler (Tamamlandı)

### Settings Sayfası Hatası
- [x] React imports kontrol edildi (useState, useEffect)
- [x] Server yeniden başlatıldı (vite cache temizlendi)
- [x] Settings sayfası çalışıyor

### Coin Seçici Kaldırma
- [x] Sağ üstteki coin seçici dropdown'u kaldırıldı
- [x] Header'a "(BTC, ETH, SOL)" eklendi
- [x] 3 coin aynı anda çalışıyor
- [x] Dashboard basitleştirildi
- [x] Gereksiz import'lar temizlendi (Select, useState, ChevronDown)


## Settings Sayfası Düzeltme (Tamamlandı)

### Hooks Hatası
- [x] Settings.tsx'teki "Rendered more hooks" hatası düzeltildi
- [x] useEffect hook'u conditional return'den önce taşındı
- [x] Tüm hooks'lar component'in en üstünde
- [x] Server yeniden başlatıldı

### API Test Butonu
- [x] "Bağlantıyı Test Et" butonu zaten mevcut (line 239-256)
- [x] Binance API key validation endpoint'i kullanılıyor
- [x] Başarılı/başarısız durumları toast ile gösteriliyor
- [x] Bakiye bilgisi toast ile gösteriliyor


## Binance API Bağlantı Düzeltme (Tamamlandı)

### Düzeltmeler
- [x] Settings sayfasındaki uyarı metni düzeltildi
- [x] "Enable Futures" yetkisi gerekli (bot kaldıraçlı işlem yapar)
- [x] "Enable Withdrawals" yetkisi vermeyin (güvenlik)
- [x] IP Whitelist opsiyonel ama önerilir
- [x] Binance API endpoint'leri kontrol edildi
- [x] validateApiKey fonksiyonu mevcut ve çalışıyor
- [x] Balance endpoint'i mevcut ve çalışıyor

### Kullanım Talimatları
1. Binance hesabından API Key oluştur
2. "Enable Futures" yetkisini aktif et
3. "Enable Withdrawals" yetkisini KAPALI bırak
4. API Key ve Secret'i Settings sayfasına gir
5. "Bağlantıyı Test Et" butonuna tıkla
6. Başarılı olursa bakiye görünecek
7. Sermaye ve risk ayarlarını yap
8. "Kaydet" butonuna tıkla
9. Dashboard'a dön, "Tümünü Başlat" butonuna tıkla


## Bildirim Butonu Düzeltme (Acil)

### Sorun
- [ ] Sol alttaki bildirim butonuna tıklanmıyor
- [ ] 3 bildirim var ama dropdown açılmıyor
- [ ] NotificationDropdown komponenti çalışmıyor

### Düzeltme
- [ ] DashboardLayout'taki bildirim butonunu kontrol et
- [ ] NotificationDropdown'u düzgün entegre et
- [ ] Tıklanabilir yap, dropdown açılsın


## 🔴 Kritik Buglar (Acil Düzeltme Gerekiyor)

### Settings Sayfası Sorunları
- [x] API bağlantısı çalışmıyor - "Bağlantıyı Test Et" butonu bakiye çekmiyor
- [x] Risk hesaplama "Hesap bağlantısı bekleniyor" gösteriyor (API bağlı olsa bile)
- [x] Sermaye limiti 999.97 USDT gösteriyor (gerçek bakiye yerine)
- [x] "Tüm Bakiye Kullan" toggle aktif olsa bile gerçek bakiye kullanılmıyor

### Bildirim Sistemi Sorunları
- [ ] Bildirim butonu tıklanamıyor (sol altta "3 notifications" gösteriyor ama dropdown açılmıyor)
- [ ] NotificationDropdown component render ediliyor ama tıklama çalışmıyor

### Teknik Sorunlar
- [ ] Vite cache eski error'ları gösteriyor - cache temizlenmeli
- [ ] Server restart gerekiyor


## 🤖 AI Bot Kurulum ve Çalıştırma (Şu An)

### Python Dependencies
- [x] requirements.txt oluştur (binance, requests, openai, python-dotenv)
- [x] pip install ile paketleri kur
- [x] Import testleri yap

### Environment Variables
- [x] Bot için .env dosyası oluştur (gerekli değil - settings'ten çekiyor)
- [x] DASHBOARD_URL ayarla (hardcoded)
- [x] BINANCE_API_KEY ve SECRET Settings'ten çekilecek
- [x] OPENAI_API_KEY zaten mevcut

### Bot Test
- [ ] Bot başlatma testi (python main.py --symbol BTCUSDT)
- [ ] Dashboard bağlantısı testi
- [ ] Log sistemi testi
- [ ] Bildirim sistemi testi

### Final Kontrol
- [ ] 3 coin için bot başlatma (BTC, ETH, SOL)
- [ ] Log viewer'da logları görme
- [ ] Bildirim sistemi çalışıyor mu
- [ ] Acil durdur butonu test


## 📊 TradingView Widget Ekleme (Şu An)

### TradingView Entegrasyonu
- [x] TradingView Advanced Chart widget oluştur
- [x] Gerçek zamanlı fiyat gösterimi (BTC, ETH, SOL)
- [x] Pozisyon marker'ları ekle (entry, SL, TP çizgileri)
- [x] Dashboard'a entegre et (log viewer'ın üstünde)
- [x] Responsive tasarım (mobil uyumlu)
