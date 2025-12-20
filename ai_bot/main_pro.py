"""
AI Crypto Trading Bot - Pro Trader Version
Professional trading logic with SMC, Order Flow, and Dynamic Risk Management
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
from smc_detector import SMCDetector
from dashboard_client import DashboardClient
from binance_client import BinanceClient

class ProTradingBot:
    """
    Professional Trading Bot with AI Decision Making
    
    Key Features:
    1. Single position at a time (full capital utilization)
    2. Entry only at OB/FVG/Sweep zones
    3. Dynamic position sizing based on SL distance
    4. Minimum R:R of 1:2
    5. Can close and reverse position if market structure changes
    6. Learns from every trade
    """
    
    def __init__(self, symbol: str = "BTCUSDT"):
        self.symbol = symbol
        
        print(f"\n{'='*60}")
        print(f"🤖 PRO AI CRYPTO TRADING BOT - {symbol}")
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
        
        print(f"✅ All components initialized!\n")
        self._print_status()
    
    def _print_status(self):
        """Print current bot status"""
        stats = self.paper_trading.get_statistics()
        risk_summary = self.risk_manager.get_risk_summary(self.capital)
        
        print(f"\n📊 CURRENT STATUS")
        print(f"{'='*60}")
        print(f"Mode: PRO TRADER AI")
        print(f"Strategy: SMC + Order Flow + Dynamic Risk")
        print(f"\n💰 CAPITAL & RISK")
        print(f"Capital: ${self.capital:,.2f}")
        print(f"Risk per trade: 2% (${self.capital * 0.02:,.2f})")
        print(f"Max daily loss: 4% (${self.capital * 0.04:,.2f})")
        print(f"Today's P&L: ${risk_summary['daily_pnl_usd']:,.2f}")
        print(f"\n📈 PERFORMANCE")
        print(f"Win rate: {stats['win_rate']:.1f}%")
        print(f"Total P&L: ${stats['total_pnl_usd']:,.2f}")
        print(f"Current balance: ${stats['current_balance']:,.2f}")
        print(f"{'='*60}\n")
    
    def run(self):
        """Main trading loop"""
        
        print(f"🚀 Starting Pro Trading Bot for {self.symbol}...")
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
                print(f"⏱️ Waiting 5 minutes until next cycle...")
                time.sleep(300)
                
            except KeyboardInterrupt:
                print(f"\n⏹️ Bot stopped by user")
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
        """Single trading cycle with Pro Trader AI"""
        
        print(f"\n{'='*60}")
        print(f"🔄 Pro Trading Cycle - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}")
        
        # 1. Get market data
        print(f"\n📊 Fetching market data...")
        if not self.binance:
            print(f"   ⚠️ Skipped: No Binance API keys")
            return
        
        candles = self.binance.get_klines(self.symbol, "15m", limit=100)
        current_price = candles[-1]['close']
        print(f"   Current price: ${current_price:,.2f}")
        
        # 2. Analyze order book
        print(f"\n📖 Analyzing order book...")
        if self.orderbook_analyzer:
            self.orderbook_analyzer.get_orderbook_snapshot(self.symbol, limit=20)
            orderbook_data = self.orderbook_analyzer.analyze_orderbook(self.symbol, current_price)
            print(f"   Imbalance: {orderbook_data.get('imbalance', 0):.2f}%")
        else:
            orderbook_data = {'imbalance': 0, 'large_orders': [], 'liquidity_zones': []}
        
        # Check if Pro Trader AI is available
        if not self.pro_trader:
            print(f"\n⚠️ Skipped: No OpenAI API key")
            return
        
        # 3. Detect SMC patterns
        print(f"\n🧠 Detecting SMC patterns...")
        try:
            smc_data = self.smc_detector._detect_rule_based(candles, "15m")
            pattern_count = sum(len(v) for v in smc_data.values() if isinstance(v, list))
            print(f"   Patterns found: {pattern_count}")
            
            # Print detected patterns
            for pattern_type, patterns in smc_data.items():
                if isinstance(patterns, list) and patterns:
                    print(f"   - {pattern_type}: {len(patterns)}")
        except Exception as e:
            print(f"   ⚠️ SMC detection error: {e}")
            smc_data = {'order_blocks': [], 'fair_value_gaps': [], 'liquidity_sweeps': [], 'break_of_structure': [], 'support_resistance': []}
        
        # 4. Get current position (if any)
        current_position = None
        if self.paper_trading.open_positions:
            pos_id = list(self.paper_trading.open_positions.keys())[0]
            current_position = self.paper_trading.open_positions[pos_id]
            print(f"\n📍 Current Position:")
            print(f"   {current_position['side']} {current_position['symbol']}")
            print(f"   Entry: ${current_position['entry_price']:,.2f}")
            print(f"   Size: ${current_position['position_size_usd']:,.2f}")
        
        # 5. Pro Trader AI - Market Structure Analysis
        print(f"\n🧠 Pro Trader AI - Market Analysis...")
        market_analysis = self.pro_trader.analyze_market_structure(
            symbol=self.symbol,
            candles=candles,
            smc_data=smc_data,
            order_book=orderbook_data,
            current_position=current_position
        )
        
        print(f"   Trend: {market_analysis.get('trend')}")
        print(f"   Bias: {market_analysis.get('overall_bias')}")
        print(f"   Structure Break: {market_analysis.get('structure_break', {}).get('detected', False)}")
        print(f"   At Entry Zone: {market_analysis.get('price_at_entry_zone', {}).get('is_at_zone', False)}")
        
        # 6. Pro Trader AI - Trading Decision
        print(f"\n🎯 Pro Trader AI - Trading Decision...")
        # Get today's P&L as a number (not dict)
        today = datetime.now().strftime("%Y-%m-%d")
        daily_pnl = self.risk_manager.daily_pnl.get(today, 0)
        
        decision = self.pro_trader.make_trading_decision(
            market_analysis=market_analysis,
            current_price=current_price,
            capital=self.capital,
            daily_pnl=daily_pnl,
            current_position=current_position
        )
        
        print(f"   Action: {decision.get('action')}")
        print(f"   Confidence: {decision.get('confidence', 0):.2f}")
        if decision.get('entry_zone_type'):
            print(f"   Entry Zone: {decision.get('entry_zone_type')}")
        if decision.get('rr_ratio'):
            print(f"   R:R Ratio: {decision.get('rr_ratio'):.2f}")
        print(f"   Reasoning: {decision.get('reasoning', '')[:150]}...")
        
        # 7. Execute decision
        self._execute_decision(decision, current_price)
        
        # 8. Update open positions
        self._update_positions(current_price)
        
        print(f"\n{'='*60}\n")
    
    def _execute_decision(self, decision: Dict, current_price: float):
        """Execute trading decision"""
        
        action = decision.get('action', 'HOLD')
        
        if action == "HOLD":
            print(f"\n⏸️ Decision: HOLD - No action taken")
            return
        
        if action == "CLOSE":
            self._close_position(current_price, decision.get('reasoning', 'AI decision'))
        
        elif action == "CLOSE_AND_REVERSE":
            # First close current position
            self._close_position(current_price, "Reversing position")
            # Then open new position in opposite direction
            self._open_position(decision, current_price)
        
        elif action in ["OPEN_LONG", "OPEN_SHORT"]:
            self._open_position(decision, current_price)
    
    def _open_position(self, decision: Dict, current_price: float):
        """Open a new position based on AI decision"""
        
        print(f"\n🔓 Opening position...")
        
        # Check if position already exists
        if self.paper_trading.open_positions:
            print(f"   ❌ Position already open! Cannot open new position.")
            return
        
        # Get parameters from decision
        action = decision.get('action', '')
        side = "BUY" if "LONG" in action else "SELL"
        entry_price = decision.get('entry_price', current_price)
        stop_loss = decision.get('stop_loss', 0)
        take_profit = decision.get('take_profit', 0)
        confidence = decision.get('confidence', 0)
        reasoning = decision.get('reasoning', '')
        position_size_usd = decision.get('position_size_usd', 0)
        leverage = decision.get('leverage', 1)
        rr_ratio = decision.get('rr_ratio', 0)
        
        # Validate stop loss
        if stop_loss <= 0:
            print(f"   ❌ Invalid stop loss: {stop_loss}")
            return
        
        # Validate R:R
        if rr_ratio < 2.0:
            print(f"   ❌ R:R ratio too low: {rr_ratio:.2f} (min: 2.0)")
            return
        
        # Calculate position size if not provided
        if position_size_usd <= 0:
            try:
                position_calc = self.risk_manager.calculate_position_from_risk(
                    capital=self.capital,
                    entry_price=entry_price,
                    stop_loss=stop_loss,
                    side=side
                )
                position_size_usd = position_calc['position_size_usd']
                leverage = position_calc['leverage']
            except Exception as e:
                print(f"   ❌ Failed to calculate position size: {e}")
                return
        
        position_size_percent = (position_size_usd / self.capital) * 100
        
        print(f"   📊 Position Details:")
        print(f"      Side: {side}")
        print(f"      Entry: ${entry_price:,.2f}")
        print(f"      Stop Loss: ${stop_loss:,.2f}")
        print(f"      Take Profit: ${take_profit:,.2f}")
        print(f"      Size: ${position_size_usd:,.2f}")
        print(f"      Leverage: {leverage}x")
        print(f"      R:R: {rr_ratio:.2f}")
        
        # Open paper trading position
        position = self.paper_trading.open_position(
            symbol=self.symbol,
            side=side,
            entry_price=entry_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            position_size_percent=position_size_percent,
            confidence=confidence,
            reasoning=reasoning
        )
        
        print(f"   ✅ Position opened!")
        
        # Send notification
        try:
            self.dashboard.send_notification(
                title=f"Position Opened: {self.symbol}",
                message=f"{side} at ${entry_price:,.2f} | SL: ${stop_loss:,.2f} | TP: ${take_profit:,.2f} | R:R: {rr_ratio:.2f}",
                type="TRADE_EXECUTED"
            )
        except:
            pass
    
    def _close_position(self, current_price: float, reason: str = "Manual"):
        """Close current position"""
        
        if not self.paper_trading.open_positions:
            print(f"\n⏸️ No position to close")
            return
        
        print(f"\n🔒 Closing position: {reason}")
        
        for position_id in list(self.paper_trading.open_positions.keys()):
            trade = self.paper_trading.close_position(position_id, current_price, reason)
            
            # Record trade in cycle
            self.cycle_manager.record_trade(trade)
            
            # Record P&L in risk manager
            self.risk_manager.record_trade_pnl(trade['pnl_usd'])
            
            # Evaluate trade for learning
            if self.pro_trader:
                try:
                    evaluation = self.pro_trader.evaluate_trade_for_learning(trade)
                    print(f"   📚 Trade Evaluation:")
                    print(f"      Quality: {evaluation.get('overall_quality', 0):.2f}")
                    if evaluation.get('lessons_learned'):
                        print(f"      Lessons: {evaluation['lessons_learned'][0]}")
                except:
                    pass
            
            print(f"   ✅ Position closed! P&L: ${trade['pnl_usd']:+.2f}")
    
    def _update_positions(self, current_price: float):
        """Update and check open positions"""
        
        if not self.paper_trading.open_positions:
            return
        
        print(f"\n🔍 Checking open position...")
        
        for pos_id, position in self.paper_trading.open_positions.items():
            entry_price = position['entry_price']
            quantity = position['quantity']
            side = position['side']
            
            # Calculate unrealized P&L
            if side == "BUY":
                unrealized_pnl = (current_price - entry_price) * quantity
            else:
                unrealized_pnl = (entry_price - current_price) * quantity
            
            pnl_percent = (unrealized_pnl / position['position_size_usd']) * 100
            
            pnl_color = "🟢" if unrealized_pnl >= 0 else "🔴"
            print(f"   {pnl_color} {side}: ${unrealized_pnl:+.2f} ({pnl_percent:+.2f}%)")
            
            # Update dashboard
            try:
                self.dashboard.update_position_pnl(
                    position_id=pos_id.replace("paper_", ""),
                    current_price=current_price,
                    pnl=unrealized_pnl,
                    pnl_percent=pnl_percent
                )
            except:
                pass
        
        # Check for SL/TP hits
        self.paper_trading.check_positions({self.symbol: current_price})


def main():
    parser = argparse.ArgumentParser(description='Pro AI Crypto Trading Bot')
    parser.add_argument('--symbol', type=str, default='BTCUSDT', help='Trading pair')
    args = parser.parse_args()
    
    bot = ProTradingBot(symbol=args.symbol)
    bot.run()


if __name__ == "__main__":
    main()
