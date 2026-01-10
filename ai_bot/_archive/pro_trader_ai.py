"""
Pro Trader AI - Advanced Trading Decision Module
Real professional trader logic with SMC, Order Flow, and Risk Management
"""

import os
import json
from typing import Dict, List, Optional
from openai import OpenAI

class ProTraderAI:
    """
    Professional Trader AI - Makes decisions like a real pro trader
    
    Key Principles:
    1. Single position at a time (full capital utilization)
    2. Entry only at OB/FVG/Sweep zones
    3. Dynamic position sizing based on SL distance
    4. Minimum R:R of 1:2
    5. Can close and reverse position if market structure changes
    6. Learns from every trade (fine-tuning)
    """
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("❌ OpenAI API key not provided!")
        
        self.client = OpenAI(
            api_key=self.api_key,
            base_url="https://api.openai.com/v1"
        )
        self.model = "gpt-4-turbo-preview"
        
        # Trading parameters
        self.RISK_PERCENT = 2.0  # 2% risk per trade
        self.MAX_DAILY_LOSS_PERCENT = 4.0  # 4% max daily loss
        self.MIN_RR_RATIO = 2.0  # Minimum 1:2 R:R
        self.MAX_LEVERAGE = 10  # Maximum leverage
        
    def analyze_market_structure(self, 
                                 symbol: str,
                                 candles: List[Dict],
                                 smc_data: Dict,
                                 order_book: Dict,
                                 current_position: Optional[Dict] = None) -> Dict:
        """
        Comprehensive market structure analysis
        
        Returns:
            {
                "trend": "BULLISH" | "BEARISH" | "RANGING",
                "structure_break": bool,
                "entry_zones": [...],
                "bias": "LONG" | "SHORT" | "NEUTRAL"
            }
        """
        
        last_candle = candles[-1]
        current_price = last_candle['close']
        
        # Prepare analysis context
        context = {
            "symbol": symbol,
            "current_price": current_price,
            "recent_candles": candles[-30:],  # Last 30 candles
            "smc_patterns": {
                "order_blocks": smc_data.get('order_blocks', []),
                "fair_value_gaps": smc_data.get('fair_value_gaps', []),
                "liquidity_sweeps": smc_data.get('liquidity_sweeps', []),
                "break_of_structure": smc_data.get('break_of_structure', []),
                "support_resistance": smc_data.get('support_resistance', [])
            },
            "order_book": {
                "imbalance": order_book.get('imbalance', 0),
                "large_orders": order_book.get('large_orders', [])[:5],
                "liquidity_zones": order_book.get('liquidity_zones', [])
            },
            "current_position": current_position
        }
        
        prompt = f"""
Sen profesyonel bir kripto trader'sın. Piyasa yapısını analiz et.

**Market Verisi:**
{json.dumps(context, indent=2)}

**Analiz Görevleri:**

1. **TREND ANALİZİ:**
   - Higher Highs (HH) ve Higher Lows (HL) → BULLISH
   - Lower Highs (LH) ve Lower Lows (LL) → BEARISH
   - Yatay hareket → RANGING

2. **STRUCTURE BREAK (BOS/CHoCH):**
   - Son mumlar önemli bir seviyeyi kırdı mı?
   - CHoCH (Change of Character) var mı? → Trend dönüşü sinyali
   - BOS (Break of Structure) var mı? → Trend devamı sinyali

3. **GİRİŞ BÖLGELERİ (Entry Zones):**
   - Order Block'lar (OB): Fiyatın geri dönebileceği güçlü bölgeler
   - Fair Value Gap'ler (FVG): Doldurulması gereken boşluklar
   - Likidite Sweep bölgeleri: Stop hunt sonrası giriş fırsatları
   - Fiyat şu an bu bölgelerden birinde mi?

4. **ORDER BOOK ANALİZİ:**
   - Büyük alım/satım emirleri nerede?
   - İmbalance yönü ne söylüyor?
   - Likidite nerede birikmiş?

5. **MEVCUT POZİSYON DEĞERLENDİRMESİ:**
   - Açık pozisyon varsa, piyasa yapısı hala destekliyor mu?
   - Kapatılması gereken bir durum var mı?

**YANIT FORMATI (JSON):**
{{
  "trend": "BULLISH" | "BEARISH" | "RANGING",
  "trend_strength": 0.0-1.0,
  "structure_break": {{
    "detected": true/false,
    "type": "BOS" | "CHoCH" | null,
    "direction": "BULLISH" | "BEARISH" | null,
    "description": "..."
  }},
  "entry_zones": [
    {{
      "type": "OB" | "FVG" | "SWEEP",
      "price_range": [low, high],
      "direction": "LONG" | "SHORT",
      "strength": 0.0-1.0,
      "description": "..."
    }}
  ],
  "price_at_entry_zone": {{
    "is_at_zone": true/false,
    "zone_type": "OB" | "FVG" | "SWEEP" | null,
    "zone_direction": "LONG" | "SHORT" | null
  }},
  "order_book_bias": "BULLISH" | "BEARISH" | "NEUTRAL",
  "overall_bias": "LONG" | "SHORT" | "NEUTRAL",
  "should_close_position": {{
    "close": true/false,
    "reason": "..."
  }},
  "analysis_summary": "..."
}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Sen profesyonel bir kripto trader'sın. Smart Money Concepts ve order flow analizi konusunda uzmansın."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            print(f"❌ Market structure analysis error: {e}")
            return {
                "trend": "RANGING",
                "trend_strength": 0,
                "structure_break": {"detected": False},
                "entry_zones": [],
                "price_at_entry_zone": {"is_at_zone": False},
                "order_book_bias": "NEUTRAL",
                "overall_bias": "NEUTRAL",
                "should_close_position": {"close": False},
                "analysis_summary": f"Error: {str(e)}"
            }
    
    def make_trading_decision(self,
                              market_analysis: Dict,
                              current_price: float,
                              capital: float,
                              daily_pnl: float,
                              current_position: Optional[Dict] = None) -> Dict:
        """
        Make final trading decision like a pro trader
        
        Returns:
            {
                "action": "OPEN_LONG" | "OPEN_SHORT" | "CLOSE" | "CLOSE_AND_REVERSE" | "HOLD",
                "entry_price": float,
                "stop_loss": float,
                "take_profit": float,
                "position_size_usd": float,
                "leverage": float,
                "confidence": float,
                "reasoning": str
            }
        """
        
        daily_loss_percent = abs(min(0, daily_pnl)) / capital * 100
        remaining_risk = self.MAX_DAILY_LOSS_PERCENT - daily_loss_percent
        
        context = {
            "market_analysis": market_analysis,
            "current_price": current_price,
            "capital": capital,
            "daily_pnl": daily_pnl,
            "daily_loss_percent": daily_loss_percent,
            "remaining_risk_percent": remaining_risk,
            "current_position": current_position,
            "risk_per_trade": self.RISK_PERCENT,
            "min_rr_ratio": self.MIN_RR_RATIO
        }
        
        prompt = f"""
