"""
AI Crypto Trading Bot - Hybrid Version
Order Book WebSocket + Limit Emirler + OB/FVG Teyidi
"""

import os
import sys
import time
import argparse
from datetime import datetime
from typing import Dict, List, Optional

# Import all modules
from paper_trading import PaperTradingManager
from risk_manager import RiskManager
from trade_cycle_manager import TradeCycleManager
from pro_trader_ai import ProTraderAI
from orderbook_analyzer import OrderBookAnalyzer
from orderbook_websocket import OrderBookWebSocket
from limit_order_manager import LimitOrderManager
from smc_detector import SMCDetector
from dashboard_client import DashboardClient
from binance_client import BinanceClient

class HybridTradingBot:
    """
    Hybrid Trading Bot - Order Book + Limit Emirler
    
    Çalışma Mantığı:
    1. Order Book WebSocket ile gerçek zamanlı büyük emir takibi
    2. SMC pattern tespiti (OB, FVG, Sweep)
    3. OB/FVG bölgelerine limit emir koyma
    4. Order Book teyidi ile emir onaylama
    5. 5dk'da bir emirleri kontrol ve güncelleme
    """
    
    def __init__(self, symbol: str = "BTCUSDT"):
        self.symbol = symbol
        
        print(f"\n{'='*60}")
        print(f"🤖 HYBRID AI TRADING BOT - {symbol}")
        print(f"{'='*60}\n")
        
        # Initialize components
        print("📦 Initializing components...")
        
        self.dashboard = DashboardClient()
        self.settings = self.dashboard.get_settings()
        
        # Get capital from settings
        self.capital = 10000  # $10,000 paper trading
        
        # Initialize managers
        self.paper_trading = PaperTradingManager(initial_balance=self.capital)
        self.risk_manager = RiskManager()
        self.cycle_manager = TradeCycleManager()
        self.limit_orders = LimitOrderManager()
        
        # Get API keys
        openai_key = self.settings.get('openaiApiKey', '') or os.getenv('OPENAI_API_KEY', '')
        api_key = self.settings.get('binanceApiKey', '')
        api_secret = self.settings.get('binanceApiSecret', '')
        
        if not openai_key:
            print("\n⚠️ WARNING: No OpenAI API key found!")
            print("   Add OpenAI API key in Settings to enable AI trading.\n")
        
        if not api_key or not api_secret:
            print("\n⚠️ WARNING: No Binance API keys found!")
            print("   Bot will use demo mode for testing.\n")
        
        # Initialize Pro Trader AI
        self.pro_trader = ProTraderAI(api_key=openai_key) if openai_key else None
        
        # Initialize other modules
        self.orderbook_analyzer = OrderBookAnalyzer(api_key, api_secret) if api_key else None
        self.smc_detector = SMCDetector(api_key=openai_key)
        self.binance = BinanceClient(api_key, api_secret) if api_key else None
        
        # Initialize Order Book WebSocket
        self.orderbook_ws = OrderBookWebSocket(symbol)
        self.orderbook_ws.start()
        
        print(f"✅ All components initialized!\n")
        self._print_status()
    
    def _print_status(self):
        """Print current bot status"""
        stats = self.paper_trading.get_statistics()
        risk_summary = self.risk_manager.get_risk_summary(self.capital)
        order_summary = self.limit_orders.get_summary()
        
        print(f"\n📊 CURRENT STATUS")
        print(f"{'='*60}")
        print(f"Mode: HYBRID (Order Book + Limit Orders)")
        print(f"Strategy: SMC + Order Flow + Limit Entry")
        print(f"\n💰 CAPITAL & RISK")
        print(f"Capital: ${self.capital:,.2f}")
        print(f"Risk per trade: 2% (${self.capital * 0.02:,.2f})")
        print(f"Max daily loss: 4% (${self.capital * 0.04:,.2f})")
        print(f"Today's P&L: ${risk_summary['daily_pnl_usd']:,.2f}")
        print(f"\n📝 PENDING ORDERS")
        print(f"Total pending: {order_summary['total_pending']}")
        print(f"Buy orders: {order_summary['buy_orders']}")
        print(f"Sell orders: {order_summary['sell_orders']}")
        print(f"\n📈 PERFORMANCE")
        print(f"Win rate: {stats['win_rate']:.1f}%")
        print(f"Total P&L: ${stats['total_pnl_usd']:,.2f}")
        print(f"Current balance: ${stats['current_balance']:,.2f}")
        print(f"{'='*60}\n")
    
    def run(self):
        """Main trading loop"""
        
        print(f"🚀 Starting Hybrid Trading Bot for {self.symbol}...")
        print(f"⏰ Checking every 5 minutes\n")
        
        while True:
            try:
                # Check if bot should run
                if not self._should_run():
                    print(f"⏸️ Bot paused (daily loss limit or manual stop)")
                    time.sleep(300)
                    continue
                
                # Run trading cycle
                self._trading_cycle()
                
                # Sleep
                print(f"\n⏱️ Waiting 5 minutes until next cycle...")
                time.sleep(300)
                
            except KeyboardInterrupt:
                print(f"\n⏹️ Bot stopped by user")
                self.orderbook_ws.stop()
                break
            except Exception as e:
                print(f"❌ Error in main loop: {e}")
                import traceback
                traceback.print_exc()
                time.sleep(300)
    
    def _should_run(self) -> bool:
        """Check if bot should continue running"""
        
        # Check daily loss limit
        can_trade, reason = self.risk_manager.can_open_trade(self.capital)
        if not can_trade:
            print(f"⛔ {reason}")
            return False
        
        # Check if manually stopped
        settings = self.dashboard.get_settings()
        if not settings.get('isActive', False):
            return False
        
        return True
    
    def _trading_cycle(self):
        """Single trading cycle with Hybrid system"""
        
        print(f"\n{'='*60}")
        print(f"🔄 Hybrid Trading Cycle - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}")
        
        # 1. Get market data
        print(f"\n📊 Fetching market data...")
        if not self.binance:
            print(f"   ⚠️ Skipped: No Binance API keys")
            return
        
        candles = self.binance.get_klines(self.symbol, "15m", limit=100)
        current_price = candles[-1]['close']
        print(f"   Current price: ${current_price:,.2f}")
        
        # 2. Check pending limit orders
        print(f"\n📝 Checking pending orders...")
        triggered_orders = self.limit_orders.check_orders(current_price)
        
        if triggered_orders:
            for order in triggered_orders:
                print(f"   🎯 Order triggered: {order['order_id']}")
                self._execute_limit_order(order)
        else:
            pending = self.limit_orders.get_pending_orders(self.symbol)
            print(f"   Pending orders: {len(pending)}")
            for order in pending:
                distance = abs(order['entry_price'] - current_price) / current_price * 100
                print(f"   - {order['side']} @ {order['entry_price']:,.2f} ({distance:.2f}% away)")
        
        # 3. Get Order Book WebSocket analysis
        print(f"\n📖 Order Book Analysis (WebSocket)...")
        ob_analysis = self.orderbook_ws.get_analysis()
        
        if ob_analysis.get('timestamp'):
            print(f"   Whale Bias: {ob_analysis.get('whale_bias', 'N/A')}")
            print(f"   Buy Pressure: {ob_analysis.get('buy_pressure', 0):.1%}")
            print(f"   Sell Pressure: {ob_analysis.get('sell_pressure', 0):.1%}")
            
            buy_walls = ob_analysis.get('walls', {}).get('buy', [])
            sell_walls = ob_analysis.get('walls', {}).get('sell', [])
            
            if buy_walls:
                print(f"   Buy Walls: {len(buy_walls)} (nearest: ${buy_walls[0]['value_usd']:,.0f} @ {buy_walls[0]['price']:,.0f})")
            if sell_walls:
                print(f"   Sell Walls: {len(sell_walls)} (nearest: ${sell_walls[0]['value_usd']:,.0f} @ {sell_walls[0]['price']:,.0f})")
        else:
            print(f"   ⚠️ WebSocket data not ready yet")
            ob_analysis = {}
        
        # 4. Check if we already have a position
        current_position = self.paper_trading.get_open_positions()
        if current_position:
            print(f"\n📊 Open Position: {current_position[0]['side']} @ {current_position[0]['entry_price']:,.2f}")
            self._manage_position(current_position[0], current_price, ob_analysis)
            return
        
        # 5. Check if we already have pending orders
        pending_orders = self.limit_orders.get_pending_orders(self.symbol)
        if pending_orders:
            print(f"\n📝 Already have {len(pending_orders)} pending order(s), skipping new analysis")
            # Optionally update orders based on new analysis
            self._update_pending_orders(pending_orders, current_price, ob_analysis)
            return
        
        # 6. Detect SMC patterns
        print(f"\n🧠 Detecting SMC patterns...")
        if not self.pro_trader:
            print(f"   ⚠️ Skipped: No OpenAI API key")
            return
        
        try:
            smc_patterns = self.smc_detector.detect_all_patterns(candles, '15m')
            pattern_count = sum(len(v) if isinstance(v, list) else 0 for v in smc_patterns.values())
            print(f"   Patterns found: {pattern_count}")
            
            if smc_patterns.get('order_blocks'):
                print(f"   - Order Blocks: {len(smc_patterns['order_blocks'])}")
            if smc_patterns.get('fair_value_gaps'):
                print(f"   - Fair Value Gaps: {len(smc_patterns['fair_value_gaps'])}")
            if smc_patterns.get('liquidity_sweeps'):
                print(f"   - Liquidity Sweeps: {len(smc_patterns.get('liquidity_sweeps', []))}")
        except Exception as e:
            print(f"   ⚠️ SMC detection error: {e}")
            smc_patterns = {}
        
        # 7. Pro Trader AI - Find entry zones
        print(f"\n🎯 Pro Trader AI - Finding Entry Zones...")
        
        # Get today's P&L
        today = datetime.now().strftime("%Y-%m-%d")
        daily_pnl = self.risk_manager.daily_pnl.get(today, 0)
        
        # Prepare market analysis for AI
        market_analysis = {
            "candles": candles[-20:],  # Last 20 candles
            "smc_patterns": smc_patterns,
            "orderbook": ob_analysis,
            "trend": self._detect_trend(candles),
            "current_price": current_price
        }
        
        # Get AI decision for limit order placement
        entry_zones = self._find_entry_zones(market_analysis, ob_analysis)
        
        if entry_zones:
            print(f"   Found {len(entry_zones)} potential entry zone(s)")
            
            # Place limit order at best zone
            best_zone = entry_zones[0]
            self._place_limit_order(best_zone, current_price, ob_analysis)
        else:
            print(f"   No valid entry zones found")
        
        # 8. Update open positions
        self._update_positions(current_price)
        
        print(f"\n{'='*60}")
    
    def _find_entry_zones(self, market_analysis: Dict, ob_analysis: Dict) -> List[Dict]:
        """Find valid entry zones based on SMC patterns and Order Book"""
        
        entry_zones = []
        current_price = market_analysis['current_price']
        smc = market_analysis.get('smc_patterns', {})
        trend = market_analysis.get('trend', 'NEUTRAL')
        
        # Check Order Blocks
        for ob in smc.get('order_blocks', []):
            zone = self._evaluate_entry_zone(ob, 'ORDER_BLOCK', current_price, trend, ob_analysis)
            if zone:
                entry_zones.append(zone)
        
        # Check Fair Value Gaps
        for fvg in smc.get('fair_value_gaps', []):
            zone = self._evaluate_entry_zone(fvg, 'FVG', current_price, trend, ob_analysis)
            if zone:
                entry_zones.append(zone)
        
        # Check Liquidity Sweeps
        for sweep in smc.get('liquidity_sweeps', []):
            zone = self._evaluate_entry_zone(sweep, 'LIQUIDITY_SWEEP', current_price, trend, ob_analysis)
            if zone:
                entry_zones.append(zone)
        
        # Sort by confidence
        entry_zones.sort(key=lambda x: x['confidence'], reverse=True)
        
        return entry_zones
    
    def _evaluate_entry_zone(self, zone: Dict, zone_type: str, current_price: float, trend: str, ob_analysis: Dict) -> Optional[Dict]:
        """Evaluate if a zone is valid for entry"""
        
        # Get zone price
        if zone_type == 'ORDER_BLOCK':
            zone_price = zone.get('price', zone.get('high', zone.get('low', current_price)))
            direction = zone.get('type', 'bullish')
        elif zone_type == 'FVG':
            zone_price = (zone.get('high', current_price) + zone.get('low', current_price)) / 2
            direction = zone.get('type', 'bullish')
        else:  # LIQUIDITY_SWEEP
            zone_price = zone.get('price', current_price)
            direction = zone.get('direction', 'bullish')
        
        # Determine trade direction
        if direction in ['bullish', 'LONG', 'BUY']:
            side = 'BUY'
            # For long, zone should be below current price
            if zone_price >= current_price:
                return None
        else:
            side = 'SELL'
            # For short, zone should be above current price
            if zone_price <= current_price:
                return None
        
        # Check distance (should be within 2% of current price)
        distance_percent = abs(zone_price - current_price) / current_price * 100
        if distance_percent > 2 or distance_percent < 0.1:
            return None
        
        # Get Order Book confirmation
        ob_confirmation = self.orderbook_ws.get_entry_confirmation(
            direction='LONG' if side == 'BUY' else 'SHORT',
            price=zone_price
        )
        
        # Calculate confidence
        base_confidence = 0.5
        
        # Zone type bonus
        if zone_type == 'ORDER_BLOCK':
            base_confidence += 0.15
        elif zone_type == 'LIQUIDITY_SWEEP':
            base_confidence += 0.1
        
        # Trend alignment bonus
        if (trend == 'BULLISH' and side == 'BUY') or (trend == 'BEARISH' and side == 'SELL'):
            base_confidence += 0.15
        
        # Order Book confirmation bonus
        if ob_confirmation.get('confirmed'):
            base_confidence += ob_confirmation.get('confidence', 0) * 0.3
        
        # Distance penalty (closer is better)
        base_confidence -= distance_percent * 0.05
        
        confidence = max(0.3, min(0.95, base_confidence))
        
        # Minimum confidence threshold
        if confidence < 0.5:
            return None
        
        return {
            'zone_type': zone_type,
            'side': side,
            'entry_price': zone_price,
            'distance_percent': distance_percent,
            'confidence': confidence,
            'ob_confirmed': ob_confirmation.get('confirmed', False),
            'ob_reason': ob_confirmation.get('reason', ''),
            'supporting_walls': ob_confirmation.get('supporting_walls', []),
            'trend': trend,
            'raw_zone': zone
        }
    
    def _place_limit_order(self, zone: Dict, current_price: float, ob_analysis: Dict):
        """Place a limit order at the entry zone"""
        
        side = zone['side']
        entry_price = zone['entry_price']
        
        # Calculate SL and TP
        sl_distance_percent = 0.5  # 0.5% SL
        tp_distance_percent = 1.0  # 1% TP (2:1 R:R)
        
        if side == 'BUY':
            stop_loss = entry_price * (1 - sl_distance_percent / 100)
            take_profit = entry_price * (1 + tp_distance_percent / 100)
        else:
            stop_loss = entry_price * (1 + sl_distance_percent / 100)
            take_profit = entry_price * (1 - tp_distance_percent / 100)
        
        # Calculate position size based on risk
        risk_amount = self.capital * 0.02  # 2% risk
        sl_distance_usd = abs(entry_price - stop_loss)
        position_size = (risk_amount / sl_distance_usd) * entry_price
        
        # Calculate leverage
        leverage = position_size / self.capital
        leverage = min(10, max(1, leverage))  # Cap at 10x
        
        # Create limit order
        order = self.limit_orders.create_limit_order(
            symbol=self.symbol,
            side=side,
            entry_price=entry_price,
            position_size=position_size,
            stop_loss=stop_loss,
            take_profit=take_profit,
            leverage=leverage,
            reason=f"Entry at {zone['zone_type']} with {zone['confidence']:.0%} confidence. OB: {zone['ob_reason']}",
            entry_zone_type=zone['zone_type'],
            confidence=zone['confidence'],
            expiry_minutes=30
        )
        
        print(f"\n✅ Limit Order Placed!")
        print(f"   {side} @ {entry_price:,.2f}")
        print(f"   SL: {stop_loss:,.2f} | TP: {take_profit:,.2f}")
        print(f"   Size: ${position_size:,.2f} | Leverage: {leverage:.1f}x")
    
    def _execute_limit_order(self, order: Dict):
        """Execute a triggered limit order"""
        
        print(f"\n🎯 Executing Limit Order: {order['order_id']}")
        
        # Open paper trading position
        position = self.paper_trading.open_position(
            symbol=order['symbol'],
            side=order['side'],
            entry_price=order['fill_price'],
            position_size=order['position_size'],
            stop_loss=order['stop_loss'],
            take_profit=order['take_profit'],
            leverage=order['leverage'],
            confidence=order['confidence'],
            reasoning=order['reason']
        )
        
        if position:
            print(f"   ✅ Position opened!")
            
            # Send notification
            self.dashboard.send_notification(
                title=f"📈 Position Opened: {order['side']} {order['symbol']}",
                content=f"Entry: ${order['fill_price']:,.2f}\nSize: ${order['position_size']:,.2f}\nSL: ${order['stop_loss']:,.2f}\nTP: ${order['take_profit']:,.2f}",
                notification_type="info"
            )
        else:
            print(f"   ❌ Failed to open position")
    
    def _update_pending_orders(self, orders: List[Dict], current_price: float, ob_analysis: Dict):
        """Update pending orders based on new market data"""
        
        for order in orders:
            # Check if order is still valid
            ob_confirmation = self.orderbook_ws.get_entry_confirmation(
                direction='LONG' if order['side'] == 'BUY' else 'SHORT',
                price=order['entry_price']
            )
            
            # If Order Book no longer confirms, consider cancelling
            if not ob_confirmation.get('confirmed') and order['confidence'] < 0.7:
                print(f"   ⚠️ Order {order['order_id']} no longer confirmed by Order Book")
                # Don't auto-cancel, just warn
    
    def _manage_position(self, position: Dict, current_price: float, ob_analysis: Dict):
        """Manage open position"""
        
        # Check for exit signals
        pnl_percent = ((current_price - position['entry_price']) / position['entry_price']) * 100
        if position['side'] == 'SELL':
            pnl_percent = -pnl_percent
        
        print(f"   Current P&L: {pnl_percent:+.2f}%")
        
        # Check if Order Book suggests exit
        whale_bias = ob_analysis.get('whale_bias', 'NEUTRAL')
        
        if position['side'] == 'BUY' and whale_bias == 'BEARISH' and pnl_percent > 0.5:
            print(f"   ⚠️ Order Book turning bearish, consider taking profit")
        elif position['side'] == 'SELL' and whale_bias == 'BULLISH' and pnl_percent > 0.5:
            print(f"   ⚠️ Order Book turning bullish, consider taking profit")
    
    def _update_positions(self, current_price: float):
        """Update P&L for open positions"""
        positions = self.paper_trading.get_open_positions()
        
        if positions:
            print(f"\n🔍 Checking {len(positions)} open position(s)...")
            for pos in positions:
                self.paper_trading.update_position_pnl(pos['position_id'], current_price)
    
    def _detect_trend(self, candles: List[Dict]) -> str:
        """Simple trend detection"""
        if len(candles) < 20:
            return 'NEUTRAL'
        
        # Use last 20 candles
        closes = [c['close'] for c in candles[-20:]]
        
        # Simple MA comparison
        ma_short = sum(closes[-5:]) / 5
        ma_long = sum(closes[-20:]) / 20
        
        if ma_short > ma_long * 1.005:
            return 'BULLISH'
        elif ma_short < ma_long * 0.995:
            return 'BEARISH'
        else:
            return 'NEUTRAL'


def main():
    parser = argparse.ArgumentParser(description='Hybrid AI Trading Bot')
    parser.add_argument('--symbol', type=str, default='BTCUSDT', help='Trading pair')
    args = parser.parse_args()
    
    bot = HybridTradingBot(symbol=args.symbol)
    bot.run()


if __name__ == "__main__":
    main()
