"""
AI Crypto Trading Bot - Main Entry Point
With Paper Trading, Risk Management, and 100-Trade Cycles
"""

import os
import sys
import time
import argparse
from datetime import datetime
from typing import Dict, List

# Import all modules
from paper_trading import PaperTradingManager
from risk_manager import RiskManager
from trade_cycle_manager import TradeCycleManager
from openai_trading import OpenAITrader
from orderbook_analyzer import OrderBookAnalyzer
from smc_detector import SMCDetector
from news_analyzer import NewsAnalyzer
from dashboard_client import DashboardClient
from binance_client import BinanceClient

class TradingBot:
    """
    Main Trading Bot with Paper Trading and Risk Management
    
    Flow:
    1. Paper Trading Mode (First 100 trades)
    2. Risk Management (2% per trade, 4% daily loss)
    3. 100-Trade Cycles with Auto Fine-Tuning
    4. OpenAI as Decision Brain
    """
    
    def __init__(self, symbol: str = "BTCUSDT"):
        self.symbol = symbol
        
        print(f"\n{'='*60}")
        print(f"🤖 AI CRYPTO TRADING BOT - {symbol}")
        print(f"{'='*60}\n")
        
        # Initialize components
        print("📦 Initializing components...")
        
        self.dashboard = DashboardClient()
        self.settings = self.dashboard.get_settings()
        
        # Get capital from settings
        self.capital = self._get_capital()
        
        # Initialize managers
        self.paper_trading = PaperTradingManager(initial_balance=self.capital)
        self.risk_manager = RiskManager()
        self.cycle_manager = TradeCycleManager()
        
        # Initialize trading modules
        self.openai_trader = OpenAITrader()
        self.orderbook_analyzer = OrderBookAnalyzer(symbol)
        self.smc_detector = SMCDetector()
        self.news_analyzer = NewsAnalyzer()
        self.binance = BinanceClient()
        
        print(f"✅ All components initialized!\n")
        
        # Print current status
        self._print_status()
    
    def _get_capital(self) -> float:
        """Get capital from settings or Binance balance"""
        try:
            # Get Binance balance
            balance = self.binance.get_futures_balance()
            
            if self.settings.get('useAllBalance'):
                return balance
            
            capital_limit = self.settings.get('capitalLimit')
            if capital_limit:
                return min(balance, float(capital_limit))
            
            return balance
        except:
            # Fallback to default
            return 10000
    
    def _print_status(self):
        """Print current bot status"""
        cycle_info = self.cycle_manager.get_cycle_info()
        risk_summary = self.risk_manager.get_risk_summary(self.capital)
        stats = self.paper_trading.get_statistics()
        
        print(f"\n📊 CURRENT STATUS")
        print(f"{'='*60}")
        print(f"Mode: {cycle_info['mode']}")
        print(f"Cycle: {cycle_info['current_cycle']}")
        print(f"Trades in cycle: {cycle_info['trades_in_cycle']}/{cycle_info['trades_per_cycle']}")
        print(f"Total trades: {cycle_info['total_trades']}")
        print(f"\n💰 CAPITAL & RISK")
        print(f"Capital: ${self.capital:,.2f}")
        print(f"Max position size: ${risk_summary['max_position_size_usd']:,.2f} ({risk_summary['max_position_size_percent']}%)")
        print(f"Max daily loss: ${risk_summary['max_daily_loss_usd']:,.2f} ({risk_summary['max_daily_loss_percent']}%)")
        print(f"Today's P&L: ${risk_summary['daily_pnl_usd']:,.2f} ({risk_summary['daily_pnl_percent']:.2f}%)")
        print(f"\n📈 PERFORMANCE")
        print(f"Win rate: {stats['win_rate']:.1f}%")
        print(f"Total P&L: ${stats['total_pnl_usd']:,.2f} ({stats['total_pnl_percent']:+.2f}%)")
        print(f"Current balance: ${stats['current_balance']:,.2f}")
        print(f"{'='*60}\n")
    
    def run(self):
        """Main trading loop"""
        
        print(f"🚀 Starting trading loop for {self.symbol}...")
        print(f"⏰ Checking every 60 seconds\n")
        
        while True:
            try:
                # Check if bot should run
                if not self._should_run():
                    print(f"⏸️ Bot paused (daily loss limit or manual stop)")
                    time.sleep(60)
                    continue
                
                # Run trading cycle
                self._trading_cycle()
                
                # Sleep
                time.sleep(60)
                
            except KeyboardInterrupt:
                print(f"\n⏹️ Bot stopped by user")
                break
            except Exception as e:
                print(f"❌ Error in main loop: {e}")
                time.sleep(60)
    
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
        """Single trading cycle"""
        
        print(f"\n{'='*60}")
        print(f"🔄 Trading Cycle - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}")
        
        # 1. Get market data
        print(f"\n📊 Fetching market data...")
        candles = self.binance.get_candles(self.symbol, "15m", limit=100)
        current_price = candles[-1]['close']
        print(f"   Current price: ${current_price:,.2f}")
        
        # 2. Analyze order book
        print(f"\n📖 Analyzing order book...")
        orderbook_data = self.orderbook_analyzer.get_latest_analysis()
        print(f"   Imbalance: {orderbook_data.get('imbalance', 0):.2f}%")
        
        # 3. Detect SMC patterns
        print(f"\n🧠 Detecting SMC patterns...")
        smc_data = self.smc_detector.analyze(candles)
        print(f"   Patterns found: {len(smc_data.get('patterns', []))}")
        
        # 4. Get news sentiment
        print(f"\n📰 Analyzing news sentiment...")
        news_data = self.news_analyzer.get_latest_news(self.symbol)
        news_sentiment = self.openai_trader.analyze_news_sentiment(self.symbol, news_data)
        print(f"   Sentiment: {news_sentiment.get('sentiment_score', 0):.2f}")
        
        # 5. OpenAI chart analysis
        print(f"\n🤖 OpenAI chart analysis...")
        chart_analysis = self.openai_trader.analyze_chart(
            symbol=self.symbol,
            timeframe="15m",
            candles=candles,
            order_book=orderbook_data,
            smc_data=smc_data
        )
        print(f"   Signal: {chart_analysis.get('signal')}")
        print(f"   Confidence: {chart_analysis.get('confidence', 0):.2f}")
        
        # 6. OpenAI final decision
        print(f"\n🧠 OpenAI final decision...")
        current_positions = list(self.paper_trading.open_positions.values())
        final_decision = self.openai_trader.make_final_decision(
            chart_analysis=chart_analysis,
            news_sentiment=news_sentiment,
            order_book=orderbook_data,
            current_positions=current_positions
        )
        
        print(f"   Action: {final_decision.get('action')}")
        print(f"   Confidence: {final_decision.get('confidence', 0):.2f}")
        print(f"   Position size: {final_decision.get('position_size_percent', 0):.2f}%")
        print(f"   Reasoning: {final_decision.get('reasoning', '')[:100]}...")
        
        # 7. Execute decision
        self._execute_decision(final_decision, chart_analysis, current_price)
        
        # 8. Check open positions
        self._check_positions(current_price)
        
        print(f"\n{'='*60}\n")
    
    def _execute_decision(self, decision: Dict, chart_analysis: Dict, current_price: float):
        """Execute trading decision"""
        
        action = decision.get('action')
        
        if action == "HOLD":
            print(f"\n⏸️ Decision: HOLD")
            return
        
        if action in ["OPEN_LONG", "OPEN_SHORT"]:
            self._open_position(decision, chart_analysis, current_price)
        
        elif action == "CLOSE":
            self._close_all_positions(current_price)
    
    def _open_position(self, decision: Dict, chart_analysis: Dict, current_price: float):
        """Open a new position"""
        
        print(f"\n🔓 Opening position...")
        
        # Get parameters
        side = "BUY" if decision['action'] == "OPEN_LONG" else "SELL"
        position_size_percent = decision.get('position_size_percent', 1.0)
        entry_price = chart_analysis.get('entry_price', current_price)
        stop_loss = chart_analysis.get('stop_loss', 0)
        take_profit = chart_analysis.get('take_profit', 0)
        confidence = decision.get('confidence', 0)
        reasoning = decision.get('reasoning', '')
        
        # Validate with risk manager
        is_valid, reason, details = self.risk_manager.validate_trade(
            capital=self.capital,
            position_size_percent=position_size_percent,
            entry_price=entry_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            side=side
        )
        
        if not is_valid:
            print(f"   ❌ Trade rejected: {reason}")
            return
        
        print(f"   ✅ Trade validated: {reason}")
        print(f"   Position size: ${details['position_size_usd']:,.2f} ({details['position_size_percent']:.2f}%)")
        print(f"   Risk amount: ${details['risk_amount_usd']:,.2f} ({details['risk_amount_percent']:.2f}%)")
        print(f"   Risk/Reward: {details['risk_reward_ratio']:.2f}")
        
        # Check if paper trading can open trade
        can_open, reason = self.paper_trading.can_open_trade(details['position_size_percent'])
        if not can_open:
            print(f"   ❌ Paper trading rejected: {reason}")
            return
        
        # Open paper trading position
        position = self.paper_trading.open_position(
            symbol=self.symbol,
            side=side,
            entry_price=entry_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            position_size_percent=details['position_size_percent'],
            confidence=confidence,
            reasoning=reasoning
        )
        
        print(f"   ✅ Position opened!")
        
        # Send notification
        try:
            self.dashboard.send_notification(
                title=f"Position Opened: {self.symbol}",
                message=f"{side} {self.symbol} at ${entry_price:,.2f} (Size: {details['position_size_percent']:.2f}%)",
                type="TRADE_EXECUTED"
            )
        except:
            pass
    
    def _close_all_positions(self, current_price: float):
        """Close all open positions"""
        
        if not self.paper_trading.open_positions:
            print(f"\n⏸️ No positions to close")
            return
        
        print(f"\n🔒 Closing all positions...")
        
        for position_id in list(self.paper_trading.open_positions.keys()):
            trade = self.paper_trading.close_position(position_id, current_price, "MANUAL")
            
            # Record trade in cycle
            self.cycle_manager.record_trade(trade)
            
            # Record P&L in risk manager
            self.risk_manager.record_trade_pnl(trade['pnl_usd'])
        
        print(f"   ✅ All positions closed!")
    
    def _check_positions(self, current_price: float):
        """Check open positions for stop loss or take profit"""
        
        if not self.paper_trading.open_positions:
            return
        
        print(f"\n🔍 Checking {len(self.paper_trading.open_positions)} open positions...")
        
        # Check positions
        self.paper_trading.check_positions({self.symbol: current_price})
        
        # If any positions were closed, record them
        # (This is handled inside paper_trading.check_positions)


def main():
    """Main entry point"""
    
    parser = argparse.ArgumentParser(description="AI Crypto Trading Bot")
    parser.add_argument("--symbol", default="BTCUSDT", help="Trading pair (default: BTCUSDT)")
    args = parser.parse_args()
    
    # Create bot
    bot = TradingBot(symbol=args.symbol)
    
    # Run bot
    bot.run()


if __name__ == "__main__":
    main()
