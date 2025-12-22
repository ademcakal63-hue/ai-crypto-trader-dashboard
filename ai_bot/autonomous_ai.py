"""
Autonomous AI Trader - Tam Bağımsız AI Karar Mekanizması

Bu modül AI'ın tüm trading kararlarını vermesini sağlar.
Kod sadece AI'ın kararlarını uygular, hiçbir sabit kural yok.

AI şunları görebilir:
- Order book (alıcı/satıcı duvarları, whale aktivitesi)
- Mum verileri (fiyat, hacim, pattern'ler)
- Açık pozisyonlar ve P&L
- Bekleyen emirler
- Günlük performans

AI şunlara karar verebilir:
- WAIT: Bekle, hiçbir şey yapma
- PLACE_LIMIT_ORDER: Limit emir koy (fiyat, yön, SL, TP)
- CANCEL_ORDER: Bekleyen emri iptal et
- OPEN_MARKET: Market emri ile pozisyon aç
- CLOSE_POSITION: Pozisyonu kapat
- MODIFY_SL_TP: Stop loss veya take profit değiştir
"""

import json
import os
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime
from models import normalize_params, AIDecision, validate_position_params

class AutonomousAI:
    """
    Tam Bağımsız AI Trader
    
    Tüm verileri alır, düşünür, karar verir.
    Hiçbir sabit kural yok - AI kendi stratejisini geliştirir.
    """
    
    def __init__(self, api_key: str = None, dashboard_url: str = None):
        # OpenAI API direkt kullan
        self.api_url = "https://api.openai.com/v1/chat/completions"
        self.dashboard_url = dashboard_url or os.getenv("DASHBOARD_URL", "http://localhost:3000")
        
        # Önce parametre olarak verilen key'i kullan
        if api_key:
            self.api_key = api_key
        else:
            # Dashboard'dan API key'i çek (her zaman güncel key'i al)
            self._load_api_key_from_dashboard()
        
        # Karar geçmişi (fine-tuning için)
        self.decision_history = []
        
        # System prompt - AI'ın kimliği ve yetenekleri
        self.system_prompt = """Sen profesyonel bir kripto trader AI'sın. BTCUSDT Futures piyasasında işlem yapıyorsun.

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
    "params": { ... },  // action'a göre gerekli parametreler
    "analysis": {
        "market_structure": "...",
        "order_flow": "...",
        "key_levels": [...],
        "risk_assessment": "..."
    },
    "reasoning": "Detaylı açıklama...",
    "confidence": 0.0-1.0,
    "risk_reward": 0.0  // Eğer işlem açıyorsan
}
"""
    
    def _load_api_key_from_dashboard(self):
        """Dashboard'dan OpenAI API key'i yükle"""
        self.api_key = None
        try:
            resp = requests.get(f"{self.dashboard_url}/api/trpc/settings.get", timeout=5)
            if resp.status_code == 200:
                data = resp.json().get('result', {}).get('data', {})
                if 'json' in data:
                    data = data['json']
                self.api_key = data.get('openaiApiKey')
                if self.api_key:
                    print(f"✅ OpenAI API key loaded from Dashboard: {self.api_key[:20]}...")
                else:
                    print(f"⚠️ No OpenAI API key found in Dashboard settings")
            else:
                print(f"⚠️ Dashboard returned status {resp.status_code}")
        except Exception as e:
            print(f"⚠️ Could not load API key from Dashboard: {e}")

    def make_decision(self, market_data: Dict) -> Dict:
        """
        Tüm piyasa verilerini al ve karar ver
        
        Args:
            market_data: {
                "current_price": float,
                "candles": [...],  # Son mumlar
                "order_book": {...},  # Order book analizi
                "open_positions": [...],  # Açık pozisyonlar
                "pending_orders": [...],  # Bekleyen emirler
                "daily_pnl": float,
                "balance": float,
                "capital": float
            }
        
        Returns:
            AI'ın kararı
        """
        if not self.api_key:
            return {
                "action": "WAIT",
                "reasoning": "API key yok",
                "confidence": 0
            }
        
        # Piyasa verilerini hazırla
        user_message = self._prepare_market_summary(market_data)
        
        try:
            # OpenAI API kullan
            payload = {
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "response_format": {"type": "json_object"},
                "max_tokens": 4000
            }
            
            response = requests.post(
                self.api_url,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                },
                json=payload,
                timeout=60
            )
            
            if response.status_code != 200:
                raise Exception(f"API Error: {response.status_code} - {response.text}")
            
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")
            decision = json.loads(content)
            
            # Parametreleri standartlaştır (price -> entry_price, reason -> reasoning)
            if 'params' in decision:
                decision['params'] = normalize_params(decision['params'])
            
            # Kararı logla (fine-tuning için)
            self._log_decision(market_data, decision)
            
            return decision
            
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e}")
            return {
                "action": "WAIT",
                "reasoning": f"JSON parse hatası: {str(e)}",
                "confidence": 0
            }
        except Exception as e:
            print(f"AI Decision Error: {e}")
            return {
                "action": "WAIT",
                "reasoning": f"Hata: {str(e)}",
                "confidence": 0
            }
    
    def _prepare_market_summary(self, data: Dict) -> str:
        """Piyasa verilerini AI için özetle"""
        
        summary = f"""
## GÜNCEL PİYASA VERİLERİ

### Fiyat Bilgisi
- Güncel Fiyat: ${data.get('current_price', 0):,.2f}
- 24h Değişim: {data.get('price_change_24h', 0):.2f}%

### Order Book Analizi
{self._format_order_book(data.get('order_book', {}))}

### Son Mumlar (15m)
{self._format_candles(data.get('candles', []))}

### SMC Pattern'ler
{self._format_patterns(data.get('patterns', {}))}

### Açık Pozisyonlar
{self._format_positions(data.get('open_positions', []))}

### Bekleyen Emirler
{self._format_pending_orders(data.get('pending_orders', []))}

### Hesap Durumu
- Sermaye: ${data.get('capital', 10000):,.2f}
- Güncel Bakiye: ${data.get('balance', 10000):,.2f}
- Günlük P&L: ${data.get('daily_pnl', 0):,.2f}
- Günlük Kayıp Limiti: ${data.get('daily_loss_limit', 400):,.2f}

---
Şimdi tüm bu verileri analiz et ve ne yapılması gerektiğine karar ver.
"""
        return summary
    
    def _format_order_book(self, ob: Dict) -> str:
        if not ob:
            return "Order book verisi yok"
        
        lines = []
        lines.append(f"- Whale Bias: {ob.get('whale_bias', 'NEUTRAL')}")
        lines.append(f"- Buy Pressure: {ob.get('buy_pressure', 0)*100:.1f}%")
        lines.append(f"- Sell Pressure: {ob.get('sell_pressure', 0)*100:.1f}%")
        
        buy_walls = ob.get('walls', {}).get('buy', [])
        sell_walls = ob.get('walls', {}).get('sell', [])
        
        if buy_walls:
            lines.append(f"- Buy Walls: {len(buy_walls)} adet")
            for w in buy_walls[:3]:
                lines.append(f"  • ${w.get('value_usd', 0):,.0f} @ {w.get('price', 0):,.2f}")
        
        if sell_walls:
            lines.append(f"- Sell Walls: {len(sell_walls)} adet")
            for w in sell_walls[:3]:
                lines.append(f"  • ${w.get('value_usd', 0):,.0f} @ {w.get('price', 0):,.2f}")
        
        # Whale trades
        whale_trades = ob.get('whale_trades', [])
        if whale_trades:
            lines.append(f"- Son Whale İşlemler: {len(whale_trades)} adet")
            for t in whale_trades[-3:]:
                lines.append(f"  • {t.get('direction', '?')} ${t.get('value_usd', 0):,.0f} @ {t.get('price', 0):,.2f}")
        
        # Absorptions
        absorptions = ob.get('absorptions', [])
        if absorptions:
            lines.append(f"- Absorption Tespiti: {len(absorptions)} adet")
            for a in absorptions[-3:]:
                lines.append(f"  • {a.get('type', '?')} @ {a.get('price', 0):,.0f} - ${a.get('volume_usd', 0):,.0f}")
        
        return "\n".join(lines)
    
    def _format_candles(self, candles: List) -> str:
        if not candles:
            return "Mum verisi yok"
        
        lines = []
        # Son 10 mum
        for c in candles[-10:]:
            if isinstance(c, dict):
                o, h, l, close = c.get('open', 0), c.get('high', 0), c.get('low', 0), c.get('close', 0)
                vol = c.get('volume', 0)
                direction = "🟢" if close > o else "🔴"
                change = ((close - o) / o * 100) if o > 0 else 0
                lines.append(f"{direction} O:{o:.0f} H:{h:.0f} L:{l:.0f} C:{close:.0f} ({change:+.2f}%) Vol:{vol:.0f}")
            elif isinstance(c, (list, tuple)) and len(c) >= 5:
                o, h, l, close = float(c[1]), float(c[2]), float(c[3]), float(c[4])
                vol = float(c[5]) if len(c) > 5 else 0
                direction = "🟢" if close > o else "🔴"
                change = ((close - o) / o * 100) if o > 0 else 0
                lines.append(f"{direction} O:{o:.0f} H:{h:.0f} L:{l:.0f} C:{close:.0f} ({change:+.2f}%)")
        
        return "\n".join(lines) if lines else "Mum verisi formatı uyumsuz"
    
    def _format_patterns(self, patterns: Dict) -> str:
        if not patterns:
            return "Pattern tespit edilmedi"
        
        lines = []
        
        obs = patterns.get('order_blocks', [])
        if obs:
            lines.append(f"Order Blocks: {len(obs)} adet")
            for ob in obs[:3]:
                lines.append(f"  • {ob.get('type', '?')} @ {ob.get('price', 0):,.0f} (strength: {ob.get('strength', 0):.2f})")
        
        fvgs = patterns.get('fair_value_gaps', [])
        if fvgs:
            lines.append(f"Fair Value Gaps: {len(fvgs)} adet")
            for fvg in fvgs[:3]:
                lines.append(f"  • {fvg.get('type', '?')} {fvg.get('low', 0):,.0f}-{fvg.get('high', 0):,.0f}")
        
        sweeps = patterns.get('liquidity_sweeps', [])
        if sweeps:
            lines.append(f"Liquidity Sweeps: {len(sweeps)} adet")
            for s in sweeps[:3]:
                lines.append(f"  • {s.get('type', '?')} @ {s.get('price', 0):,.0f}")
        
        bos = patterns.get('break_of_structure', [])
        if bos:
            lines.append(f"Break of Structure: {len(bos)} adet")
            for b in bos[:3]:
                lines.append(f"  • {b.get('type', '?')} @ {b.get('price', 0):,.0f}")
        
        return "\n".join(lines) if lines else "Pattern yok"
    
    def _format_positions(self, positions: List) -> str:
        if not positions:
            return "Açık pozisyon yok"
        
        lines = []
        for p in positions:
            side = p.get('side', '?')
            entry = p.get('entry_price', 0)
            pnl = p.get('pnl', 0)
            pnl_pct = p.get('pnl_percent', 0)
            sl = p.get('stop_loss', 0)
            tp = p.get('take_profit', 0)
            
            emoji = "🟢" if pnl >= 0 else "🔴"
            lines.append(f"{emoji} {side} @ {entry:,.2f} | P&L: ${pnl:,.2f} ({pnl_pct:+.2f}%) | SL: {sl:,.2f} | TP: {tp:,.2f}")
        
        return "\n".join(lines)
    
    def _format_pending_orders(self, orders: List) -> str:
        if not orders:
            return "Bekleyen emir yok"
        
        lines = []
        for o in orders:
            side = o.get('side', '?')
            # entry_price veya price alanını kontrol et
            price = o.get('entry_price', o.get('price', 0))
            sl = o.get('stop_loss', 0)
            tp = o.get('take_profit', 0)
            order_id = o.get('order_id', '?')
            
            lines.append(f"📝 {side} @ {price:,.2f} | SL: {sl:,.2f} | TP: {tp:,.2f} | ID: {order_id}")
        
        return "\n".join(lines)
    
    def _log_decision(self, market_data: Dict, decision: Dict):
        """Kararı logla (fine-tuning için)"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "market_data_summary": {
                "price": market_data.get('current_price'),
                "whale_bias": market_data.get('order_book', {}).get('whale_bias'),
                "buy_pressure": market_data.get('order_book', {}).get('buy_pressure'),
                "open_positions": len(market_data.get('open_positions', [])),
                "pending_orders": len(market_data.get('pending_orders', []))
            },
            "decision": decision
        }
        
        self.decision_history.append(log_entry)
        
        # Son 1000 kararı tut
        if len(self.decision_history) > 1000:
            self.decision_history = self.decision_history[-1000:]
        
        # Dosyaya da yaz
        try:
            log_file = "logs/ai_decisions.jsonl"
            os.makedirs("logs", exist_ok=True)
            with open(log_file, "a") as f:
                f.write(json.dumps(log_entry) + "\n")
        except Exception as e:
            print(f"Decision log error: {e}")
    
    def get_decision_stats(self) -> Dict:
        """Karar istatistiklerini döndür"""
        if not self.decision_history:
            return {"total_decisions": 0}
        
        actions = {}
        for d in self.decision_history:
            action = d.get('decision', {}).get('action', 'UNKNOWN')
            actions[action] = actions.get(action, 0) + 1
        
        return {
            "total_decisions": len(self.decision_history),
            "action_breakdown": actions,
            "avg_confidence": sum(d.get('decision', {}).get('confidence', 0) for d in self.decision_history) / len(self.decision_history)
        }