Sen profesyonel bir kripto trader'sın. Trading kararı ver.

**MEVCUT DURUM:**
{json.dumps(context, indent=2)}

**TRADING KURALLARI (ZORUNLU):**

1. **TEK POZİSYON KURALI:**
   - Aynı anda sadece 1 pozisyon açılabilir
   - Açık pozisyon varken yeni pozisyon AÇILAMAZ
   - Ters yöne geçmek için önce mevcut pozisyon kapatılmalı

2. **GİRİŞ KRİTERLERİ (SADECE BUNLARDA GİR):**
   - Order Block (OB) bölgesinde
   - Fair Value Gap (FVG) bölgesinde
   - Likidite Sweep sonrası
   - Fiyat entry zone'da DEĞİLSE → HOLD

3. **RİSK YÖNETİMİ:**
   - Her işlemde sermayenin %{self.RISK_PERCENT}'i riske edilir
   - Günlük max kayıp: %{self.MAX_DAILY_LOSS_PERCENT}
   - Kalan günlük risk: %{remaining_risk:.2f}
   - Minimum R:R oranı: 1:{self.MIN_RR_RATIO}

4. **POZİSYON BOYUTU HESAPLAMA:**
   - Risk miktarı = Sermaye × %{self.RISK_PERCENT} = ${capital * self.RISK_PERCENT / 100:.2f}
   - SL mesafesi geniş ise → Düşük kaldıraç, küçük pozisyon
   - SL mesafesi dar ise → Yüksek kaldıraç, büyük pozisyon
   - Max kaldıraç: {self.MAX_LEVERAGE}x

5. **POZİSYON KAPATMA:**
   - Piyasa yapısı değişirse (CHoCH) → Kapat
   - SL'e yaklaşıyorsa ve yapı bozulduysa → Kapat
   - R:R hedefine ulaşıldıysa → Kapat

6. **TERS POZİSYON (CLOSE_AND_REVERSE):**
   - CHoCH tespit edilirse VE
   - Yeni yönde güçlü entry zone varsa VE
   - Confidence > 0.8 ise
   - → Mevcut pozisyonu kapat ve ters yönde aç

**YANIT FORMATI (JSON):**
{{
  "action": "OPEN_LONG" | "OPEN_SHORT" | "CLOSE" | "CLOSE_AND_REVERSE" | "HOLD",
  "entry_price": float,
  "stop_loss": float,
  "take_profit": float,
  "sl_distance_percent": float,
  "rr_ratio": float,
  "position_size_usd": float,
  "leverage": float,
  "margin_used": float,
  "risk_amount_usd": float,
  "confidence": 0.0-1.0,
  "entry_zone_type": "OB" | "FVG" | "SWEEP" | null,
  "reasoning": "Detaylı açıklama...",
  "trade_management": {{
    "trailing_stop": true/false,
    "partial_tp_levels": [float, float, ...],
    "breakeven_trigger": float
  }}
}}

