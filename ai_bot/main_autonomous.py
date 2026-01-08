#!/usr/bin/env python3
"""
Autonomous AI Trader Bot

Bu bot tamamen AI tarafından yönetilir.
Kod sadece AI'ın kararlarını uygular.
Hiçbir sabit trading kuralı yok - AI kendi stratejisini geliştirir.
"""

import os
import sys
import json
import time
import asyncio
import argparse
from datetime import datetime
from typing import Dict, List, Optional

# Load .env file if exists
try:
    from dotenv import load_dotenv
    # Load from current directory
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
        print(f"✅ Loaded .env from {env_path}")
except ImportError:
    print("⚠️ python-dotenv not installed, using environment variables only")

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from binance_client import BinanceClient
from smc_detector import SMCDetector
from paper_trading import PaperTradingManager
from risk_manager import RiskManager
from orderbook_websocket import OrderBookWebSocket
from limit_order_manager import LimitOrderManager
import requests
from dashboard_notifier import DashboardNotifier
from models import normalize_params, Position, LimitOrder, AIDecision, validate_position_params
from local_ai_decision import LocalAIDecision

class AutonomousTradingBot:
    """
    Tam Bağımsız AI Trading Bot
    
    AI tüm kararları verir:
    - Ne zaman işlem açılacak
    - Hangi fiyattan girilecek
    - Stop loss ve take profit nerede olacak
    - Bekleyen emirler iptal edilecek mi
    - Pozisyon kapatılacak mı
    
    Kod sadece AI'ın kararlarını uygular.
    """
    
    def __init__(self, symbol: str = "BTCUSDT"):
        self.symbol = symbol
        self.running = False
        
        # Load settings from database
        self._load_settings()
        
        # Initialize components
        print("📦 Initializing Autonomous AI Trader...")
        
        # Binance client
        self.binance = BinanceClient(
            api_key=self.api_key,
            api_secret=self.api_secret,
            testnet=False
        )
        
        # SMC Detector
        self.smc = SMCDetector()
        
        # Paper Trading
        self.paper_trading = PaperTradingManager(
            initial_balance=10000
        )
        
        # Risk Manager
        self.risk_manager = RiskManager()
        
        # Order Book WebSocket
        self.orderbook_ws = OrderBookWebSocket(symbol)
        
        # Limit Order Manager
        self.limit_orders = LimitOrderManager()
        
        # Autonomous AI - Local OpenAI API kullanır (VPS için)
        self.dashboard_url = "http://localhost:3000"
        
        # Initialize Local AI Decision (uses OpenAI API directly)
        openai_key = os.getenv("OPENAI_API_KEY", "")
        if openai_key:
            try:
                self.local_ai = LocalAIDecision(api_key=openai_key)
                self.use_local_ai = True
                print("✅ Local AI Decision initialized (OpenAI API)")
            except Exception as e:
                print(f"⚠️ Local AI init failed: {e}")
                self.local_ai = None
                self.use_local_ai = False
        else:
            self.local_ai = None
            self.use_local_ai = False
            print("⚠️ OPENAI_API_KEY not set - will try Dashboard API")
        
        # Dashboard Notifier
        self.notifier = DashboardNotifier("http://localhost:3000")
        
        print("✅ Autonomous AI Trader initialized!")
        print("🧠 AI is now in control - no fixed rules, pure intelligence")
    
    def _load_settings(self):
        """Load API keys from database"""
        import requests
        try:
            response = requests.get(
                "http://localhost:3000/api/trpc/settings.get",
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                result = data.get("result", {}).get("data", {})
                # Handle nested json structure
                if "json" in result:
                    result = result["json"]
                self.api_key = result.get("binanceApiKey", "")
                self.api_secret = result.get("binanceApiSecret", "")
                print(f"✅ Settings loaded from Dashboard")
            else:
                self.api_key = os.getenv("BINANCE_API_KEY", "")
                self.api_secret = os.getenv("BINANCE_API_SECRET", "")
        except Exception as e:
            print(f"Settings load error: {e}")
            self.api_key = os.getenv("BINANCE_API_KEY", "")
            self.api_secret = os.getenv("BINANCE_API_SECRET", "")
    
    def _save_paper_trading_state(self, state: Dict):
        """Save paper trading state to database"""
        try:
            response = requests.post(
                "http://localhost:3000/api/trpc/settings.update",
                json={"json": {"paperTradingState": json.dumps(state)}},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                print("✅ Paper trading state saved to database")
            else:
                print(f"⚠️ Failed to save paper trading state: {response.status_code}")
        except Exception as e:
            print(f"⚠️ Error saving paper trading state: {e}")
    
    async def run(self):
        """Ana bot döngüsü"""
        self.running = True
        
        # Status göster
        self._print_status()
        
        print(f"\n🚀 Starting Autonomous AI Trader for {self.symbol}...")
        print("⏰ AI will analyze and decide every 3 minutes")
        print("🧠 All decisions are made by AI - no fixed rules\n")
        
        # Order Book WebSocket başlat
        self.orderbook_ws.start()
        
        # Ana döngü
        while self.running:
            try:
                await self._trading_cycle()
                
                # 3 dakika bekle (AI daha sık karar verebilsin)
                print("\n⏱️ Waiting 3 minutes until next AI decision...")
                await asyncio.sleep(180)
                
            except KeyboardInterrupt:
                print("\n🛑 Stopping bot...")
                break
            except Exception as e:
                print(f"\n❌ Error in main loop: {e}")
                self.notifier.send_error(self.symbol, str(e))
                await asyncio.sleep(60)
        
        # Cleanup
        self.orderbook_ws.stop()
        print("👋 Autonomous AI Trader stopped")
    
    async def _trading_cycle(self):
        """Tek bir trading döngüsü - AI karar verir, kod uygular"""
        print("\n" + "="*60)
        print(f"🧠 AI Decision Cycle - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)
        
        # 1. Tüm piyasa verilerini topla
        print("\n📊 Gathering market data for AI...")
        market_data = await self._gather_market_data()
        
        if not market_data:
            print("❌ Could not gather market data")
            return
        
        current_price = market_data['current_price']
        print(f"   Current price: ${current_price:,.2f}")
        print(f"   Open positions: {len(market_data['open_positions'])}")
        print(f"   Pending orders: {len(market_data['pending_orders'])}")
        
        # 2. Bekleyen emirleri kontrol et - fiyat hedefe ulaştı mı?
        print("\n🎯 Checking pending orders...")
        triggered_orders = self.limit_orders.check_orders(current_price)
        
        for order in triggered_orders:
            print(f"   ✅ Order triggered: {order['side']} @ ${order['fill_price']:,.2f}")
            # Pozisyon aç
            await self._open_position_from_order(order, current_price)
        
        # 3. Açık pozisyonların SL/TP kontrolü
        print("\n🛡️ Checking SL/TP for open positions...")
        await self._check_sl_tp(current_price)
        
        # 4. AI'a karar verdirt (Server-side API)
        print("\n🧠 AI is analyzing and making decision...")
        decision = self._get_ai_decision(market_data)
        
        # 5. Kararı göster
        self._display_decision(decision)
        
        # 6. Kararı uygula
        await self._execute_decision(decision, market_data)
        
        # 7. Dashboard'a bildir
        self._notify_dashboard(decision, market_data)
    
    async def _gather_market_data(self) -> Optional[Dict]:
        """Tüm piyasa verilerini topla"""
        try:
            # Güncel fiyat
            current_price = self.binance.get_current_price(self.symbol)
            
            # Mum verileri
            candles = self.binance.get_klines(self.symbol, interval="15m", limit=100)
            
            # SMC Pattern'ler
            patterns = self.smc.detect_all_patterns(candles, "15m")
            
            # Order Book analizi
            order_book = self.orderbook_ws.get_analysis()
            
            # Açık pozisyonlar
            open_positions = self.paper_trading.get_open_positions()
            
            # Bekleyen emirler
            pending_orders = self.limit_orders.get_pending_orders()
            
            # Hesap durumu
            stats = self.paper_trading.get_statistics()
            daily_pnl = self.risk_manager.get_daily_pnl(10000).get('pnl', 0)
            
            return {
                "current_price": current_price,
                "price_change_24h": self._calculate_24h_change(candles),
                "candles": candles,
                "patterns": patterns,
                "order_book": order_book,
                "open_positions": open_positions,
                "pending_orders": pending_orders,
                "balance": stats.get("current_balance", 10000),
                "capital": 10000,
                "daily_pnl": daily_pnl,
                "daily_loss_limit": 400
            }
        except Exception as e:
            print(f"Error gathering market data: {e}")
            return None
    
    def _calculate_24h_change(self, candles: List) -> float:
        """24 saatlik değişimi hesapla"""
        if not candles or len(candles) < 96:  # 15m * 96 = 24h
            return 0
        
        try:
            old_price = float(candles[-96][4])  # 24h önceki close
            new_price = float(candles[-1][4])   # Şimdiki close
            return ((new_price - old_price) / old_price) * 100
        except:
            return 0
    
    def _get_ai_decision(self, market_data: Dict) -> Dict:
        """AI'dan karar al - önce local OpenAI, sonra Dashboard API"""
        
        # 1. Önce Local AI dene (OpenAI API)
        if self.use_local_ai and self.local_ai:
            try:
                print("   Using Local AI (OpenAI API)...")
                decision = self.local_ai.make_decision(market_data)
                if decision and decision.get("action"):
                    return decision
            except Exception as e:
                print(f"   ⚠️ Local AI error: {e}")
        
        # 2. Fallback: Dashboard API dene
        try:
            print("   Trying Dashboard API...")
            # Datetime objelerini string'e çevir
            import json
            from datetime import datetime
            
            def serialize_datetime(obj):
                if isinstance(obj, datetime):
                    return obj.isoformat()
                elif isinstance(obj, dict):
                    return {k: serialize_datetime(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [serialize_datetime(item) for item in obj]
                return obj
            
            clean_data = serialize_datetime(market_data)
            
            resp = requests.post(
                f"{self.dashboard_url}/api/trpc/ai.decision",
                json={"json": clean_data},
                headers={"Content-Type": "application/json"},
                timeout=90
            )
            
            if resp.status_code != 200:
                raise Exception(f"API Error: {resp.status_code}")
            
            result = resp.json()
            decision = result.get("result", {}).get("data", {}).get("json", {})
            return decision
            
        except Exception as e:
            print(f"❌ AI Decision Error: {e}")
            return {
                "action": "WAIT",
                "reasoning": f"AI hatası: {str(e)}",
                "confidence": 0
            }
    
    def _display_decision(self, decision: Dict):
        """AI kararını göster"""
        action = decision.get("action", "UNKNOWN")
        confidence = decision.get("confidence", 0)
        reasoning = decision.get("reasoning", "No reasoning provided")
        
        print(f"\n📋 AI Decision: {action}")
        print(f"   Confidence: {confidence*100:.0f}%")
        print(f"   Reasoning: {reasoning[:200]}...")
        
        # Analiz detayları
        analysis = decision.get("analysis", {})
        if analysis:
            print(f"\n📊 AI Analysis:")
            print(f"   Market Structure: {analysis.get('market_structure', 'N/A')}")
            print(f"   Order Flow: {analysis.get('order_flow', 'N/A')}")
            print(f"   Risk Assessment: {analysis.get('risk_assessment', 'N/A')}")
        
        # Parametreler
        params = decision.get("params", {})
        if params and action != "WAIT":
            print(f"\n⚙️ Parameters:")
            for key, value in params.items():
                print(f"   {key}: {value}")
    
    async def _execute_decision(self, decision: Dict, market_data: Dict):
        """AI kararını uygula"""
        action = decision.get("action", "WAIT")
        params = decision.get("params", {})
        
        print(f"\n⚡ Executing: {action}")
        
        try:
            if action == "WAIT":
                print("   ⏸️ No action taken - waiting")
                
            elif action == "PLACE_LIMIT_ORDER":
                await self._place_limit_order(params, market_data)
                
            elif action == "CANCEL_ORDER":
                await self._cancel_order(params)
                
            elif action == "OPEN_MARKET":
                await self._open_market_position(params, market_data)
                
            elif action == "CLOSE_POSITION":
                await self._close_position(params)
                
            elif action == "MODIFY_SL_TP":
                await self._modify_sl_tp(params)
                
            else:
                print(f"   ⚠️ Unknown action: {action}")
                
        except Exception as e:
            print(f"   ❌ Execution error: {e}")
    
    async def _place_limit_order(self, params: Dict, market_data: Dict):
        """Limit emir koy"""
        # SERMAYE VE POZISYON KONTROLU
        open_positions = self.paper_trading.get_open_positions()
        pending_orders = self.limit_orders.get_pending_orders()
        
        # Tek pozisyon kurali: Acik pozisyon varsa yeni emir koyma
        if len(open_positions) >= 1:
            print(f"   \u26a0\ufe0f Tek pozisyon kurali: Zaten {len(open_positions)} acik pozisyon var!")
            print(f"   Yeni limit emir konulamaz.")
            return
        
        # Bekleyen emir varsa yeni emir koyma
        if len(pending_orders) >= 1:
            print(f"   \u26a0\ufe0f Zaten {len(pending_orders)} bekleyen emir var!")
            print(f"   Yeni limit emir konulamaz.")
            return
        
        # Parametreleri standartlastir
        params = normalize_params(params)
        
        side = params.get("side", "BUY")
        # STANDART: entry_price kullan (price değil)
        price = params.get("entry_price", params.get("price", market_data["current_price"]))
        stop_loss = params.get("stop_loss", 0)
        take_profit = params.get("take_profit", 0)
        leverage = params.get("leverage", 3)
        # STANDART: reasoning kullan (reason değil)
        reason = params.get("reasoning", params.get("reason", "AI decision"))
        
        # Position size hesapla
        capital = 10000
        risk_amount = capital * 0.02  # %2 risk
        
        if stop_loss and price:
            sl_distance = abs(price - stop_loss)
            sl_percent = sl_distance / price
            
            if sl_percent > 0:
                position_size = risk_amount / sl_percent
                leverage = min(position_size / capital, 10)  # Max 10x
                position_size = capital * leverage
            else:
                position_size = capital * leverage
        else:
            position_size = capital * leverage
        
        # Limit emir oluştur
        order = self.limit_orders.create_limit_order(
            symbol=self.symbol,
            side=side,
            entry_price=price,
            position_size=position_size,
            stop_loss=stop_loss,
            take_profit=take_profit,
            leverage=leverage,
            reason=reason,
            entry_zone_type="AI_DECISION",
            confidence=0.75
        )
        
        if order:
            print(f"   ✅ Limit order placed: {side} @ ${price:,.2f}")
            print(f"      Size: ${position_size:,.2f} | Leverage: {leverage:.1f}x")
            print(f"      SL: ${stop_loss:,.2f} | TP: ${take_profit:,.2f}")
            
            self.notifier.send_order_placed(
                self.symbol, side, price, stop_loss, take_profit, reason
            )
    
    async def _cancel_order(self, params: Dict):
        """Bekleyen emri iptal et"""
        params = normalize_params(params)
        order_id = params.get("order_id")
        reason = params.get("reasoning", params.get("reason", "AI decision"))
        
        if order_id:
            success = self.limit_orders.cancel_order(order_id)
            if success:
                print(f"   ✅ Order cancelled: {order_id}")
                print(f"      Reason: {reason}")
            else:
                print(f"   ❌ Could not cancel order: {order_id}")
        else:
            # Tüm emirleri iptal et
            cancelled = self.limit_orders.cancel_all_orders()
            print(f"   ✅ Cancelled {cancelled} orders")
            print(f"      Reason: {reason}")
    
    async def _open_market_position(self, params: Dict, market_data: Dict):
        """Market emri ile pozisyon ac"""
        # TEK POZISYON KONTROLU
        open_positions = self.paper_trading.get_open_positions()
        if len(open_positions) >= 1:
            print(f"   \u26a0\ufe0f Tek pozisyon kurali: Zaten {len(open_positions)} acik pozisyon var!")
            print(f"   Yeni market pozisyon acilamaz.")
            return
        
        params = normalize_params(params)
        side = params.get("side", "BUY")
        stop_loss = params.get("stop_loss", 0)
        take_profit = params.get("take_profit", 0)
        leverage = params.get("leverage", 3)
        reason = params.get("reasoning", params.get("reason", "AI decision"))
        confidence = params.get("confidence", 0.75)
        
        current_price = market_data["current_price"]
        
        # Position size hesapla - leverage'a göre
        # leverage 10x ise position_size_percent = 1000 (%1000 = 10x)
        position_size_percent = min(leverage, 10) * 100
        
        # Paper trading pozisyon aç
        position = self.paper_trading.open_position(
            symbol=self.symbol,
            side=side,
            entry_price=current_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            position_size_percent=position_size_percent,
            confidence=confidence,
            reasoning=reason
        )
        
        if position:
            print(f"   ✅ Market position opened: {side}")
            print(f"      Entry: ${current_price:,.2f}")
            print(f"      Size: ${position_size:,.2f} | Leverage: {leverage:.1f}x")
            print(f"      SL: ${stop_loss:,.2f} | TP: ${take_profit:,.2f}")
            
            self.notifier.send_position_opened(
                self.symbol, side, current_price, position_size, stop_loss, take_profit, reason
            )
    
    async def _close_position(self, params: Dict):
        """Pozisyonu kapat"""
        params = normalize_params(params)
        position_id = params.get("position_id")
        reason = params.get("reasoning", params.get("reason", "AI decision"))
        
        current_price = self.binance.get_price(self.symbol)
        
        if position_id:
            result = self.paper_trading.close_position(position_id, current_price, reason)
            if result:
                print(f"   ✅ Position closed: {position_id}")
                print(f"      P&L: ${result.get('pnl', 0):,.2f}")
                print(f"      Reason: {reason}")
                
                self.notifier.send_position_closed(
                    self.symbol, result.get('pnl', 0), reason
                )
        else:
            # Tüm pozisyonları kapat
            positions = self.paper_trading.get_open_positions()
            for pos in positions:
                self.paper_trading.close_position(pos.get('id'), current_price, reason)
            print(f"   ✅ Closed {len(positions)} positions")
    
    async def _open_position_from_order(self, order: Dict, current_price: float):
        """Tetiklenen emirden pozisyon ac"""
        try:
            # TEK POZISYON KONTROLU
            open_positions = self.paper_trading.get_open_positions()
            if len(open_positions) >= 1:
                print(f"   \u26a0\ufe0f Tek pozisyon kurali: Zaten {len(open_positions)} acik pozisyon var!")
                print(f"   Limit order tetiklendi ama pozisyon acilamaz.")
                return
            
            # Parametreleri standartlastir
            order = normalize_params(order)
            
            side = order.get('side', 'BUY')
            entry_price = order.get('fill_price', order.get('entry_price', current_price))
            stop_loss = order.get('stop_loss', 0)
            take_profit = order.get('take_profit', 0)
            leverage = order.get('leverage', 3)
            reason = order.get('reasoning', order.get('reason', 'Limit order triggered'))
            confidence = order.get('confidence', 0.75)
            
            # Leverage'a göre position size yüzdesini hesapla
            # leverage 10x ise position_size_percent = 1000 (%1000 = 10x)
            position_size_percent = leverage * 100
            
            # Paper trading'de pozisyon aç
            position = self.paper_trading.open_position(
                symbol=self.symbol,
                side=side,
                entry_price=entry_price,
                stop_loss=stop_loss,
                take_profit=take_profit,
                position_size_percent=position_size_percent,
                confidence=confidence,
                reasoning=reason
            )
            
            if position:
                position_size = position.get('position_size_usd', 0)
                actual_leverage = position.get('leverage', leverage)
                print(f"   🟢 Position opened from limit order:")
                print(f"      {side} @ ${entry_price:,.2f}")
                print(f"      Size: ${position_size:,.2f} | Leverage: {actual_leverage}x")
                print(f"      SL: ${stop_loss:,.2f} | TP: ${take_profit:,.2f}")
                
                # Dashboard'a bildir
                self.notifier.send_position_opened(
                    self.symbol, side, entry_price, position_size, stop_loss, take_profit, reason
                )
        except Exception as e:
            print(f"   ❌ Error opening position from order: {e}")
    
    async def _check_sl_tp(self, current_price: float):
        """Açık pozisyonların SL/TP kontrolü"""
        try:
            positions = self.paper_trading.get_open_positions()
            
            for pos in positions:
                pos_id = pos.get('id')
                side = pos.get('side', 'BUY')
                entry_price = pos.get('entry_price', 0)
                stop_loss = pos.get('stop_loss', 0)
                take_profit = pos.get('take_profit', 0)
                
                close_reason = None
                close_type = None
                
                if side == 'BUY':  # Long pozisyon
                    if stop_loss > 0 and current_price <= stop_loss:
                        close_reason = f"Stop Loss hit @ ${current_price:,.2f}"
                        close_type = "SL"
                    elif take_profit > 0 and current_price >= take_profit:
                        close_reason = f"Take Profit hit @ ${current_price:,.2f}"
                        close_type = "TP"
                else:  # Short pozisyon
                    if stop_loss > 0 and current_price >= stop_loss:
                        close_reason = f"Stop Loss hit @ ${current_price:,.2f}"
                        close_type = "SL"
                    elif take_profit > 0 and current_price <= take_profit:
                        close_reason = f"Take Profit hit @ ${current_price:,.2f}"
                        close_type = "TP"
                
                if close_reason:
                    result = self.paper_trading.close_position(pos_id, current_price, close_reason)
                    if result:
                        pnl = result.get('pnl', 0)
                        emoji = "🟢" if pnl >= 0 else "🔴"
                        print(f"   {emoji} Position closed ({close_type}): {side} @ ${current_price:,.2f}")
                        print(f"      P&L: ${pnl:,.2f}")
                        print(f"      Reason: {close_reason}")
                        
                        # Dashboard'a bildir
                        self.notifier.send_position_closed(
                            self.symbol, pnl, close_reason
                        )
        except Exception as e:
            print(f"   ⚠️ SL/TP check error: {e}")
    
    async def _modify_sl_tp(self, params: Dict):
        """SL/TP değiştir"""
        params = normalize_params(params)
        position_id = params.get("position_id")
        new_sl = params.get("new_stop_loss")
        new_tp = params.get("new_take_profit")
        reason = params.get("reasoning", params.get("reason", "AI decision"))
        
        # Get open positions
        positions = self.paper_trading.get_open_positions()
        
        if not positions:
            print(f"   ⚠️ No open positions to modify")
            return
        
        # If no position_id specified, modify the first (and usually only) position
        if not position_id and positions:
            position_id = positions[0].get('id')
        
        # Modify the position
        result = self.paper_trading.modify_position(
            position_id=position_id,
            new_stop_loss=new_sl,
            new_take_profit=new_tp,
            reason=reason
        )
        
        if result:
            print(f"   ✅ Position SL/TP modified successfully")
            self.notifier.send_notification(
                self.symbol,
                "SL/TP Modified",
                f"Position: SL=${new_sl:,.2f}, TP=${new_tp:,.2f}"
            )
        else:
            print(f"   ❌ Failed to modify position SL/TP")
    
    def _notify_dashboard(self, decision: Dict, market_data: Dict):
        """Dashboard'a bildir"""
        action = decision.get("action", "WAIT")
        
        # Status güncelle
        self.notifier.send_status(
            symbol=self.symbol,
            mode="AUTONOMOUS",
            strategy="Pure AI Decision Making",
            capital=10000,
            risk_per_trade=200,
            max_daily_loss=400,
            daily_pnl=market_data.get("daily_pnl", 0)
        )
        
        # AI kararını bildir
        self.notifier.send_ai_decision(
            symbol=self.symbol,
            action=action,
            confidence=decision.get("confidence", 0),
            reasoning=decision.get("reasoning", "")[:500]
        )
    
    def _print_status(self):
        """Başlangıç durumunu göster"""
        stats = self.paper_trading.get_statistics()
        
        print("\n" + "="*60)
        print("📊 AUTONOMOUS AI TRADER STATUS")
        print("="*60)
        print(f"Mode: AUTONOMOUS (Pure AI Decision Making)")
        print(f"Strategy: AI decides everything - no fixed rules")
        print("\n💰 CAPITAL & RISK")
        print(f"Capital: $10,000.00")
        print(f"Risk per trade: 2% ($200.00)")
        print(f"Max daily loss: 4% ($400.00)")
        print(f"\n📈 PERFORMANCE")
        print(f"Win rate: {stats.get('win_rate', 0)*100:.1f}%")
        print(f"Total P&L: ${stats.get('total_pnl', 0):,.2f}")
        print(f"Current balance: ${stats.get('current_balance', 10000):,.2f}")
        print("="*60)
    
    def stop(self):
        """Bot'u durdur ve tüm kaynakları temizle"""
        print("\n🛑 Stopping bot...")
        self.running = False
        
        # Stop WebSocket connections
        try:
            if hasattr(self, 'orderbook_ws'):
                self.orderbook_ws.stop()
                print("✅ Order Book WebSocket stopped")
        except Exception as e:
            print(f"⚠️ Error stopping Order Book WebSocket: {e}")
        
        # Save paper trading state
        try:
            if hasattr(self, 'paper_trading'):
                # Paper trading manager already saves state automatically
                # Just trigger a final save
                self.paper_trading._save_state()
                print("✅ Paper trading state saved")
        except Exception as e:
            print(f"⚠️ Error saving paper trading state: {e}")
        
        print("✅ Bot stopped successfully")


async def main():
    parser = argparse.ArgumentParser(description="Autonomous AI Trader Bot")
    parser.add_argument("--symbol", default="BTCUSDT", help="Trading symbol")
    args = parser.parse_args()
    
    bot = AutonomousTradingBot(symbol=args.symbol)
    
    # Signal handler for graceful shutdown
    import signal
    
    def signal_handler(sig, frame):
        print("\n🚨 Received shutdown signal...")
        bot.stop()
        sys.exit(0)
    
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        await bot.run()
    except KeyboardInterrupt:
        print("\n🚨 Keyboard interrupt...")
        bot.stop()


if __name__ == "__main__":
    asyncio.run(main())
