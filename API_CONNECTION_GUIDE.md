# 🔗 Binance API Bağlantı Rehberi

**Gerçek hesap bağlantısı için adım adım kılavuz**

---

## 📋 Ön Hazırlık

### 1. **Binance Hesabınızı Hazırlayın**

- ✅ Binance hesabınız olmalı ([binance.com](https://www.binance.com))
- ✅ KYC (Kimlik doğrulama) tamamlanmış olmalı
- ✅ Futures trading aktif edilmiş olmalı
- ✅ Hesapta en az **100 USDT** bulunmalı (önerilen: 500 USDT)

---

## 🔑 Binance API Key Oluşturma

### **Adım 1: API Management Sayfasına Gidin**

1. Binance'e giriş yapın
2. Sağ üst köşeden **Profil** → **API Management** tıklayın
3. **Create API** butonuna tıklayın

### **Adım 2: API Key Türünü Seçin**

- **System Generated API Key** seçin (önerilen)
- API Key için bir isim verin (örn: "AI Trading Bot")

### **Adım 3: Güvenlik Doğrulaması**

- Email doğrulama kodunu girin
- 2FA (Google Authenticator) kodunu girin
- **Create** butonuna tıklayın

### **Adım 4: API Key ve Secret'ı Kaydedin**

⚠️ **ÖNEMLİ:** API Secret sadece bir kez gösterilir!

```
API Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Secret Key: yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

- Bu bilgileri güvenli bir yere kaydedin
- Secret Key'i kimseyle paylaşmayın

---

## 🔒 API Key Yetkilerini Ayarlayın

### **Gerekli Yetkiler:**

✅ **Enable Futures** - Futures trading için (ZORUNLU)  
✅ **Enable Spot & Margin Trading** - Spot işlemler için (ZORUNLU)

### **Verilmemesi Gereken Yetkiler:**

❌ **Enable Withdrawals** - Para çekme yetkisi (GÜVENLİK)  
❌ **Enable Internal Transfer** - İç transfer (GÜVENLİK)

---

## 🌐 IP Whitelist Ayarlayın (ÖNERİLEN)

### **Neden IP Whitelist?**

IP Whitelist, API Key'inizin sadece belirttiğiniz IP adreslerinden kullanılmasını sağlar. Bu, güvenliği artırır.

### **Dashboard IP Adresiniz:**

```
Dashboard IP: [Sistem otomatik tespit edecek]
```

### **IP Whitelist Nasıl Eklenir?**

1. API Management sayfasında oluşturduğunuz API Key'i bulun
2. **Edit** butonuna tıklayın
3. **Restrict access to trusted IPs only** seçeneğini işaretleyin
4. Dashboard IP adresini ekleyin
5. **Save** butonuna tıklayın

⚠️ **Not:** IP Whitelist eklerseniz, API Key sadece o IP'den çalışır. Başka yerden test edemezsiniz.

---

## 🔗 Dashboard'a Bağlantı

### **Adım 1: Settings Sayfasına Gidin**

1. Dashboard'da sağ üstteki **⚙️ Ayarlar** butonuna tıklayın
2. **Binance API Bağlantısı** bölümüne gidin

### **Adım 2: API Key Bilgilerini Girin**

```
Binance API Key: [API Key'inizi buraya yapıştırın]
Binance API Secret: [Secret Key'inizi buraya yapıştırın]
```

### **Adım 3: Bağlantıyı Test Edin**

1. **Bağlantıyı Test Et** butonuna tıklayın
2. Başarılı mesajı ve bakiye bilgisi görmelisiniz:

```
✅ Bağlantı başarılı! Hesap bilgileri alındı.
💰 Bakiye: $523.45 USDT
```

### **Adım 4: Sermaye Ayarlarını Yapın**

**Seçenek A: Tüm Bakiyeyi Kullan** (Varsayılan)
- "Tüm Bakiyeyi Kullan" toggle'ı aktif bırakın
- Bot hesaptaki tüm USDT'yi kullanacak

**Seçenek B: Sermaye Limiti Belirle**
- "Tüm Bakiyeyi Kullan" toggle'ını kapatın
- "Sermaye Limiti" alanına maksimum kullanılacak miktarı girin (örn: 500)
- Bot maksimum bu kadar USDT kullanacak

### **Adım 5: Risk Parametrelerini Ayarlayın**

```
Günlük Kayıp Limiti: 4% (önerilen)
İşlem Başına Risk: 2% (önerilen)
Maksimum Günlük İşlem: 10 (önerilen)
```

### **Adım 6: Bileşik Getiri (Opsiyonel)**

- **Aktif:** Kazançlar otomatik sermayeye eklenir (hesap büyür)
- **Pasif:** Sabit sermaye kullanılır (kazançlar birikmez)

### **Adım 7: Kaydet**

- **Kaydet** butonuna tıklayın
- Ayarlar database'e kaydedilecek

---

## 🤖 Bot'u Başlatın

### **Adım 1: Bot Script'ini Hazırlayın**

```bash
cd /home/ubuntu/ai-crypto-trader-dashboard
```

### **Adım 2: Dashboard URL'ini Güncelleyin**

`bot_example.py` dosyasını açın ve Dashboard URL'inizi yazın:

```python
DASHBOARD_API_URL = "https://your-dashboard.manus.space/api/bot"
```

### **Adım 3: Bot'u Çalıştırın**

```bash
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
```

---

## ✅ Bağlantı Kontrolü

### **Dashboard'da Kontrol Edin:**

1. **Ana Sayfa** → **Mevcut Bakiye** kartı
   - Bakiye gösteriliyorsa → ✅ Bağlantı başarılı
   - "Hesap Bağlı Değil" yazıyorsa → ❌ API key hatalı

2. **Risk Yönetimi Paneli**
   - Günlük kayıp limiti doğru hesaplanıyor mu?
   - İşlem başına risk doğru mu?

3. **WebSocket Durumu**
   - Sağ üstte "CONNECTED" yazıyor mu?

---

## 🔧 Sorun Giderme

### **Hata: "Geçersiz API Key"**

**Çözüm:**
- API Key'i kopyalarken boşluk bırakmadığınızdan emin olun
- API Key'in doğru olduğunu kontrol edin

### **Hata: "Geçersiz API Secret"**

**Çözüm:**
- Secret Key'i kopyalarken boşluk bırakmadığınızdan emin olun
- Secret Key'in doğru olduğunu kontrol edin
- Secret Key sadece bir kez gösterilir, yanlış kopyaladıysanız yeni API Key oluşturun

### **Hata: "IP kısıtlaması var"**

**Çözüm:**
- Binance API Management'ta IP Whitelist'i kontrol edin
- Dashboard IP'sini whitelist'e ekleyin
- Veya IP Whitelist'i tamamen kaldırın (güvenlik riski)

### **Hata: "API Key yetkisi yetersiz"**

**Çözüm:**
- Binance API Management'ta API Key yetkilerini kontrol edin
- "Enable Futures" yetkisini aktif edin
- "Enable Spot & Margin Trading" yetkisini aktif edin

### **Hata: "Futures API erişimi yok"**

**Çözüm:**
- Binance hesabınızda Futures trading'i aktif edin
- Ana sayfada **Derivatives** → **USDT-M Futures** bölümüne gidin
- Futures sözleşmesini kabul edin

### **Bakiye 0 Gösteriyor**

**Çözüm:**
- Binance Futures hesabınıza USDT transfer edin
- Spot cüzdanınızdan Futures cüzdanınıza transfer yapın:
  - **Wallet** → **Fiat and Spot** → **Transfer** → **To USDT-M Futures**

---

## 🎯 İlk İşlem Öncesi Kontrol Listesi

- [ ] API Key oluşturuldu
- [ ] "Enable Futures" yetkisi verildi
- [ ] "Enable Withdrawals" yetkisi VERİLMEDİ
- [ ] IP Whitelist ayarlandı (opsiyonel ama önerilen)
- [ ] Dashboard'a API Key bağlandı
- [ ] Bağlantı test edildi ve bakiye göründü
- [ ] Sermaye ayarları yapıldı (tüm bakiye veya limit)
- [ ] Risk parametreleri ayarlandı (%4 günlük, %2 işlem başına)
- [ ] Bileşik getiri tercihi yapıldı
- [ ] Bot script'i Dashboard URL'i ile güncellendi
- [ ] Bot test edildi ve bakiye çekimi çalıştı

---

## 🚀 Hazırsınız!

Artık bot gerçek hesapla trading yapabilir. İlk işleminizi açmadan önce:

1. **Küçük sermaye ile başlayın** (100-500 USDT)
2. **İlk günü yakından takip edin**
3. **Emergency Stop butonunun yerini bilin**
4. **Günlük performans raporlarını inceleyin**

**Başarılar! 🎉**
