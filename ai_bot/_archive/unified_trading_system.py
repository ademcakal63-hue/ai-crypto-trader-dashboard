"""
Unified Trading System
Integrates OpenAI, Order Book, SMC, and Technical Analysis
OpenAI acts as the "brain" making final decisions
"""

import os
import json
from typing import Dict, List, Optional
from openai_trading import OpenAITrader
from orderbook_analyzer import OrderBookAnalyzer
from smc_detector import SMCDetector
from binance_client import BinanceClient
from news_analyzer import NewsAnalyzer

class UnifiedTradingSystem:
    def __init__(self, 
                 binance_api_key: str,
                 binance_api_secret: str,
                 openai_api_key: str,
                 testnet: bool = False):
        """
        Initialize Unified Trading System
        
        Args:
            binance_api_key: Binance API key
            binance_api_secret: Binance API secret
            openai_api_key: OpenAI API key
            testnet: Use Binance testnet
        """
        
        # Initialize modules
        self.binance = BinanceClient(binance_api_key, binance_api_secret, testnet)
        self.openai_trader = OpenAITrader()
        self.orderbook_analyzer = OrderBookAnalyzer(binance_api_key, binance_api_secret, testnet)
        self.smc_detector = SMCDetector()
        self.news_analyzer = NewsAnalyzer()
        
        print("✅ Unified Trading System initialized")
        print("   - OpenAI: Connected")
        print("   - Binance: Connected")
        print("   - Order Book: Ready")
        print("   - SMC Detector: Ready")
    
    def analyze_and_decide(self, symbol: str, timeframe: str = "15m") -> Dict:
        """
        Complete analysis and trading decision
        
        This is the main function that:
        1. Fetches candle data
        2. Analyzes order book
        3. Detects SMC patterns
        4. Analyzes news sentiment
        5. Uses OpenAI to make final decision
        
        Args:
            symbol: Trading pair (e.g., BTCUSDT)
            timeframe: Timeframe (e.g., 15m, 1h, 4h)
            
        Returns:
            {
                "action": "OPEN_LONG" | "OPEN_SHORT" | "CLOSE" | "HOLD",
                "confidence": 0.0-1.0,
                "reasoning": "...",
                "entry_price": float,
                "stop_loss": float,
                "take_profit": float,
                "position_size_percent": float,
                "signals": {
                    "chart": {...},
                    "orderbook": {...},
                    "smc": {...},
                    "news": {...}
                }
            }
        """
        
        print(f"\n{'='*60}")
        print(f"🔍 Analyzing {symbol} on {timeframe}")
        print(f"{'='*60}")
        
        # Step 1: Fetch candle data
        print("📊 Fetching candle data...")
        candles = self.binance.get_klines(symbol, timeframe, limit=100)
        current_price = candles[-1]['close']
        print(f"   Current price: ${current_price:,.2f}")
        
        # Step 2: Analyze order book
        print("📖 Analyzing order book...")
        self.orderbook_analyzer.get_orderbook_snapshot(symbol, limit=20)
        orderbook_analysis = self.orderbook_analyzer.analyze_orderbook(symbol, current_price)
        print(f"   Imbalance: {orderbook_analysis['imbalance_percent']:.2f}%")
        print(f"   Signal: {orderbook_analysis['signal']}")
        print(f"   Large orders: {len(orderbook_analysis['large_orders'])}")
        
        # Step 3: Detect SMC patterns
        print("🎯 Detecting Smart Money Concepts...")
        smc_patterns = self.smc_detector.detect_all_patterns(candles, timeframe)
        print(f"   Order Blocks: {len(smc_patterns['order_blocks'])}")
        print(f"   Fair Value Gaps: {len(smc_patterns['fair_value_gaps'])}")
        print(f"   Liquidity Sweeps: {len(smc_patterns['liquidity_sweeps'])}")
        
        # Step 4: Analyze news sentiment
        print("📰 Analyzing news sentiment...")
        news_data = self.news_analyzer.get_crypto_news(symbol)
        news_sentiment = self.openai_trader.analyze_news_sentiment(symbol, news_data)
        print(f"   Sentiment score: {news_sentiment['sentiment_score']:.2f}")
        print(f"   Summary: {news_sentiment['summary'][:100]}...")
        
        # Step 5: OpenAI chart analysis
        print("🤖 OpenAI analyzing chart...")
        chart_analysis = self.openai_trader.analyze_chart(
            symbol=symbol,
            timeframe=timeframe,
            candles=candles,
            order_book=orderbook_analysis,
            smc_data=smc_patterns
        )
        print(f"   Signal: {chart_analysis['signal']}")
        print(f"   Confidence: {chart_analysis['confidence']:.2f}")
        print(f"   Patterns: {', '.join(chart_analysis['patterns'])}")
        
        # Step 6: OpenAI final decision (THE BRAIN)
        print("🧠 OpenAI making final decision...")
        current_positions = self.binance.get_open_positions(symbol)
        final_decision = self.openai_trader.make_final_decision(
            chart_analysis=chart_analysis,
            news_sentiment=news_sentiment,
            order_book=orderbook_analysis,
            current_positions=current_positions
        )
        
        print(f"\n{'='*60}")
        print(f"🎯 FINAL DECISION: {final_decision['action']}")
        print(f"   Confidence: {final_decision['confidence']:.2f}")
        print(f"   Reasoning: {final_decision['reasoning'][:150]}...")
        print(f"{'='*60}\n")
        
        # Combine all data
        result = {
            "action": final_decision['action'],
            "confidence": final_decision['confidence'],
            "reasoning": final_decision['reasoning'],
            "entry_price": chart_analysis.get('entry_price', current_price),
            "stop_loss": chart_analysis.get('stop_loss', 0),
            "take_profit": chart_analysis.get('take_profit', 0),
            "position_size_percent": final_decision.get('position_size_percent', 2),
            "current_price": current_price,
            "signals": {
                "chart": chart_analysis,
                "orderbook": orderbook_analysis,
                "smc": smc_patterns,
                "news": news_sentiment
            }
        }
        
        return result
    
    def execute_decision(self, symbol: str, decision: Dict) -> bool:
        """
        Execute trading decision
        
        Args:
            symbol: Trading pair
            decision: Decision from analyze_and_decide()
            
        Returns:
            True if executed successfully
        """
        
        action = decision['action']
        confidence = decision['confidence']
        
        # Safety checks
        if confidence < 0.7:
            print(f"⚠️ Confidence too low ({confidence:.2f}). Not executing.")
            return False
        
        if action == "HOLD":
            print("⏸️ Decision: HOLD. No action taken.")
            return True
        
        # Execute action
        try:
            if action == "OPEN_LONG":
                print(f"🟢 Opening LONG position...")
                result = self.binance.open_position(
                    symbol=symbol,
                    side="BUY",
                    entry_price=decision['entry_price'],
                    stop_loss=decision['stop_loss'],
                    take_profit=decision['take_profit'],
                    position_size_percent=decision['position_size_percent']
                )
                print(f"✅ LONG position opened: {result}")
                return True
                
            elif action == "OPEN_SHORT":
                print(f"🔴 Opening SHORT position...")
                result = self.binance.open_position(
                    symbol=symbol,
                    side="SELL",
                    entry_price=decision['entry_price'],
                    stop_loss=decision['stop_loss'],
                    take_profit=decision['take_profit'],
                    position_size_percent=decision['position_size_percent']
                )
                print(f"✅ SHORT position opened: {result}")
                return True
                
            elif action == "CLOSE":
                print(f"🔒 Closing positions...")
                result = self.binance.close_all_positions(symbol)
                print(f"✅ Positions closed: {result}")
                return True
                
        except Exception as e:
            print(f"❌ Execution error: {e}")
            return False
    
    def run_trading_loop(self, 
                        symbols: List[str] = ["BTCUSDT"],
                        timeframe: str = "15m",
                        interval_seconds: int = 60):
        """
        Main trading loop
        
        Args:
            symbols: List of trading pairs
            timeframe: Timeframe to analyze
            interval_seconds: Seconds between analysis cycles
        """
        
        import time
        
        print(f"\n{'='*60}")
        print(f"🚀 Starting Unified Trading System")
        print(f"   Symbols: {', '.join(symbols)}")
        print(f"   Timeframe: {timeframe}")
        print(f"   Interval: {interval_seconds}s")
        print(f"{'='*60}\n")
        
        while True:
            try:
                for symbol in symbols:
                    # Analyze and decide
                    decision = self.analyze_and_decide(symbol, timeframe)
                    
                    # Execute decision
                    self.execute_decision(symbol, decision)
                    
                    # Save to learning system
                    self._save_decision_for_learning(symbol, decision)
                
                # Wait for next cycle
                print(f"\n⏰ Waiting {interval_seconds}s until next analysis...")
                time.sleep(interval_seconds)
                
            except KeyboardInterrupt:
                print("\n\n🛑 Trading loop stopped by user")
                break
                
            except Exception as e:
                print(f"\n❌ Error in trading loop: {e}")
                print("⏰ Waiting 60s before retry...")
                time.sleep(60)
    
    def _save_decision_for_learning(self, symbol: str, decision: Dict):
        """Save decision to learning system for future fine-tuning"""
        try:
            # Save to database or file for weekly fine-tuning
            learning_data = {
                "symbol": symbol,
                "timestamp": time.time(),
                "decision": decision
            }
            
            # Append to learning file
            with open("ai_bot/learning_data.jsonl", "a") as f:
                f.write(json.dumps(learning_data) + "\n")
                
        except Exception as e:
            print(f"⚠️ Failed to save learning data: {e}")


# Example usage
if __name__ == "__main__":
    import os
    import time
    
    # Load API keys
    binance_api_key = os.getenv("BINANCE_API_KEY")
    binance_api_secret = os.getenv("BINANCE_API_SECRET")
    openai_api_key = os.getenv("OPENAI_API_KEY")
    
    # Initialize system
    system = UnifiedTradingSystem(
        binance_api_key=binance_api_key,
        binance_api_secret=binance_api_secret,
        openai_api_key=openai_api_key,
        testnet=False
    )
    
    # Run single analysis
    decision = system.analyze_and_decide("BTCUSDT", "15m")
    print(json.dumps(decision, indent=2))
    
    # Or run continuous trading loop
    # system.run_trading_loop(
    #     symbols=["BTCUSDT"],
    #     timeframe="15m",
    #     interval_seconds=60
    # )
