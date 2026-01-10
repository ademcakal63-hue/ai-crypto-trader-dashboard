"""
LLM Client - Manus built-in LLM kullanarak pattern analizi
"""

import os
import json
import requests
from typing import Dict, Any, List

# Manus built-in LLM API (Dashboard'dan alınacak)
LLM_API_URL = os.getenv("BUILT_IN_FORGE_API_URL", "https://api.manus.im")
LLM_API_KEY = os.getenv("BUILT_IN_FORGE_API_KEY", "")

class LLMClient:
    """Manus LLM client for pattern analysis"""
    
    def __init__(self):
        self.api_url = f"{LLM_API_URL}/v1/chat/completions"
        self.api_key = LLM_API_KEY
        
        if not self.api_key:
            raise ValueError("LLM API Key bulunamadı! BUILT_IN_FORGE_API_KEY env variable'ı ayarlayın.")
    
    def analyze_chart(self, candles: List[Dict], timeframe: str, pattern_knowledge: str) -> Dict[str, Any]:
        """
        Grafik analizi yap, pattern tespit et
        
        Args:
            candles: Mum verileri [{"open": 45000, "high": 45500, "low": 44800, "close": 45200, "volume": 1000}, ...]
            timeframe: Zaman dilimi ("1m", "5m", "15m", "1h", "4h")
            pattern_knowledge: Pattern bilgileri (prompt)
        
        Returns:
            {
                "pattern": "FVG + OB",
                "confidence": 0.85,
                "direction": "LONG",
                "entry": 45000,
                "stop_loss": 44100,
                "take_profit": 47700,
                "reason": "Güçlü FVG + yüksek volume OB kombinasyonu",
                "risk_reward": 3.0
            }
        """
        
        # Mum verilerini formatla
        chart_data = self._format_candles(candles)
        
        # Prompt oluştur
        prompt = f"""
{pattern_knowledge}

=== GRAFİK ANALİZİ GÖREVİ ===

Aşağıdaki {timeframe} grafiğini analiz et:

{chart_data}

Görevler:
1. Hangi pattern'ler var? (FVG, OB, Liquidity Sweep, BOS veya kombinasyonları)
2. Her pattern için güven skoru hesapla (0-1 arası)
3. Hangi yönde işlem açmalıyım? (LONG/SHORT/NONE)
4. Entry, Stop Loss, Take Profit seviyeleri nedir?
5. Risk/Reward oranı nedir?
6. Neden bu kararı verdin? (kısa açıklama)

ÖNEMLI KURALLAR:
- Eğer hiç pattern yoksa veya güven skoru < 0.70 ise direction = "NONE"
- Stop Loss mutlaka belirt (risk yönetimi zorunlu)
- Take Profit en az 1:2 Risk/Reward olmalı
- Kombinasyon pattern'leri tercih et (daha güçlü)

JSON formatında cevap ver (sadece JSON, başka metin ekleme):
{{
  "pattern": "FVG + OB veya NONE",
  "confidence": 0.85,
  "direction": "LONG veya SHORT veya NONE",
  "entry": 45000.0,
  "stop_loss": 44100.0,
  "take_profit": 47700.0,
  "reason": "Kısa açıklama",
  "risk_reward": 3.0
}}
"""
        
        # LLM'e gönder
        try:
            response = requests.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {"role": "system", "content": "Sen bir profesyonel crypto trader'sın. Smart Money Concept stratejilerini kullanıyorsun."},
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.3  # Daha deterministik sonuçlar
                },
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            # Parse response
            content = result["choices"][0]["message"]["content"]
            analysis = json.loads(content)
            
            return analysis
            
        except requests.exceptions.RequestException as e:
            print(f"❌ LLM API hatası: {e}")
            return {
                "pattern": "NONE",
                "confidence": 0.0,
                "direction": "NONE",
                "entry": 0.0,
                "stop_loss": 0.0,
                "take_profit": 0.0,
                "reason": f"API hatası: {str(e)}",
                "risk_reward": 0.0
            }
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse hatası: {e}")
            return {
                "pattern": "NONE",
                "confidence": 0.0,
                "direction": "NONE",
                "entry": 0.0,
                "stop_loss": 0.0,
                "take_profit": 0.0,
                "reason": f"JSON parse hatası: {str(e)}",
                "risk_reward": 0.0
            }
    
    def analyze_exit_signal(self, position: Dict, current_candles: List[Dict], timeframe: str) -> Dict[str, Any]:
        """
        Açık pozisyon için çıkış sinyali analizi
        
        Args:
            position: Açık pozisyon bilgisi
            current_candles: Güncel mum verileri
            timeframe: Zaman dilimi
        
        Returns:
            {
                "action": "CLOSE" veya "HOLD" veya "MOVE_STOP_LOSS",
                "reason": "Açıklama",
                "new_stop_loss": 45500.0  # Sadece MOVE_STOP_LOSS için
            }
        """
        
        chart_data = self._format_candles(current_candles)
        
        prompt = f"""
Sen bir profesyonel crypto trader'sın. Açık pozisyonların çıkış noktalarını belirliyorsun.

=== AÇIK POZİSYON BİLGİSİ ===

Yön: {position["direction"]}
Entry: ${position["entry"]}
Current Price: ${position["current_price"]}
Stop Loss: ${position["stop_loss"]}
Take Profit: ${position["take_profit"]}
Current P&L: ${position["pnl"]} ({position["pnl_percent"]}%)
Açılma Zamanı: {position["duration"]} dakika önce
Pattern: {position["pattern"]}

=== GÜNCEL GRAFİK ({timeframe}) ===

{chart_data}

=== ÇIKIŞ KARARI ===

Şu anki durumu analiz et ve karar ver:

1. CLOSE (Pozisyonu Kapat):
   - Trend zayıfladı
   - Ters yönde güçlü pattern oluştu
   - Resistance/Support'a ulaştı
   - Momentum bitti (volume düştü)
   - Kar yeterli, riski azalt

2. HOLD (Bekle):
   - Trend devam ediyor
   - Henüz hedef bölgeye ulaşmadı
   - Momentum güçlü

3. MOVE_STOP_LOSS (Trailing Stop):
   - Kar var ve trendi korumak istiyoruz
   - Stop Loss'u yukarı/aşağı çek (karı kilitle)

JSON formatında cevap ver:
{{
  "action": "CLOSE veya HOLD veya MOVE_STOP_LOSS",
  "reason": "Kısa açıklama",
  "new_stop_loss": 45500.0  // Sadece MOVE_STOP_LOSS için
}}
"""
        
        try:
            response = requests.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {"role": "system", "content": "Sen bir profesyonel crypto trader'sın."},
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.3
                },
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            content = result["choices"][0]["message"]["content"]
            decision = json.loads(content)
            
            return decision
            
        except Exception as e:
            print(f"❌ Çıkış analizi hatası: {e}")
            return {
                "action": "HOLD",
                "reason": f"Analiz hatası: {str(e)}",
                "new_stop_loss": position["stop_loss"]
            }
    
    def _format_candles(self, candles: List[Dict]) -> str:
        """Mum verilerini LLM için formatla"""
        
        if not candles:
            return "Veri yok"
        
        # Son 50 mumu al (çok fazla veri gönderme)
        recent_candles = candles[-50:]
        
        formatted = "Mum Verileri (Son 50 mum):\n\n"
        formatted += "Index | Open    | High    | Low     | Close   | Volume\n"
        formatted += "------|---------|---------|---------|---------|----------\n"
        
        for i, candle in enumerate(recent_candles):
            formatted += f"{i:5d} | {candle['open']:7.2f} | {candle['high']:7.2f} | {candle['low']:7.2f} | {candle['close']:7.2f} | {candle['volume']:8.2f}\n"
        
        # Özet bilgiler
        latest = recent_candles[-1]
        prev = recent_candles[-2] if len(recent_candles) > 1 else latest
        
        change = ((latest['close'] - prev['close']) / prev['close']) * 100
        avg_volume = sum(c['volume'] for c in recent_candles) / len(recent_candles)
        
        formatted += f"\n=== ÖZET ===\n"
        formatted += f"Son Fiyat: ${latest['close']:.2f}\n"
        formatted += f"Değişim: {change:+.2f}%\n"
        formatted += f"Ortalama Volume: {avg_volume:.2f}\n"
        formatted += f"Son Mum Volume: {latest['volume']:.2f} ({'Yüksek' if latest['volume'] > avg_volume * 1.5 else 'Normal'})\n"
        
        return formatted


# Test fonksiyonu
if __name__ == "__main__":
    # Örnek kullanım
    client = LLMClient()
    
    # Örnek mum verileri
    test_candles = [
        {"open": 45000, "high": 45200, "low": 44800, "close": 45100, "volume": 1000},
        {"open": 45100, "high": 45300, "low": 45000, "close": 45250, "volume": 1200},
        {"open": 45250, "high": 45500, "low": 45200, "close": 45400, "volume": 1500},
    ]
    
    from pattern_knowledge import get_pattern_knowledge
    
    result = client.analyze_chart(test_candles, "1h", get_pattern_knowledge())
    print(json.dumps(result, indent=2))
