"""
AI Crypto Trading Bot - Ana Program

Kullanım:
    python main.py --symbol BTCUSDT --testnet

Env Variables:
    BINANCE_API_KEY: Binance API Key
    BINANCE_API_SECRET: Binance API Secret
    BINANCE_USE_TESTNET: true/false
    BUILT_IN_FORGE_API_KEY: Manus LLM API Key
    DASHBOARD_URL: Dashboard URL
"""

import os
import sys
import time
import argparse
from datetime import datetime
from typing import Dict, List, Optional

# Import modüller
from pattern_knowledge import get_pattern_knowledge
from llm_client import LLMClient
from binance_client import BinanceClient
from sentiment_analyzer import SentimentAnalyzer
from dashboard_client import DashboardClient

class AITradingBot:
    """Tam otonom AI Trading Bot"""
    
    def __init__(self, symbol: str = "BTCUSDT", testnet: bool = False):
        self.symbol = symbol
        self.testnet = testnet
        
        # Clients
        self.llm = LLMClient()
        self.binance = BinanceClient(testnet=testnet)
        self.sentiment = SentimentAnalyzer()
        self.dashboard = DashboardClient()
        
        # Pattern knowledge
        self.pattern_knowledge = get_pattern_knowledge()
        
        # State
        self.open_positions = {}  # {symbol: position_data}
        self.today_trades = []
        
        print(f"🤖 AI Trading Bot başlatıldı")
        print(f"Symbol: {symbol}")
        print(f"Testnet: {testnet}")
        print(f"Dashboard: {self.dashboard.dashboard_url}")
    
    def run(self):
        """Ana loop - sürekli çalış"""
        
        print("\n🚀 Bot çalışmaya başladı...")
        print("Ctrl+C ile durdurun\n")
        
        while True:
            try:
                # 1. Bot aktif mi kontrol et
                if not self.dashboard.is_bot_active():
                    print("⏸️  Bot Dashboard'dan durduruldu. Bekleniyor...")
                    time.sleep(30)
                    continue
                
                # 2. Günlük limit kontrolü
                loss_status = self.dashboard.check_daily_loss_limit()
                if loss_status["exceeded"]:
                    print(f"🚨 Günlük kayıp limiti aşıldı! ({loss_status['currentLoss']} / {loss_status['limit']})")
                    print("Bot otomatik durduruldu. Yarın tekrar başlayacak.")
                    time.sleep(3600)  # 1 saat bekle
                    continue
                
                # 3. Açık pozisyonları takip et
                self._monitor_open_positions()
                
                # 4. Yeni işlem fırsatı ara
                self._scan_for_opportunities()
                
                # 5. Bekle (1 dakika)
                time.sleep(60)
                
            except KeyboardInterrupt:
                print("\n\n⏹️  Bot durduruluyor...")
                self._cleanup()
                break
            except Exception as e:
                print(f"❌ Beklenmeyen hata: {e}")
                time.sleep(60)
    
    def _scan_for_opportunities(self):
        """Yeni işlem fırsatı ara"""
        
        print(f"\n🔍 [{datetime.now().strftime('%H:%M:%S')}] İşlem fırsatı taranıyor...")
        
        # Settings'i al
        settings = self.dashboard.get_settings()
        if not settings:
            print("⚠️ Settings alınamadı, atlıyorum")
            return
        
        # Günlük işlem limiti kontrolü
        max_daily_trades = int(settings.get("maxDailyTrades", 10))
        if len(self.today_trades) >= max_daily_trades:
            print(f"⏭️  Günlük işlem limiti doldu ({len(self.today_trades)}/{max_daily_trades})")
            return
        
        # Açık pozisyon varsa yeni işlem açma
        if self.symbol in self.open_positions:
            print(f"⏭️  {self.symbol} için açık pozisyon var, yeni işlem açılmıyor")
            return
        
        # 1. Sentiment analizi
        print("📰 Sentiment analizi yapılıyor...")
        sentiment_result = self.sentiment.analyze_sentiment(self.symbol[:3])  # BTC, ETH
        sentiment_score = sentiment_result["sentiment_score"]
        
        print(f"   Sentiment: {sentiment_score:+.2f} - {sentiment_result['summary']}")
        
        # Sentiment çok negatifse işlem açma
        sentiment_threshold = float(settings.get("sentimentThreshold", -0.3))
        if sentiment_score < sentiment_threshold:
            print(f"   ❌ Sentiment çok negatif ({sentiment_score} < {sentiment_threshold}), işlem açılmıyor")
            return
        
        # 2. Multi-timeframe grafik analizi
        print("📊 Grafik analizi yapılıyor...")
        
        # 1h timeframe'i analiz et (ana timeframe)
        klines_1h = self.binance.get_klines(self.symbol, "1h", limit=100)
        if not klines_1h:
            print("   ⚠️ Mum verileri alınamadı")
            return
        
        analysis = self.llm.analyze_chart(klines_1h, "1h", self.pattern_knowledge)
        
        print(f"   Pattern: {analysis['pattern']}")
        print(f"   Güven: {analysis['confidence']:.0%}")
        print(f"   Yön: {analysis['direction']}")
        print(f"   Sebep: {analysis['reason']}")
        
        # 3. İşlem açma kararı
        min_confidence = float(settings.get("minConfidence", 0.75))
        
        if analysis["direction"] == "NONE" or analysis["confidence"] < min_confidence:
            print(f"   ⏭️  İşlem açılmıyor (güven: {analysis['confidence']:.0%} < {min_confidence:.0%})")
            return
        
        # 4. Pozisyon aç
        self._open_position(analysis, settings, sentiment_score)
    
    def _open_position(self, analysis: Dict, settings: Dict, sentiment: float):
        """Pozisyon aç"""
        
        print(f"\n✅ POZİSYON AÇILIYOR...")
        
        # Risk hesaplama
        capital = self.binance.get_account_balance()["available"]
        risk_percent = float(settings.get("riskPerTradePercent", 2.0)) / 100
        risk_amount = capital * risk_percent
        
        entry = analysis["entry"]
        stop_loss = analysis["stop_loss"]
        sl_distance = abs(entry - stop_loss)
        
        # Pozisyon boyutu
        quantity = risk_amount / sl_distance
        quantity = round(quantity, 3)  # 3 ondalık
        
        leverage = int(settings.get("leverage", 10))
        
        print(f"   Sermaye: ${capital:.2f}")
        print(f"   Risk: ${risk_amount:.2f} ({risk_percent*100:.1f}%)")
        print(f"   Miktar: {quantity}")
        print(f"   Kaldıraç: {leverage}x")
        
        # Binance'de pozisyon aç
        result = self.binance.open_position(
            symbol=self.symbol,
            direction=analysis["direction"],
            quantity=quantity,
            leverage=leverage
        )
        
        if not result["success"]:
            print(f"   ❌ Pozisyon açılamadı: {result.get('error')}")
            return
        
        # Pozisyonu kaydet
        position = {
            "symbol": self.symbol,
            "direction": analysis["direction"],
            "entry_price": result["entry_price"],
            "quantity": quantity,
            "stop_loss": stop_loss,
            "take_profit": analysis["take_profit"],
            "pattern": analysis["pattern"],
            "confidence": analysis["confidence"],
            "sentiment": sentiment,
            "open_time": datetime.now().isoformat(),
            "order_id": result["order_id"]
        }
        
        self.open_positions[self.symbol] = position
        self.today_trades.append(position)
        
        # Dashboard'a bildir
        self.dashboard.open_position_notification(position)
        
        print(f"   ✅ Pozisyon açıldı!")
        print(f"   Entry: ${result['entry_price']:.2f}")
        print(f"   SL: ${stop_loss:.2f}")
        print(f"   TP: ${analysis['take_profit']:.2f}")
    
    def _monitor_open_positions(self):
        """Açık pozisyonları takip et"""
        
        if not self.open_positions:
            return
        
        for symbol, position in list(self.open_positions.items()):
            current_price = self.binance.get_current_price(symbol)
            
            # P&L hesapla
            if position["direction"] == "LONG":
                pnl = (current_price - position["entry_price"]) * position["quantity"]
            else:
                pnl = (position["entry_price"] - current_price) * position["quantity"]
            
            pnl_percent = (pnl / (position["entry_price"] * position["quantity"])) * 100
            
            # Çıkış kararı al (LLM ile)
            klines = self.binance.get_klines(symbol, "1h", limit=50)
            
            position_data = {
                **position,
                "current_price": current_price,
                "pnl": pnl,
                "pnl_percent": pnl_percent,
                "duration": int((datetime.now() - datetime.fromisoformat(position["open_time"])).total_seconds() / 60)
            }
            
            decision = self.llm.analyze_exit_signal(position_data, klines, "1h")
            
            if decision["action"] == "CLOSE":
                self._close_position(symbol, decision["reason"])
            elif decision["action"] == "MOVE_STOP_LOSS":
                position["stop_loss"] = decision["new_stop_loss"]
                print(f"   📈 Trailing Stop: SL güncellendi → ${decision['new_stop_loss']:.2f}")
    
    def _close_position(self, symbol: str, reason: str):
        """Pozisyon kapat"""
        
        position = self.open_positions.get(symbol)
        if not position:
            return
        
        print(f"\n🔴 POZİSYON KAPATILIYOR: {reason}")
        
        # Binance'de kapat
        result = self.binance.close_position(
            symbol=symbol,
            direction=position["direction"],
            quantity=position["quantity"]
        )
        
        if not result["success"]:
            print(f"   ❌ Pozisyon kapatılamadı: {result.get('error')}")
            return
        
        # P&L hesapla
        exit_price = result["exit_price"]
        if position["direction"] == "LONG":
            pnl = (exit_price - position["entry_price"]) * position["quantity"]
        else:
            pnl = (position["entry_price"] - exit_price) * position["quantity"]
        
        # Pozisyonu güncelle
        position["exit_price"] = exit_price
        position["pnl"] = pnl
        position["exit_reason"] = reason
        position["close_time"] = datetime.now().isoformat()
        
        # Dashboard'a bildir
        self.dashboard.close_position_notification(position)
        
        # Pozisyonu kaldır
        del self.open_positions[symbol]
        
        print(f"   ✅ Pozisyon kapandı!")
        print(f"   Exit: ${exit_price:.2f}")
        print(f"   P&L: ${pnl:+.2f}")
    
    def _cleanup(self):
        """Bot kapatılırken temizlik"""
        print("🧹 Temizlik yapılıyor...")
        
        # Açık pozisyonları kapat (opsiyonel)
        if self.open_positions:
            print(f"⚠️  {len(self.open_positions)} açık pozisyon var!")
            response = input("Pozisyonları kapatmak ister misiniz? (y/n): ")
            if response.lower() == 'y':
                for symbol in list(self.open_positions.keys()):
                    self._close_position(symbol, "Bot kapatıldı")
        
        print("✅ Bot temiz bir şekilde kapatıldı")


def main():
    parser = argparse.ArgumentParser(description="AI Crypto Trading Bot")
    parser.add_argument("--symbol", default="BTCUSDT", help="Trading pair (default: BTCUSDT)")
    parser.add_argument("--testnet", action="store_true", help="Use Binance testnet")
    
    args = parser.parse_args()
    
    # Bot'u başlat
    bot = AITradingBot(symbol=args.symbol, testnet=args.testnet)
    bot.run()


if __name__ == "__main__":
    main()