**ÖNEMLİ:**
- Fiyat entry zone'da değilse → action: "HOLD"
- R:R < {self.MIN_RR_RATIO} ise → action: "HOLD"
- Günlük kayıp limiti dolmuşsa → action: "HOLD"
- Açık pozisyon varsa ve kapatma sebebi yoksa → action: "HOLD"
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Sen profesyonel bir kripto trader'sın. Disiplinli ve kurallara bağlı trading yaparsın."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1  # Very low for consistent decisions
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Validate the decision
            result = self._validate_decision(result, capital, current_position, remaining_risk)
            
            return result
            
        except Exception as e:
            print(f"❌ Trading decision error: {e}")
            return {
                "action": "HOLD",
                "confidence": 0,
                "reasoning": f"Error: {str(e)}"
            }
    
    def _validate_decision(self, decision: Dict, capital: float, 
                          current_position: Optional[Dict], remaining_risk: float) -> Dict:
        """Validate and correct AI decision if needed"""
        
        action = decision.get('action', 'HOLD')
        
        # Rule 1: Can't open new position if one is already open
        if action in ['OPEN_LONG', 'OPEN_SHORT'] and current_position:
            decision['action'] = 'HOLD'
            decision['reasoning'] = f"Pozisyon zaten açık. Yeni pozisyon açılamaz. Orijinal karar: {action}"
            return decision
        
        # Rule 2: Check R:R ratio
        rr_ratio = decision.get('rr_ratio', 0)
        if action in ['OPEN_LONG', 'OPEN_SHORT'] and rr_ratio < self.MIN_RR_RATIO:
            decision['action'] = 'HOLD'
            decision['reasoning'] = f"R:R oranı ({rr_ratio:.2f}) minimum ({self.MIN_RR_RATIO}) altında. İşlem iptal."
            return decision
        
        # Rule 3: Check daily loss limit
        if action in ['OPEN_LONG', 'OPEN_SHORT'] and remaining_risk < self.RISK_PERCENT:
            decision['action'] = 'HOLD'
            decision['reasoning'] = f"Günlük kayıp limitine yaklaşıldı. Kalan risk: %{remaining_risk:.2f}"
            return decision
        
        # Rule 4: Validate position size
        if action in ['OPEN_LONG', 'OPEN_SHORT']:
            risk_amount = capital * (self.RISK_PERCENT / 100)
            sl_distance = decision.get('sl_distance_percent', 1)
            
            if sl_distance > 0:
                max_position = risk_amount / (sl_distance / 100)
                leverage = max_position / capital
                
                # Cap leverage
                if leverage > self.MAX_LEVERAGE:
                    leverage = self.MAX_LEVERAGE
                    max_position = capital * leverage
                
                decision['position_size_usd'] = max_position
                decision['leverage'] = round(leverage, 2)
                decision['margin_used'] = capital
                decision['risk_amount_usd'] = risk_amount
        
        return decision
    
    def evaluate_trade_for_learning(self, trade: Dict) -> Dict:
        """
        Evaluate a completed trade for learning/fine-tuning
        
        Returns analysis of what was done right/wrong
        """
        
        prompt = f"""
Tamamlanan bir trade'i analiz et ve öğrenme noktalarını çıkar.

**TRADE DETAYLARI:**
{json.dumps(trade, indent=2)}

**ANALİZ GÖREVLERİ:**

1. **GİRİŞ ANALİZİ:**
   - Giriş noktası doğru muydu?
   - Entry zone (OB/FVG/Sweep) kullanıldı mı?
   - Daha iyi bir giriş noktası var mıydı?

2. **ÇIKIŞ ANALİZİ:**
   - Çıkış zamanlaması doğru muydu?
   - SL/TP seviyeleri uygun muydu?
   - Erken mi çıkıldı, geç mi çıkıldı?

3. **RİSK YÖNETİMİ:**
   - Pozisyon boyutu uygun muydu?
   - R:R oranı yeterli miydi?

4. **NE ÖĞRENMELİ:**
   - Bu trade'den çıkarılacak dersler
   - Gelecekte ne yapılmalı/yapılmamalı

**YANIT FORMATI (JSON):**
{{
  "entry_quality": 0.0-1.0,
  "exit_quality": 0.0-1.0,
  "risk_management_quality": 0.0-1.0,
  "overall_quality": 0.0-1.0,
  "what_was_done_right": ["...", "..."],
  "what_was_done_wrong": ["...", "..."],
  "lessons_learned": ["...", "..."],
  "should_have_done": "...",
  "fine_tuning_data": {{
    "ideal_entry": float,
    "ideal_sl": float,
    "ideal_tp": float,
    "ideal_action": "LONG" | "SHORT" | "NO_TRADE"
  }}
}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Sen bir trading coach'sun. Trade'leri analiz edip öğrenme noktaları çıkarırsın."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            print(f"❌ Trade evaluation error: {e}")
            return {"error": str(e)}


# Example usage
if __name__ == "__main__":
    trader = ProTraderAI()
    print("Pro Trader AI initialized!")
