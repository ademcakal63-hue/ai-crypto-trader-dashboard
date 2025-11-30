# OpenAI API Kurulum ve Maliyet Kontrol Rehberi

## 📋 İçindekiler

1. [OpenAI API Key Oluşturma](#1-openai-api-key-oluşturma)
2. [API Key'i Projeye Ekleme](#2-api-keyi-projeye-ekleme)
3. [Maliyet Kontrol Sistemi](#3-maliyet-kontrol-sistemi)
4. [Checkpoint Kurtarma Stratejisi](#4-checkpoint-kurtarma-stratejisi)
5. [Gradual Rollout](#5-gradual-rollout)
6. [Performance Monitoring](#6-performance-monitoring)
7. [Sorun Giderme](#7-sorun-giderme)

---

## 1. OpenAI API Key Oluşturma

### Adım 1: OpenAI Hesabı Oluştur

1. [platform.openai.com](https://platform.openai.com) adresine git
2. "Sign Up" butonuna tıkla
3. E-posta ve şifre ile kayıt ol
4. E-posta doğrulamasını tamamla

### Adım 2: API Key Oluştur

1. Sol menüden **API Keys** sekmesine git
2. **Create new secret key** butonuna tıkla
3. İsim ver: `AI Crypto Trader`
4. **Create secret key** butonuna tıkla
5. API Key'i kopyala (sadece 1 kez gösterilir!)

**Örnek API Key:**
```
sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

⚠️ **ÖNEMLİ:** API Key'i güvenli bir yerde sakla! Başkalarıyla paylaşma.

### Adım 3: Ödeme Yöntemi Ekle

1. Sol menüden **Settings** → **Billing** sekmesine git
2. **Add payment method** butonuna tıkla
3. Kredi kartı bilgilerini gir
4. **Save** butonuna tıkla

### Adım 4: Kullanım Limiti Ayarla (Opsiyonel)

1. **Settings** → **Limits** sekmesine git
2. **Monthly budget** ayarla: `$30` (önerilen)
3. **Email notifications** aktif et
4. **Save** butonuna tıkla

---

## 2. API Key'i Projeye Ekleme

### Yöntem 1: .env Dosyasına Ekle (Önerilen)

```bash
cd /home/ubuntu/ai-crypto-trader-dashboard
echo "OPENAI_API_KEY=sk-proj-abc123..." >> .env
```

### Yöntem 2: Terminal'de Export Et

```bash
export OPENAI_API_KEY="sk-proj-abc123..."
```

### Yöntem 3: Python Script ile Ekle

```python
import os

# API Key'i environment variable olarak ayarla
os.environ["OPENAI_API_KEY"] = "sk-proj-abc123..."
```

### API Key'i Test Et

```bash
python -c "import os; print('OpenAI API Key:', os.getenv('OPENAI_API_KEY')[:20] + '...')"
```

**Beklenen Çıktı:**
```
OpenAI API Key: sk-proj-abc123def456...
```

---

## 3. Maliyet Kontrol Sistemi

### Maliyet Limitleri

Bot otomatik olarak maliyeti kontrol eder:

| Limit Tipi | Varsayılan Değer | Açıklama |
|------------|------------------|----------|
| **Fine-tuning Limiti** | $10 | Tek bir fine-tuning job için maksimum maliyet |
| **Aylık Limit** | $25 | Bir ay içinde toplam maksimum maliyet |
| **Uyarı Eşiği** | %80 | Limite %80 ulaşınca uyarı gönder |

### Maliyet Tahmini

Bot her fine-tuning öncesi maliyeti tahmin eder:

```
💰 Maliyet Tahmini:
   - İşlem sayısı: 50
   - Toplam token: 25,000
   - Training cost: $0.625
```

### Maliyet Aşımında Ne Olur?

#### Seviye 1: Uyarı (%80 limite ulaşıldı)

```
⚠️ Maliyet Limiti Yaklaşıyor
Fine-tuning maliyeti $8.50 (Limit: $10.00)
Seçenek A ile devam etmeyi düşünebilirsiniz.
```

**Bot Eylemi:** Fine-tuning devam eder, sadece uyarı verilir.

#### Seviye 2: Durdur (%100 limit aşıldı)

```
🚨 Fine-Tuning İptal Edildi
Tahmini maliyet: $11.50
Limit: $10.00
Seçenek A ile devam ediliyor.
```

**Bot Eylemi:** Fine-tuning iptal edilir, veriler checkpoint olarak kaydedilir.

#### Seviye 3: Aylık Limit Doldu

```
📊 Aylık Maliyet Limiti Doldu
Bu ay $25.00 harcandı.
1 Aralık'ta fine-tuning otomatik aktifleşecek.
```

**Bot Eylemi:** Fine-tuning ay sonuna kadar devre dışı bırakılır.

### Maliyet Limitlerini Değiştirme

`ai_bot/cost_controller.py` dosyasını düzenle:

```python
class CostController:
    # Maliyet limitleri
    MAX_COST_PER_FINETUNING = 15.0  # $10 → $15
    MAX_MONTHLY_COST = 40.0  # $25 → $40
```

---

## 4. Checkpoint Kurtarma Stratejisi

### Checkpoint Nedir?

Checkpoint, fine-tuning öncesi training data'nın kaydedildiği bir snapshot'tır.

### Checkpoint Durumları

| Durum | Açıklama |
|-------|----------|
| `pending` | Fine-tuning başlamadan önce kaydedildi |
| `completed` | Fine-tuning başarıyla tamamlandı |
| `cancelled` | Maliyet limiti veya hata nedeniyle iptal edildi |

### Checkpoint Kurtarma Akışı

#### Hafta 1: İlk Fine-Tuning

```
✅ 50 işlem toplandı
✅ Checkpoint kaydedildi: checkpoint_20241130_120000
✅ Maliyet: $5.50 (Limit: $10)
✅ Fine-tuning başarılı
✅ Model: ft:gpt-4o-2024-08-06:abc123
```

#### Hafta 2: Maliyet Limiti Aşımı

```
✅ 80 yeni işlem toplandı
✅ Checkpoint kaydedildi: checkpoint_20241207_120000
❌ Maliyet: $12.50 (Limit: $10) → İptal edildi
✅ Veriler korundu (80 işlem)
ℹ️ Seçenek A ile devam ediliyor
```

#### Hafta 3: Kurtarma ve Birleştirme

```
✅ 60 yeni işlem toplandı
✅ Önceki checkpoint'ler yüklendi:
   - checkpoint_20241130_120000 (50 işlem, completed)
   - checkpoint_20241207_120000 (80 işlem, cancelled)
✅ Toplam: 190 işlem (50 + 80 + 60)
✅ Duplicate temizlendi: 185 işlem
✅ Kalite filtresi: 180 işlem
✅ Maliyet: $9.00 (Limit: $10)
✅ Fine-tuning başarılı!
✅ Model: ft:gpt-4o-2024-08-06:xyz789
```

### Checkpoint'leri Görüntüleme

```bash
python ai_bot/checkpoint_manager.py
```

**Çıktı:**
```
📋 Checkpoint Listesi:
   - checkpoint_20241207_120000: cancelled (80 işlem)
   - checkpoint_20241130_120000: completed (50 işlem)

📊 Checkpoint İstatistikleri:
   - Toplam: 2
   - Başarılı: 1
   - İptal: 1
   - Beklemede: 0
   - Toplam işlem: 130
```

---

## 5. Gradual Rollout

### Gradual Rollout Nedir?

Fine-tuned model'i kademeli olarak devreye alma stratejisi:

| Gün | Yüzde | Açıklama |
|-----|-------|----------|
| 1 | %25 | 4 işlemden 1'i fine-tuned model kullanır |
| 3 | %50 | 2 işlemden 1'i fine-tuned model kullanır |
| 5 | %75 | 4 işlemden 3'ü fine-tuned model kullanır |
| 7 | %100 | Tüm işlemler fine-tuned model kullanır |

### Gradual Rollout Akışı

#### Gün 1: Fine-Tuning Tamamlandı

```
✅ Fine-tuning tamamlandı: ft:gpt-4o-2024-08-06:abc123
📈 Gradual rollout başlatıldı: %25
```

#### Gün 3: %50'ye Geçiş

```
📈 Rollout fazı güncellendi:
   - Gün 3: %50
```

#### Gün 7: %100 Tamamlandı

```
🎉 Gradual rollout tamamlandı! Fine-tuned model %100 aktif.
```

### Rollout Durumunu Görüntüleme

```bash
python ai_bot/gradual_rollout.py
```

**Çıktı:**
```
📊 Rollout Durumu:
   - Aktif: True
   - Model: ft:gpt-4o-2024-08-06:abc123
   - Gün: 3
   - Yüzde: %50
   - Faz: 2/4
```

---

## 6. Performance Monitoring

### Performans İzleme

Bot her gün 12:00'da otomatik olarak performans karşılaştırması yapar:

```
📊 Performans Karşılaştırması (Son 7 gün)...

📊 Base Model:
   - İşlem sayısı: 25
   - Win rate: 65.0%
   - Avg P&L: $50.00

📊 Fine-tuned Model:
   - İşlem sayısı: 25
   - Win rate: 70.0%
   - Avg P&L: $60.00

📈 Fark:
   - Win rate: +5.0%
   - Avg P&L: +$10.00

✅ Performans normal. Fine-tuned model iyi çalışıyor.
```

### Otomatik Rollback

Performans %10'dan fazla düşerse otomatik rollback:

```
🚨 PERFORMANS DÜŞÜŞÜ TESPİT EDİLDİ!
   - Win rate farkı: -12.0%
   - Eşik: -10.0%

🔄 Base model'e geri dönülüyor...

🚨 Model Geri Alındı
Fine-tuned model performansı düştü!

Base model: 65.0%
Fine-tuned model: 53.0%
Fark: -12.0%

Base model'e geri dönüldü.
```

### Performans İstatistikleri

```bash
python ai_bot/performance_monitor.py
```

**Çıktı:**
```
📊 Performans Özeti:
{
  "base_model": {
    "total_trades": 100,
    "win_rate": 0.65,
    "avg_pnl": 50.0
  },
  "finetuned_model": {
    "total_trades": 75,
    "win_rate": 0.70,
    "avg_pnl": 60.0
  },
  "total_comparisons": 10,
  "last_comparison": {
    "date": "2024-11-30T12:00:00",
    "difference": {
      "win_rate": 0.05,
      "avg_pnl": 10.0
    }
  }
}
```

---

## 7. Sorun Giderme

### Sorun 1: API Key Bulunamadı

**Hata:**
```
❌ OPENAI_API_KEY environment variable bulunamadı!
```

**Çözüm:**
```bash
export OPENAI_API_KEY="sk-proj-abc123..."
```

### Sorun 2: Fine-Tuning Başarısız

**Hata:**
```
❌ Fine-tuning başarısız: Job başlatma başarısız
```

**Çözüm:**
1. OpenAI API Key'i doğru mu kontrol et
2. OpenAI hesabında kredi var mı kontrol et
3. OpenAI API status'unu kontrol et: [status.openai.com](https://status.openai.com)

### Sorun 3: Maliyet Çok Yüksek

**Hata:**
```
❌ Fine-tuning maliyeti çok yüksek: $15.50
```

**Çözüm:**
1. Maliyet limitini artır (cost_controller.py)
2. İşlem sayısını azalt (daha az veri kullan)
3. Seçenek A ile devam et (ücretsiz)

### Sorun 4: Checkpoint Bulunamadı

**Hata:**
```
❌ Checkpoint bulunamadı: checkpoint_20241130_120000
```

**Çözüm:**
```bash
# Checkpoint'leri listele
python ai_bot/checkpoint_manager.py

# Checkpoint klasörünü kontrol et
ls -la ai_bot/checkpoints/
```

### Sorun 5: Performans Düşüşü

**Hata:**
```
🚨 Performans düşüşü tespit edildi: -12.0%
```

**Çözüm:**
1. Bot otomatik olarak base model'e döner
2. Yeni veri toplanana kadar bekle
3. Bir sonraki hafta yeniden fine-tuning yap

---

## 📞 Destek

Sorun yaşıyorsan:

1. **Logları kontrol et:**
   ```bash
   tail -f ai_bot/logs/learning.log
   ```

2. **Sistem durumunu kontrol et:**
   ```bash
   python ai_bot/learning_manager.py
   ```

3. **Dashboard'da bildirimleri kontrol et**

4. **OpenAI Dashboard'ı kontrol et:**
   - [platform.openai.com/usage](https://platform.openai.com/usage)
   - [platform.openai.com/account/limits](https://platform.openai.com/account/limits)

---

## 🎯 Özet

✅ **Maliyet Kontrolü:** $10/fine-tuning, $25/ay limit
✅ **Checkpoint Kurtarma:** Hiçbir veri kaybedilmez
✅ **Gradual Rollout:** 7 gün boyunca %25→%100 geçiş
✅ **Performance Monitoring:** Otomatik rollback (%10 düşüş)
✅ **Otomatik Sistem:** Kullanıcı müdahalesi gerektirmez

**Bot tamamen otomatik çalışır. Sen sadece bildirimleri takip et!** 🚀
