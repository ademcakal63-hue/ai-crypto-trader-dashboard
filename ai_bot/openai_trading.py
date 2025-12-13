"""
OpenAI Trading Decision Module
Real-time chart analysis, news sentiment, and trading decisions using GPT-4
"""

import os
import json
from typing import Dict, List, Optional
from openai import OpenAI

class OpenAITrader:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("❌ OpenAI API key not provided! Add it in Settings or set OPENAI_API_KEY env variable.")
        
        # Use direct OpenAI API (bypass Manus proxy to preserve fine-tuning)
        self.client = OpenAI(
            api_key=self.api_key,
            base_url="https://api.openai.com/v1"  # Direct OpenAI, not Manus proxy
        )
        self.model = "gpt-4-turbo-preview"  # Supports JSON mode
        
    def analyze_chart(self, 
                     symbol: str,
                     timeframe: str,
                     candles: List[Dict],
                     order_book: Optional[Dict] = None,
                     smc_data: Optional[Dict] = None) -> Dict:
        """
        Analyze chart with OpenAI GPT-4
        
        Args:
            symbol: Trading pair (e.g., BTCUSDT)
            timeframe: Timeframe (e.g., 15m, 1h, 4h)
            candles: List of candle data
            order_book: Order book imbalance data (optional)
            smc_data: Smart Money Concepts data (optional)
            
        Returns:
            {
                "signal": "BUY" | "SELL" | "NEUTRAL",
                "confidence": 0.0-1.0,
                "reasoning": "...",
                "patterns": ["FVG", "OB", ...],
                "entry_price": float,
                "stop_loss": float,
                "take_profit": float
            }
        """
        
        # Prepare chart summary
        last_candle = candles[-1]
        chart_summary = {
            "symbol": symbol,
            "timeframe": timeframe,
            "current_price": last_candle['close'],
            "recent_candles": candles[-20:],  # Last 20 candles
            "order_book_imbalance": order_book.get('imbalance', 0) if order_book else None,
            "large_orders": order_book.get('large_orders', []) if order_book else None,
            "smc_patterns": smc_data if smc_data else None
        }
        
        # Create prompt
        prompt = f"""
You are an expert crypto trader analyzing {symbol} on {timeframe} timeframe.

**Chart Data:**
{json.dumps(chart_summary, indent=2)}

**Your Task:**
1. Analyze price action and identify patterns (FVG, Order Blocks, Liquidity Sweeps, BOS)
2. Consider order book imbalance (if provided)
3. Identify Smart Money Concepts (if provided)
4. Provide a trading decision with entry, stop loss, and take profit

**Response Format (JSON):**
{{
  "signal": "BUY" | "SELL" | "NEUTRAL",
  "confidence": 0.0-1.0,
  "reasoning": "Detailed explanation of your analysis",
  "patterns": ["Pattern1", "Pattern2", ...],
  "entry_price": float,
  "stop_loss": float,
  "take_profit": float,
  "risk_reward_ratio": float
}}

**RISK MANAGEMENT RULES (MANDATORY):**
- Only trade if confidence > 0.7
- Risk/Reward ratio must be >= 1.5 (minimum)
- Stop loss is MANDATORY - must be 0.5% - 5% from entry
- Stop loss placement should consider volatility and SMC levels
- Consider order book imbalance (>30% = strong signal)
- Prioritize Smart Money Concepts over traditional indicators
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert crypto trader specializing in Smart Money Concepts and order flow analysis."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3  # Lower temperature for more consistent decisions
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            print(f"❌ OpenAI chart analysis error: {e}")
            return {
                "signal": "NEUTRAL",
                "confidence": 0.0,
                "reasoning": f"Error: {str(e)}",
                "patterns": [],
                "entry_price": last_candle['close'],
                "stop_loss": 0,
                "take_profit": 0,
                "risk_reward_ratio": 0
            }
    
    def analyze_news_sentiment(self, symbol: str, news_data: List[Dict]) -> Dict:
        """
        Analyze news sentiment with OpenAI
        
        Args:
            symbol: Trading pair
            news_data: List of news articles
            
        Returns:
            {
                "sentiment_score": -1.0 to 1.0,
                "summary": "...",
                "key_events": [...]
            }
        """
        
        if not news_data:
            return {
                "sentiment_score": 0.0,
                "summary": "No news available",
                "key_events": []
            }
        
        # Prepare news summary
        news_summary = "\n\n".join([
            f"**{article['title']}**\n{article.get('description', '')}"
            for article in news_data[:10]  # Top 10 news
        ])
        
        prompt = f"""
