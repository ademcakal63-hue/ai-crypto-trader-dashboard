#!/usr/bin/env python3
"""
Local AI Decision Module - Uses OpenAI API directly
No Dashboard dependency - works standalone on VPS
"""

import os
import json
from typing import Dict, List, Optional
from openai import OpenAI

SYSTEM_PROMPT = """Sen profesyonel bir kripto trader AI'sın. BTCUSDT Futures piyasasında işlem yapıyorsun.

## SENİN GÖREVİN
Sana verilen tüm piyasa verilerini analiz et ve ne yapılması gerektiğine TAMAMEN SEN karar ver.
Hiçbir sabit kural yok - sen kendi stratejini geliştir ve uygula.

## TRADING BİLGİN
- Smart Money Concepts (SMC): Order Blocks, Fair Value Gaps, Liquidity Sweeps, Break of Structure
- Order Flow: Whale aktivitesi, alıcı/satıcı duvarları, absorption
- Risk yönetimi: Position sizing, stop loss, take profit
- Piyasa yapısı: Trend, momentum, volatilite

## SERMAYE VE RİSK
- Paper trading sermayesi: $10,000
- Her işlemde maksimum %2 risk ($200)
- Günlük maksimum kayıp: %4 ($400)
- Kaldıraç: 1x-10x arası (sen belirle)

## KARARLARİN
Şu kararlardan BİRİNİ ver:

1. WAIT - Bekle, hiçbir şey yapma
   Sebep: Uygun setup yok, piyasa belirsiz, vs.

2. PLACE_LIMIT_ORDER - Limit emir koy
   Gerekli: side (BUY/SELL), price, stop_loss, take_profit, leverage, reason

3. CANCEL_ORDER - Bekleyen emri iptal et
   Gerekli: order_id, reason

4. OPEN_MARKET - Market emri ile hemen pozisyon aç
   Gerekli: side (BUY/SELL), stop_loss, take_profit, leverage, reason

5. CLOSE_POSITION - Açık pozisyonu kapat
   Gerekli: position_id, reason

6. MODIFY_SL_TP - Stop loss veya take profit değiştir
   Gerekli: position_id, new_stop_loss, new_take_profit, reason

## ÖNEMLİ
- Her kararında NEDEN bu kararı verdiğini açıkla
- Risk/Reward oranını hesapla
- Piyasa koşullarını değerlendir
- Hata yapmaktan korkma - paper trading'de öğreniyorsun
- Agresif veya konservatif olabilirsin - sen karar ver

## ÇIKTI FORMATI
JSON formatında cevap ver:
{
    "action": "WAIT|PLACE_LIMIT_ORDER|CANCEL_ORDER|OPEN_MARKET|CLOSE_POSITION|MODIFY_SL_TP",
    "params": { ... },
    "analysis": {
        "market_structure": "...",
        "order_flow": "...",
        "key_levels": [...],
        "risk_assessment": "..."
    },
    "reasoning": "Detaylı açıklama...",
    "confidence": 0.0-1.0,
    "risk_reward": 0.0
}"""


