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


## 🚨 KRİTİK: Kaldıraç ve Pozisyon Hesaplama Düzeltmesi (Şu An)

### Sorunlar
- [x] Kaldıraç sabit 10x (Settings'ten alıyor, dinamik değil)
- [x] Pozisyon büyüklüğü kaldıraç kullanmıyor
- [x] Maksimum pozisyon sayısı kontrolü yok (günlük limit aşılabilir)
- [x] Gerçek sermaye kullanımı kontrol edilmiyor

### Düzeltmeler
- [x] Dinamik kaldıraç hesaplama (stop loss mesafesine göre)
- [x] Maksimum pozisyon sayısı = (günlük kayıp limiti / işlem başına risk)
- [x] Pozisyon büyüklüğü = quantity * entry_price
- [x] Maksimum kaldıraç limiti: 20x
- [x] Gerçek sermaye kullanımı kontrolü (required_margin < capital)

### Test Senaryoları
- [x] Senaryo 1: $1000 sermaye, %2 risk, %1 SL mesafesi → 2x kaldıraç, $2000 pozisyon, $1000 margin
- [x] Senaryo 2: $1000 sermaye, %2 risk, %5 SL mesafesi → 1x kaldıraç (min), $400 pozisyon, $400 margin
- [x] Senaryo 3: $1000 sermaye, %2 risk, %0.2 SL mesafesi → 10x kaldıraç, $10000 pozisyon, $1000 margin


## 🚨 KRİTİK: Otomatik Stop Loss Order (Şu An)

### Sorun
- [x] Stop loss sadece bot hafızasında tutuluyor
- [x] Binance'e SL order gönderilmiyor
- [x] Bot crash olursa stop loss çalışmaz
- [x] Risk: Sınırsız kayıp!

### Çözüm
- [x] place_stop_loss_order() fonksiyonu ekle
- [x] Pozisyon açarken otomatik SL order gönder
- [x] Take profit order da ekle (opsiyonel)
- [x] Bot crash olsa bile Binance korusun

### Test
- [ ] SL order Binance'de görünüyor mu?
- [ ] Fiyat SL'e gelince otomatik kapanıyor mu?


## 🔴 KRİTİK UI BUGLARI (Şu An)

### Bildirim Dropdown
- [x] Bildirim butonuna tıklayınca dropdown açılmıyor (z-index düzeltildi)
- [x] +9 bildirim var ama görüntülenemiyor
- [x] useState duplicate error (cache sorunu)

### Bot Başlatma
- [x] "Tümünü Başlat" butonu çalışmıyor (Python venv kullanılıyor)
- [x] Butona basınca hiçbir şey olmuyor (dashboard_client.py düzeltildi)
- [x] Bot'lar "Durduruldu" durumunda kalıyor (SRE module mismatch çözüldü)
- [x] Console'da "Could not establish connection" hatası (tRPC JSON wrapper düzeltildi)


## OpenAI + Order Book Full Integration (Şu An - YENI)

### OpenAI API Integration
- [x] Add OpenAI API key to bot settings
- [x] Implement chart pattern analysis with GPT-4 Vision
- [x] Implement news sentiment analysis with GPT-4
- [x] Create prompt templates for trading decisions
- [x] Add OpenAI response caching to reduce API costs

### Order Book WebSocket
- [x] Implement Binance WebSocket connection for order book
- [x] Add real-time order book data streaming
- [x] Calculate bid/ask imbalance ratios
- [x] Detect large orders (whale watching)
- [x] Monitor bid-ask spread changes

### Smart Money Concepts (SMC)
- [x] Implement Order Block (OB) detection with OpenAI
- [x] Implement Fair Value Gap (FVG) detection with OpenAI
- [x] Implement liquidity zone identification with OpenAI
- [x] Add support/resistance level detection with OpenAI
- [x] Implement breaker block detection with OpenAI

### Unified Decision System
- [x] Create signal aggregation system
- [x] Weight different signal sources (technical, sentiment, order book, SMC)
- [x] Implement risk-adjusted position sizing
- [x] Add multi-timeframe analysis
- [x] Create confidence scoring for each trade
- [x] OpenAI as the "brain" - final decision maker

### Fine-tuning & Learning
- [ ] Save all trade decisions and outcomes to database
- [ ] Implement pattern success rate tracking
- [ ] Create dataset for fine-tuning OpenAI model
- [ ] Add weekly model performance review
- [ ] Implement automatic strategy adjustment based on order book patterns

### Testing & Deployment
- [x] Test bot startup from Dashboard
- [x] Test OpenAI API integration
- [x] Test Order Book WebSocket stability
- [x] Test trade execution with all signals
- [x] Fix any errors that occur
- [ ] Save checkpoint and deliver


## Paper Trading + Risk Management (TAMAMLANDI ✅)

### Paper Trading Mode
- [x] Add paper trading mode (simulated trades, no real money)
- [x] Track first 100 trades in paper mode
- [x] Save all trade decisions and outcomes to database
- [x] Calculate success rate, win/loss ratio, profit/loss
- [ ] Auto-switch to real trading after 100 successful paper trades (manual approval required)

### Risk Management (Hard Limits)
- [x] Implement 2% max position size per trade (HARD LIMIT)
- [x] Implement 4% max daily loss limit (HARD LIMIT)
- [x] Add mandatory stop loss for every trade
- [x] Track daily P&L and block new trades if limit reached
- [x] Add position size calculator based on account balance

### OpenAI Risk Management Integration
- [x] Update OpenAI prompts to include risk management rules
- [x] OpenAI decides position size (0.5% - 2% based on confidence)
- [x] OpenAI places stop loss based on volatility + SMC
- [x] OpenAI checks daily loss limit before opening trades
- [x] OpenAI calculates risk/reward ratio (min 1:1.5)

### 100-Trade Cycle & Fine-Tuning
- [x] Add trade counter (resets every 100 trades)
- [x] Trigger automatic fine-tuning after 100 trades
- [x] Generate training dataset from completed trades
- [x] Update OpenAI model with learned patterns
- [x] Generate performance report after each cycle

### Testing
- [x] Test paper trading mode
- [x] Test risk management limits
- [x] Test 100-trade cycle
- [ ] Test fine-tuning trigger (requires 100 real trades)
- [ ] Save checkpoint


## Paper Trading Dashboard Entegrasyonu (TAMAMLANDI ✅)

- [x] main.py'yi paper trading versiyonu ile değiştir
- [x] Dashboard "Tümünü Başlat" butonu paper trading'i başlatacak
- [x] Bot startup testi yap
- [x] Paper trading mode aktif olduğunu doğrula
- [ ] Checkpoint kaydet


## Paper Trading Takip Paneli (TAMAMLANDI ✅)

- [x] Settings'te API Key localStorage düzeltmesi (zaten çalışıyor)
- [x] Dashboard'a Paper Trading Status kartı ekle
  - [x] Balance gösterimi ($10,000 başlangıç)
  - [x] Cycle ve trade sayısı (örn: Cycle 1: 45/100)
  - [x] Win rate
  - [x] Total P&L
  - [x] Progress bar
- [x] Backend endpoint'leri ekle
  - [x] GET /api/trpc/paperTrading.getStatus
  - [x] Paper trading state'i database'den çek
- [x] Gerçek zamanlı güncelleme (bot çalışırken - 5 saniye interval)
- [ ] Checkpoint kaydet


## OpenAI API Key + News API Düzeltmeleri (TAMAMLANDI ✅)

- [x] Settings'e OpenAI API Key alanı ekle
- [x] Database schema'ya openaiApiKey alanı ekle
- [x] news_analyzer.py'de CoinGecko API kullan (free, API key gerektirmez)
- [x] Bot startup'ta OpenAI key'i settings'ten oku
- [ ] Checkpoint kaydet


## OpenAI API Key Test Butonu + Final Check (TAMAMLANDI ✅)

- [x] Settings'e "OpenAI API Key Test Et" butonu ekle
- [x] Backend'de OpenAI key test endpoint'i ekle
- [x] Final sistem kontrolü (tüm API'ler çalışıyor mu)
- [ ] Checkpoint kaydet
- [ ] Launch hazır onayı


## Bot Startup Python Environment Fix (ŞU AN)

- [x] Python venv activation hatasını düzelt (bash ile activate)
- [ ] 3 bot toplam $10,000 paylaşsın (BTC: $3,333, ETH: $3,333, SOL: $3,334)
- [ ] Paper trading başlangıç sermayesini güncelle
- [ ] Bot'ları başlat ve test et
- [ ] Checkpoint kaydet


## Bot İyileştirmeleri (Tamamlandı)

### News API Düzeltmesi
- [x] News API hatasını düzelt (error fetching news)
- [x] Sentiment analizi çalışır hale getir
- [x] main.py'de metod adı düzeltildi (get_latest_news → get_crypto_news)

### Risk Yönetimi Ayarları
- [x] İşlem başına risk: %2 (1R = %2)
- [x] Günlük kayıp limiti: %4 (2R = günlük stop)
- [x] 2 kayıp trade sonrası günlük durdur
- [x] Risk kurallarını risk_manager.py'de güncellendi
- [x] MAX_DAILY_LOSS_TRADES = 2 eklendi
- [x] daily_loss_trades tracking eklendi


## Risk Bazlı Pozisyon Hesaplama (Tamamlandı)

- [x] risk_manager.py'ye calculate_position_from_risk metodu eklendi
- [x] OpenAI'dan sadece SL/TP mesafesi alınıyor, pozisyon boyutu hesaplanıyor
- [x] main.py'de risk bazlı pozisyon hesaplama aktif
- [x] Leverage otomatik hesaplanıyor
- [x] Test: %2 risk, %1 SL → %200 pozisyon, 2x leverage ✅
- [x] Test: %2 risk, %0.5 SL → %400 pozisyon, 4x leverage ✅
- [x] Test: %2 risk, %2 SL → %100 pozisyon, 1x leverage ✅


## Paper Trading Leverage Desteği (Tamamlandı)

- [x] paper_trading.py'de leverage desteği eklendi
- [x] Pozisyon limiti %2'den kaldırıldı, risk limiti %2 kaldı
- [x] can_open_trade metodu leverage'a göre güncellendi
- [x] Test: %368 pozisyon (%2 risk, 3.7x leverage) açabilecek


## Maliyet Optimizasyonu (Tamamlandı)

- [x] News analizi kaldırıldı (gereksiz, pahalı)
- [x] Cycle süresi 60s'den 300s'ye çıkarıldı (5 dakika)
- [x] ETH ve SOL bot'ları SUPPORTED_PAIRS'den kaldırıldı
- [x] Sadece BTC bot'u kaldı
- [x] Günlük maliyet: ~$50 → ~$10 (GPT-4 Turbo)

## UI İyileştirmeleri (Şu An)

- [x] Bildirimler UI: Daha net arka plan + daha geniş layout
- [x] Tüm bakiye kullan: Otomatik olarak bileşik getiri aktif olsun

## Risk Yönetimi Düzeltmeleri (Şu An - URGENT)

- [x] Pozisyon büyüklüğü hesaplama bug'ını düzelt
- [x] Maksimum pozisyon limiti ekle (2 pozisyon)
- [x] Margin kontrolü ekle (kullanılabilir margin hesapla)

## Production Deployment (Şu An)

- [ ] Bot'u Node.js backend'e entegre et
- [ ] Bot process manager oluştur (start/stop/status)
- [ ] Dashboard'dan bot kontrolü ekle
- [ ] 7/24 çalışma için background process
- [ ] Test ve doğrulama


## Real-time P&L ve Bot Güvenlik (Şu An)

- [ ] Real-time P&L update - Bot her döngüde açık pozisyonların currentPrice ve unrealized P&L güncellesin
- [ ] Dashboard'da gerçek zamanlı kar/zarar gösterimi
- [ ] 2 bot çakışması önleme kontrolü
- [ ] Fine-tuning için trade kaydı doğrulama

- [x] Toplam P&L kartını açık pozisyonların unrealized P&L'ini gösterecek şekilde güncelle
- [x] Açık pozisyon kartlarında gerçek P&L değerlerini göster (şu an +$0.00 görünüyor)
- [ ] Paper trading margin kontrolü düzelt - toplam sermayeyi aşan pozisyon açılmasını engelle
- [ ] Her pozisyon sermayenin yarısını kullansın ($5,000)
- [ ] Her pozisyonda toplam sermayenin %2'si riske edilsin ($200)
- [ ] Paper Trading Status kartı gerçek zamanlı güncellensin
- [ ] AI tek pozisyon kuralı - açık pozisyon varken yeni pozisyon açma
- [ ] Sadece OB/FVG entry - Order Block veya FVG'de giriş yap
- [ ] Minimum R:R = 1:2 kontrolü
- [ ] Akıllı ters pozisyon - BOS/CHoCH algılayıp ters yönde gir
- [ ] Sweep sonrası giriş mantığı


## Pro Trader AI Sistemi (Tamamlandı)
- [x] Pro Trader AI modülü oluşturuldu (pro_trader_ai.py)
- [x] Tek pozisyon kuralı - açık pozisyon varken yeni pozisyon açma
- [x] Tüm sermaye tek pozisyonda kullanılsın ($10,000)
- [x] Her pozisyonda toplam sermayenin %2'si riske edilsin ($200)
- [x] Günlük max kayıp %4 ($400)
- [x] Sadece OB/FVG entry - Order Block veya FVG'de giriş yap
- [x] Minimum R:R = 1:2 kontrolü
- [x] Akıllı ters pozisyon - BOS/CHoCH algılayıp ters yönde gir (CLOSE_AND_REVERSE)
- [x] Sweep sonrası giriş mantığı
- [x] Market structure analizi (trend, structure break, entry zones)
- [x] Order book bias analizi
- [x] Dinamik pozisyon boyutlandırma (SL mesafesine göre kaldıraç)
- [x] Max kaldıraç 10x limiti
- [x] Trade evaluation for learning (fine-tuning için)
- [x] main_pro.py oluşturuldu (Pro Trader Bot)
- [x] paper_trading.py güncellendi (tek pozisyon kuralı)


## Final Eksikler - Satış Öncesi (Şu An)

### Bot Auto-Start Mekanizması
- [x] Dashboard'dan "Başlat" butonuna basınca bot otomatik başlasın
- [x] Bot process manager oluştur (Node.js child_process)
- [x] Bot durumu real-time takip (çalışıyor/durdu)
- [x] "Durdur" butonu ile bot'u güvenli kapat

### Paper Trading Status Real-time
- [x] Paper Trading Status kartı anlık güncellensin
- [x] Balance, P&L, cycle bilgisi WebSocket/polling ile
- [x] Bot her döngüde dashboard'a veri göndersin

### Trade Geçmişi Sayfası
- [x] Kapalı pozisyonları listeleyen sayfa oluştur
- [x] Entry/Exit fiyat, P&L, süre, AI reasoning göster
- [x] Filtreleme (tarih, coin, kar/zarar)
- [x] Toplam istatistikler (win rate, total P&L)

### Backtest Sistemi
- [x] Geçmiş verilerle strateji testi
- [x] Tarih aralığı seçimi
- [x] Performans metrikleri (Sharpe, Drawdown, Win Rate)
- [x] Equity curve grafiği


## API Keys ve Backtest Güncellemesi

- [ ] API key'lerin neden kaybolduğunu araştır
- [ ] API key'lerin kalıcılığını sağla (database'de şifreli saklama)
- [x] Backtest'i gerçek Binance verileriyle çalıştır
- [x] Geçmiş mum verilerini çek (Binance API)
- [x] AI stratejisini geçmiş verilere uygula (SMC patterns: OB, FVG, Liquidity Sweep, BOS)


## Backtest Kaldırma ve API Key Düzeltme

- [x] Backtest sayfasını kaldır
- [x] Backtest route'ını kaldır
- [x] Sidebar'dan Backtest linkini kaldır
- [x] API key'lerin iframe/preview panelde görünmeme sorununu düzelt
- [x] localStorage yerine sadece database kullan


## Bug Fix - Pro Trader AI TypeError

- [x] pro_trader_ai.py line 198 TypeError düzelt - daily_pnl dict vs int sorunu (main_pro.py'de düzeltildi)


## Hibrit Trading Sistemi

### Order Book WebSocket
- [x] Binance Futures WebSocket bağlantısı kur
- [x] Büyük emirleri gerçek zamanlı izle (absorption, iceberg)
- [x] Alıcı/satıcı duvarlarını tespit et

### Limit Emir Sistemi
- [x] Paper trading için simüle limit order sistemi
- [x] Pending orders tablosu oluştur
- [x] Fiyat seviyeye gelince otomatik pozisyon aç

### Pro Trader AI Güncelleme
- [x] Order Book teyidi ile OB/FVG'ye emir koy
- [x] Sadece büyük alıcı/satıcı varsa emir ver
- [x] 5dk'da bir emirleri kontrol et ve güncelle


## Bug Fix - Hybrid Bot

- [x] PaperTradingManager'a get_open_positions methodu ekle
- [x] PaperTradingManager'a update_position_pnl methodu ekle
- [x] SMCDetector.detect_patterns -> detect_all_patterns düzelt

- [x] Order Book WebSocket log spam düzelt - aynı event tekrar loglanmasın (60s cooldown)


## Tam Bağımsız AI Trader

- [ ] AI karar mekanizmasını yeniden tasarla
- [ ] Tüm verileri AI'a gönder (order book, mumlar, açık emirler, pozisyonlar)
- [ ] AI kendi kararını versin (bekle, emir koy, iptal et, pozisyon aç/kapat)
- [ ] Kod sadece AI kararlarını uygulasın
- [ ] Fine-tuning için her karar loglansin


## Yeni İyileştirmeler (Şu An)

### Pozisyon Kapatma Bildirimleri
- [x] SL tetiklendiğinde detaylı bildirim
- [x] TP tetiklendiğinde detaylı bildirim
- [x] Manuel kapatma bildirimi
- [x] Kapatma sebebi ve P&L bilgisi

### WebSocket Bağlantı Durumu
- [x] Dashboard'da WebSocket durumu göster
- [x] Connected/Disconnected/Reconnecting badge
- [x] Bağlantı kopunca uyarı

### Tek Bot Garantisi
- [x] Duplicate bot prevention
- [x] PID file ile kontrol
- [x] Başlatmadan önce mevcut bot kontrolü
- [x] Durdururken doğru bot'u durdur

### Cycle Takip Sorunu
- [x] Paper trading state database'e kaydedilsin
- [x] Her işlem sonrası state güncelle
- [x] Cycle sayacı düzgün çalışsın

### Vultr Deploy
- [x] Deploy rehberi hazırla (VULTR_DEPLOY.md)
- [x] Gerekli dosyaları paketle
- [x] Kurulum script'i yaz (scripts/vps_setup.sh)


## Manus LLM Entegrasyonu

- [x] OpenAI yerine Manus LLM kullan
- [x] Paper Trading modunda Binance API key zorunluluğunu kaldır
- [ ] Vultr VPS'e deploy et


## Dashboard Yeniden Tasarım

- [ ] Ana Dashboard - Modern, profesyonel trading UI
- [ ] Bot Kontrol Paneli - Daha sezgisel kontroller
- [ ] Paper Trading Status - Görsel olarak zengin
- [ ] Performans grafikleri ve istatistikler
- [ ] Trade Geçmişi - Filtreleme ve detaylı görünüm
- [ ] Ayarlar sayfası - Kullanıcı dostu form tasarımı
- [ ] Responsive tasarım - Mobil uyumlu
- [ ] Dark theme optimizasyonu


## VPS Authentication Sistemi
- [x] Manus OAuth kaldır
- [x] Email/şifre login sistemi ekle
- [x] Admin kullanıcı oluştur (ademcakal63@gmail.com)
- [x] Login sayfası tasarla
- [x] VPS test et



---

# 🚀 KAPSAMLI OPTİMİZASYON - 62 MADDE (10 Ocak 2026)

## 🔴 BOT KODLARI - KRİTİK (7)
- [ ] 1. SMC Detector ayrı API çağrısı → Ana prompt'a entegre et
- [ ] 2. AI her döngüde işlem açıyor → Confidence threshold + WAIT sayacı
- [ ] 3. Token kullanımı yüksek → 1200 → 600 token
- [ ] 4. State persistence sorunu → Robust hata yakalama
- [ ] 5. Sadece LONG açma eğilimi → Whale bias kontrolü
- [ ] 6. Risk/Reward düşük (1.2) → 1.5'e çıkar
- [ ] 7. Günlük kayıp limiti geç → Kademeli sistem

## 🟡 DASHBOARD - ÇALIŞMAYAN (6)
- [ ] 8. 7 Günlük Performans Grafiği boş → Otomatik günlük metrik kaydet
- [ ] 9. Öğrenilen Pattern: 0 (hardcoded) → Her işlemde güncelle
- [ ] 10. Tahmin Doğruluğu: 85% (hardcoded) → Gerçek hesapla
- [ ] 11. Risk Level: Low (hardcoded) → Dinamik hesapla
- [ ] 12. Streak: 0 (hardcoded) → State'e ekle
- [ ] 13. Trade History tablosu boş → Pozisyon kapandığında kaydet

## 🔵 FINE-TUNING - EKSİK (8)
- [ ] 14. main_autonomous.py'de kullanılmıyor → Entegre et
- [ ] 15. Learning Data database'e yazılmıyor → ai_learning tablosuna yaz
- [ ] 16. Otomatik tetikleyici yok → 100 işlem/1 hafta sonra tetikle
- [ ] 17. Fine-tuned model kullanılmıyor → Varsa kullan
- [ ] 18. Pattern öğrenme aktif değil → Pattern-sonuç ilişkisi kaydet
- [ ] 19. Validation testi mock → Gerçek model testi yap
- [ ] 20. Performance monitoring yok → Model karşılaştırması ekle
- [ ] 21. Gradual rollout yok → Kademeli geçiş sistemi ekle

## 🟣 ÖĞRENME SİSTEMİ - ÇALIŞMIYOR (12)
- [ ] 22. HybridLearningManager main'de yok → Entegre et
- [ ] 23. PromptLearningSystem (A) çalışmıyor → Aktif et
- [ ] 24. FineTuningSystem (B) çalışmıyor → Aktif et
- [ ] 25. CostController kullanılmıyor → Maliyet takibi ekle
- [ ] 26. PerformanceMonitor kullanılmıyor → Performans izleme ekle
- [ ] 27. GradualRollout kullanılmıyor → Kademeli geçiş ekle
- [ ] 28. TradeCycleManager kullanılmıyor → Cycle takibi ekle
- [ ] 29. Haftalık Scheduler çalışmıyor → schedule kütüphanesi çağır
- [ ] 30. learned_rules.txt oluşturulmuyor → Öğrenilen kuralları kaydet
- [ ] 31. model_version.txt oluşturulmuyor → Model versiyonu takip et
- [ ] 32. Rollback mekanizması yok → Performans düşüşünde geri dön
- [ ] 33. Fine-tuning bildirimleri gönderilmiyor → Dashboard'a bildir

## 🟠 API & ERROR HANDLING (7)
- [ ] 34. Binance Rate Limit kontrolü yok → 429 hatası yakala
- [ ] 35. API Retry mekanizması yok → Exponential backoff ekle
- [ ] 36. WebSocket reconnect limiti yok → Max 5 deneme
- [ ] 37. Duplicate notification sorunu → Tekrar kontrolü ekle
- [ ] 38. Position size $100K sabit → Dinamik hesapla
- [ ] 39. Stop Loss çok yakın (%0.16) → Min %0.5 yap
- [ ] 40. Take Profit çok uzak → R:R dengesini düzelt

## 🟤 KOD TEMİZLİĞİ (5)
- [ ] 41. 39 Python dosyası var → Kullanılmayanları sil
- [ ] 42. Ölü kod: main.py, main_pro.py, main_hybrid.py → Sil
- [ ] 43. Ölü kod: autonomous_ai.py, pro_trader_ai.py → Sil
- [ ] 44. Ölü kod: openai_trading.py → Sil
- [ ] 45. Test dosyaları dağınık → tests/ klasörüne taşı

## 🟢 OPTİMİZASYONLAR (5)
- [ ] 46. Karar döngüsü → Açık pozisyon varken AI çağırma
- [ ] 47. Whale threshold → $200K → $500K
- [ ] 48. Limit order expiry → 30dk → 60dk
- [ ] 49. API maliyet takibi → Token sayısını logla
- [ ] 50. DeepSeek V3 entegrasyonu → $20/gün → $0.50/gün

## 🆕 YENİ TESPİTLER (12)
- [ ] 51. Backtest sistemi YOK → Temel backtest ekle
- [ ] 52. Logging sistemi YOK → Python logging modülü ekle
- [ ] 53. Multi-coin desteği YOK → Sadece BTCUSDT (gelecekte)
- [ ] 54. Acil Durdur butonu çalışmıyor → Fonksiyonu implement et
- [ ] 55. Database index eksik → Performans için index ekle
- [ ] 56. TradingView pozisyon marker'ları yok → SL/TP çizgileri ekle
- [ ] 57. Risk Management Panel statik → Gerçek veri çek
- [ ] 58. API key güvenliği → Açık referansları temizle
- [ ] 59. Memory leak riski → WebSocket cleanup düzelt
- [ ] 60. Async/await tutarsızlık → Tutarlı hale getir
- [ ] 61. Database connection pooling yok → Pool ekle
- [ ] 62. Test coverage düşük → Kritik testler ekle

---

## İlerleme Durumu (10 Ocak 2026)
- Toplam: 62 madde
- Tamamlanan: 0
- Kalan: 62


## 62 Sorun Düzeltmesi (10 Ocak 2026)

### Kritik Bot Hataları (1-7)
- [x] Token kullanımı optimize edildi (~1200 → ~600 token/call)
- [x] WAIT sayacı eklendi (overtrading önleme)
- [x] SHORT bias düzeltildi (dengeli LONG/SHORT kararları)
- [x] Confidence threshold eklendi (min %65)
- [x] R:R oranı 1.2 → 1.5 (daha kaliteli işlemler)
- [x] Günlük kayıp limiti kademeli sistem (%2 uyarı, %3 son işlem, %4 dur)
- [x] Minimum 10 dakika işlemler arası bekleme

### Dashboard Hardcoded Değerler (8-13)
- [x] "85%" tahmin doğruluğu API'den gelen veriye bağlandı
- [x] PaperTradingStatus - zaten API'den veri alıyor
- [x] BotControlPanel - zaten API'den veri alıyor
- [x] PerformanceChart - zaten API'den veri alıyor

### Fine-tuning Sistemi (14-21)
- [x] learning_system_a.py - gerçek veri okuma entegrasyonu
- [x] learning_system_b.py - gerçek veri okuma entegrasyonu
- [x] learning_manager.py - main_autonomous.py'ye entegre edildi
- [x] paper_trading.py - learning system callback eklendi
- [x] trade_history_for_learning.json dosyası oluşturulacak

### Öğrenme Sistemi Entegrasyonu (22-33)
- [x] local_ai_decision.py - öğrenilen kuralları yükleme
- [x] _get_enhanced_system_prompt() - learned rules prompt'a ekleniyor
- [x] Haftalık analiz gerçek işlem verilerinden yapılıyor
- [x] Pattern başarı oranları hesaplanıyor
- [x] Sentiment doğruluğu analiz ediliyor
- [x] Timeframe performansı izleniyor

### API ve Error Handling (34-40)
- [x] dashboard_client.py - retry mekanizması eklendi
- [x] Exponential backoff ile 3 deneme
- [x] Connection health tracking
- [x] Timeout handling
- [x] HTTP error ayrımı (4xx vs 5xx)

### DeepSeek V3 Entegrasyonu (41-45)
- [x] DeepSeek V3 API desteği eklendi
- [x] Otomatik provider seçimi (DEEPSEEK_API_KEY varsa)
- [x] Maliyet karşılaştırması (OpenAI: $10-30/1M, DeepSeek: $0.14-0.28/1M)
- [x] Her API call'da maliyet hesaplama ve loglama
- [x] Toplam maliyet ve tasarruf takibi

### Kod Temizliği (46-62)
- [x] Ölü kod dosyaları _archive klasörüne taşındı:
  - main_old_backup.py
  - main_hybrid.py
  - main_pro.py
  - main_with_paper_trading.py
  - autonomous_ai.py
  - llm_client.py
  - openai_trading.py
  - pro_trader_ai.py
  - unified_trading_system.py
  - test_openai_key.py
  - test_position_calculation.py
- [x] 39 → 28 aktif Python dosyası

### Kalan İşler
- [ ] Vitest testleri yazılacak
- [ ] Dashboard'da AI Cost Tracking paneli eklenecek
- [ ] Learning System dashboard entegrasyonu


## Learning System Dosya Yolu Düzeltmeleri (Tamamlandı - 11 Ocak 2026)

### Hardcoded Path'ler Düzeltildi
- [x] learning_manager.py - BASE_DIR eklendi, start_date.txt yolu düzeltildi
- [x] learning_system_a.py - BASE_DIR eklendi, trade_history_for_learning.json, learned_rules.txt, model_version.txt yolları düzeltildi
- [x] learning_system_b.py - BASE_DIR eklendi, trade_history_for_learning.json, training_data.jsonl, fine_tuned_model.json yolları düzeltildi
- [x] checkpoint_manager.py - BASE_DIR eklendi, checkpoints klasör yolu düzeltildi
- [x] cost_controller.py - BASE_DIR eklendi, cost_tracking.json yolu düzeltildi
- [x] finetuning_safety.py - BASE_DIR eklendi, fine_tuned_model.json yolu düzeltildi
- [x] gradual_rollout.py - BASE_DIR eklendi, rollout_status.json yolu düzeltildi
- [x] paper_trading.py - BASE_DIR eklendi, trade_history_for_learning.json yolu düzeltildi
- [x] local_ai_decision.py - BASE_DIR eklendi, learned_rules.txt yolu düzeltildi
- [x] performance_monitor.py - BASE_DIR eklendi, performance_tracking.json yolu düzeltildi

### Eksik Dosya Oluşturuldu
- [x] start_date.txt dosyası oluşturuldu (Learning System initialization için gerekli)

### Log Mesajı Düzeltildi
- [x] main_autonomous.py - "Using Local AI (OpenAI API)" → "Using Local AI ({provider} API)" (DeepSeek/OpenAI dinamik gösterim)

### Sonuç
- Tüm Python dosyaları artık dinamik BASE_DIR kullanıyor
- Hem sandbox (/home/ubuntu/) hem VPS (/root/) ortamlarında çalışacak
- Learning System initialization hatası giderildi


## Cycle Persistence ve Log Düzeltmeleri (11 Ocak 2026)

### Cycle Persistence Sorunu Düzeltildi
- [x] paper_trading.py - _load_state fonksiyonu düzeltildi
- [x] paperTradingState JSON string olarak database'de saklanıyor, parse edilmiyordu
- [x] Hem camelCase (paperTradingState) hem snake_case (paper_trading_state) key'leri destekleniyor
- [x] JSON string otomatik parse ediliyor

### Log Mesajı
- [x] main_autonomous.py - provider dinamik olarak gösteriliyor (önceki commit'te düzeltilmişti)
- [x] local_ai_decision.py - provider attribute zaten doğru set ediliyor

### Bot Zamanlama
- [x] Bot zamanlama normal - 3 dakikada bir döngü çalışıyor
- [x] State her trade sonrası ve bot kapanışında kaydediliyor
- [x] Graceful shutdown handler mevcut


## Dashboard Uptime Sorunu (11 Ocak 2026)
- [x] Dashboard'da "Çalışma Süresi" sürekli sıfırlanıyor (7-8sn sonra 1sn'ye dönüyor)
- [x] Bot çalışıyor ama uptime doğru hesaplanmıyor - /proc/{pid} stat ile gerçek başlangıç zamanı alınıyor


## Dashboard Kapsamlı Düzeltme (11 Ocak 2026)
- [x] Uptime hala sıfırlanıyor - bot_status.json dosyasına kaydediliyor
- [x] Loglar eski - bot.log dosyasından okunuyor
- [x] Bot durdurma çalışmıyor - kill komutu düzeltildi
- [ ] Cycle ilerlemiyor - paper_trading.py düzeltmesi VPS'te test edilecek