Analyze the sentiment of these crypto news articles for {symbol}:

{news_summary}

**Response Format (JSON):**
{{
  "sentiment_score": -1.0 to 1.0 (-1=very bearish, 0=neutral, 1=very bullish),
  "summary": "Brief summary of overall sentiment",
  "key_events": ["Event1", "Event2", ...]
}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a crypto news analyst."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            print(f"❌ OpenAI news analysis error: {e}")
            return {
                "sentiment_score": 0.0,
                "summary": f"Error: {str(e)}",
                "key_events": []
            }
    
    def make_final_decision(self,
                           chart_analysis: Dict,
                           news_sentiment: Dict,
                           order_book: Dict,
                           current_positions: List[Dict]) -> Dict:
        """
        Make final trading decision by combining all signals
        
        Args:
            chart_analysis: Chart analysis result
            news_sentiment: News sentiment result
            order_book: Order book data
            current_positions: Current open positions
            
        Returns:
            {
                "action": "OPEN_LONG" | "OPEN_SHORT" | "CLOSE" | "HOLD",
                "confidence": 0.0-1.0,
                "reasoning": "...",
                "position_size": float
            }
        """
        
        context = {
            "chart_signal": chart_analysis.get('signal'),
            "chart_confidence": chart_analysis.get('confidence'),
            "chart_reasoning": chart_analysis.get('reasoning'),
            "patterns": chart_analysis.get('patterns', []),
            "news_sentiment": news_sentiment.get('sentiment_score'),
            "news_summary": news_sentiment.get('summary'),
            "order_book_imbalance": order_book.get('imbalance', 0),
            "large_orders": order_book.get('large_orders', []),
            "current_positions": len(current_positions),
            "risk_reward": chart_analysis.get('risk_reward_ratio', 0)
        }
        
        prompt = f"""
You are the final decision maker for a crypto trading bot.

**All Signals:**
{json.dumps(context, indent=2)}

**Your Task:**
Combine all signals and make the FINAL trading decision.

**HARD LIMITS (CANNOT BE EXCEEDED):**
- Maximum position size: 2% of capital
- Maximum daily loss: 4% of capital
- Stop loss: MANDATORY for every trade
- Minimum risk/reward ratio: 1.5

**Decision Rules:**
1. Chart confidence must be > 0.7
2. Risk/Reward ratio must be >= 1.5 (from chart analysis)
3. News sentiment should align with chart signal (or be neutral)
4. Order book imbalance should support the direction (>20%)
5. Don't open new positions if already have 2+ open positions
6. Position size should be based on confidence:
   - High confidence (>0.85): 1.5% - 2%
   - Medium confidence (0.75-0.85): 1% - 1.5%
   - Low confidence (0.7-0.75): 0.5% - 1%
7. Consider volatility when deciding position size
8. If daily loss is approaching 4%, be MORE conservative

**Response Format (JSON):**
{{
  "action": "OPEN_LONG" | "OPEN_SHORT" | "CLOSE" | "HOLD",
  "confidence": 0.0-1.0,
  "reasoning": "Detailed explanation combining all signals and risk management",
  "position_size_percent": 0.5-2.0 (% of capital, based on confidence and risk)
}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are the brain of a professional crypto trading bot. Make conservative, high-probability decisions."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2  # Very low temperature for final decisions
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            print(f"❌ OpenAI final decision error: {e}")
            return {
                "action": "HOLD",
                "confidence": 0.0,
                "reasoning": f"Error: {str(e)}",
                "position_size_percent": 0
            }


# Example usage
if __name__ == "__main__":
    trader = OpenAITrader()
    
    # Example candle data
    candles = [
        {"open": 43000, "high": 43500, "low": 42800, "close": 43200, "volume": 1000},
        {"open": 43200, "high": 43800, "low": 43100, "close": 43600, "volume": 1200},
        # ... more candles
    ]
    
    # Example order book