class LocalAIDecision:
    """Local AI Decision using OpenAI API directly"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("❌ OpenAI API key not found! Set OPENAI_API_KEY environment variable.")
        
        self.client = OpenAI(
            api_key=self.api_key,
            base_url="https://api.openai.com/v1"
        )
        self.model = "gpt-4-turbo-preview"
        print(f"✅ Local AI Decision initialized with OpenAI API")
    
    def _format_order_book(self, ob: Dict) -> str:
        """Format order book data for AI"""
        if not ob:
            return "Order book verisi yok"
        
        lines = []
        lines.append(f"- Whale Bias: {ob.get('whale_bias', 'NEUTRAL')}")
        lines.append(f"- Buy Pressure: {(ob.get('buy_pressure', 0) * 100):.1f}%")
        lines.append(f"- Sell Pressure: {(ob.get('sell_pressure', 0) * 100):.1f}%")
        
        buy_walls = ob.get('walls', {}).get('buy', [])
        sell_walls = ob.get('walls', {}).get('sell', [])
        
        if buy_walls:
            lines.append(f"- Buy Walls: {len(buy_walls)} adet")
            for w in buy_walls[:3]:
                lines.append(f"  • ${w.get('value_usd', 0):,.0f} @ {w.get('price', 0):,.0f}")
        
        if sell_walls:
            lines.append(f"- Sell Walls: {len(sell_walls)} adet")
            for w in sell_walls[:3]:
                lines.append(f"  • ${w.get('value_usd', 0):,.0f} @ {w.get('price', 0):,.0f}")
        
        return '\n'.join(lines)
    
    def _format_candles(self, candles: List) -> str:
        """Format candle data for AI"""
        if not candles:
            return "Mum verisi yok"
        
        lines = []
        for c in candles[-10:]:
            if isinstance(c, (list, tuple)) and len(c) >= 5:
                o, h, l, close = float(c[1]), float(c[2]), float(c[3]), float(c[4])
                direction = "🟢" if close > o else "🔴"
                change = ((close - o) / o * 100) if o > 0 else 0
                lines.append(f"{direction} O:{o:.0f} H:{h:.0f} L:{l:.0f} C:{close:.0f} ({change:.2f}%)")
        
        return '\n'.join(lines) if lines else "Mum verisi formatı uyumsuz"
    
    def _format_patterns(self, patterns: Dict) -> str:
        """Format SMC patterns for AI"""
        if not patterns:
            return "Pattern tespit edilmedi"
        
        lines = []
        
        if patterns.get('order_blocks'):
            lines.append(f"Order Blocks: {len(patterns['order_blocks'])} adet")
            for ob in patterns['order_blocks'][:3]:
                lines.append(f"  • {ob.get('type', '?')} @ {ob.get('price', 0):,.0f} (strength: {ob.get('strength', 0):.2f})")
        
        if patterns.get('fair_value_gaps'):
            lines.append(f"Fair Value Gaps: {len(patterns['fair_value_gaps'])} adet")
            for fvg in patterns['fair_value_gaps'][:3]:
                lines.append(f"  • {fvg.get('type', '?')} {fvg.get('low', 0):,.0f}-{fvg.get('high', 0):,.0f}")
        
        return '\n'.join(lines) if lines else "Pattern yok"
    
    def _format_positions(self, positions: List) -> str:
        """Format open positions for AI"""
        if not positions:
            return "Açık pozisyon yok"
        
        lines = []
        for p in positions:
            emoji = "🟢" if p.get('pnl', 0) >= 0 else "🔴"
            lines.append(
                f"{emoji} {p.get('side', '?')} @ {p.get('entry_price', 0):,.0f} | "
                f"P&L: ${p.get('pnl', 0):.2f} ({p.get('pnl_percent', 0):.2f}%) | "
                f"SL: {p.get('stop_loss', 0):,.0f} | TP: {p.get('take_profit', 0):,.0f}"
            )
        return '\n'.join(lines)
    
    def _format_pending_orders(self, orders: List) -> str:
        """Format pending orders for AI"""
        if not orders:
            return "Bekleyen emir yok"
        
        lines = []
        for o in orders:
            lines.append(
                f"📝 {o.get('side', '?')} @ {o.get('price', 0):,.0f} | "
                f"SL: {o.get('stop_loss', 0):,.0f} | TP: {o.get('take_profit', 0):,.0f} | "
                f"ID: {o.get('order_id', '?')}"
            )
        return '\n'.join(lines)
    
    def _prepare_market_summary(self, data: Dict) -> str:
        """Prepare market summary for AI"""
        return f"""
## GÜNCEL PİYASA VERİLERİ

### Fiyat Bilgisi
- Güncel Fiyat: ${data.get('current_price', 0):,.2f}
- 24h Değişim: {data.get('price_change_24h', 0):.2f}%

### Order Book Analizi
{self._format_order_book(data.get('order_book'))}

### Son Mumlar (15m)
{self._format_candles(data.get('candles', []))}

### SMC Pattern'ler
{self._format_patterns(data.get('patterns'))}

### Açık Pozisyonlar
{self._format_positions(data.get('open_positions', []))}

### Bekleyen Emirler
{self._format_pending_orders(data.get('pending_orders', []))}

### Hesap Durumu
- Sermaye: ${data.get('capital', 10000):,.0f}
- Güncel Bakiye: ${data.get('balance', 10000):,.0f}
- Günlük P&L: ${data.get('daily_pnl', 0):.2f}
- Günlük Kayıp Limiti: ${data.get('daily_loss_limit', 400):.2f}

---
Şimdi tüm bu verileri analiz et ve ne yapılması gerektiğine karar ver.
"""
    
    def make_decision(self, market_data: Dict) -> Dict:
        """Make AI trading decision using OpenAI API"""
        try:
            user_message = self._prepare_market_summary(market_data)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from OpenAI")
            
            decision = json.loads(content)
            return decision
            
        except Exception as e:
            print(f"❌ Local AI Decision Error: {e}")
            return {
                "action": "WAIT",
                "reasoning": f"AI hatası: {str(e)}",
                "confidence": 0
            }


# Test
if __name__ == "__main__":
    ai = LocalAIDecision()
    
    test_data = {
        "current_price": 91000,
        "price_change_24h": 2.5,
        "candles": [[0, 90000, 91500, 89500, 91000, 1000]] * 10,
        "patterns": {"order_blocks": [], "fair_value_gaps": []},
        "order_book": {"whale_bias": "NEUTRAL", "buy_pressure": 0.5, "sell_pressure": 0.5},
        "open_positions": [],
        "pending_orders": [],
        "balance": 10000,
        "capital": 10000,
        "daily_pnl": 0,
        "daily_loss_limit": 400
    }
    
    decision = ai.make_decision(test_data)
    print(json.dumps(decision, indent=2))
