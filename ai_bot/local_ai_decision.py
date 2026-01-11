#!/usr/bin/env python3
"""
Local AI Decision Module - Uses OpenAI/DeepSeek API directly
Optimized for cost efficiency and better trading decisions

OPTIMIZATIONS:
1. Token usage reduced from ~1200 to ~600 per call
2. WAIT counter to prevent overtrading
3. SHORT bias fix - balanced LONG/SHORT decisions
4. Confidence threshold enforcement
5. Better risk/reward validation
"""

import os
import json
import time
from typing import Dict, List, Optional
from openai import OpenAI

# Base directory - works on both sandbox and VPS
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Optimized system prompt - ~400 tokens (down from ~800)
SYSTEM_PROMPT = """You are a professional BTC futures trader. Analyze data and decide.

RULES:
- Capital: $10,000 | Max risk per trade: 2% ($200) | Daily loss limit: 4% ($400)
- Leverage: 1x-10x (you decide based on setup quality)
- ONLY 1 position at a time
- Min R:R ratio: 1.5 (risk $200 to make $300+)
- Min SL distance: 0.5% | Max SL distance: 3%

ACTIONS:
1. WAIT - No good setup, market unclear
2. PLACE_LIMIT_ORDER - Entry at key level (OB/FVG)
3. OPEN_MARKET - Immediate entry (strong signal)
4. CLOSE_POSITION - Exit current position
5. MODIFY_SL_TP - Adjust stops
6. CANCEL_ORDER - Cancel pending order

BIAS BALANCE:
- If price FALLING + Whale BEARISH → Consider SHORT
- If price RISING + Whale BULLISH → Consider LONG
- Don't always go LONG! SHORT is equally profitable.

OUTPUT JSON:
{
  "action": "WAIT|PLACE_LIMIT_ORDER|OPEN_MARKET|CLOSE_POSITION|MODIFY_SL_TP|CANCEL_ORDER",
  "params": {"side":"BUY/SELL","entry_price":0,"stop_loss":0,"take_profit":0,"leverage":3,"reasoning":"..."},
  "confidence": 0.0-1.0,
  "risk_reward": 0.0,
  "reasoning": "Brief explanation"
}"""


class LocalAIDecision:
    """Local AI Decision using OpenAI/DeepSeek API directly"""
    
    # Class-level WAIT counter to prevent overtrading
    _consecutive_trades = 0
    _last_trade_time = 0
    _min_wait_between_trades = 600  # 10 minutes minimum between trades
    
    # Cost comparison (per 1M tokens)
    COST_PER_1M_TOKENS = {
        "openai": {"input": 10.0, "output": 30.0},  # GPT-4 Turbo
        "deepseek": {"input": 0.14, "output": 0.28}  # DeepSeek V3 - 70x cheaper!
    }
    
    def __init__(self):
        """Initialize with DeepSeek (preferred) or OpenAI API"""
        # Check for API keys
        deepseek_key = os.getenv("DEEPSEEK_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")
        
        # DeepSeek V3 - 70x cheaper than GPT-4! Use it if available
        if deepseek_key:
            self.client = OpenAI(
                api_key=deepseek_key,
                base_url="https://api.deepseek.com/v1"
            )
            self.model = "deepseek-chat"  # DeepSeek V3
            self.provider = "DeepSeek"
            self.cost_per_1m = self.COST_PER_1M_TOKENS["deepseek"]
            print("✅ Local AI Decision initialized with DeepSeek V3 API")
            print("   💰 Cost: $0.14/1M input, $0.28/1M output (70x cheaper than GPT-4!)")
        elif openai_key:
            self.client = OpenAI(
                api_key=openai_key,
                base_url="https://api.openai.com/v1"
            )
            self.model = "gpt-4-turbo-preview"
            self.provider = "OpenAI"
            self.cost_per_1m = self.COST_PER_1M_TOKENS["openai"]
            print(f"✅ Local AI Decision initialized with OpenAI API")
            print("   💰 Cost: $10/1M input, $30/1M output")
            print("   💡 Tip: Set DEEPSEEK_API_KEY for 70x cost savings!")
        else:
            raise ValueError("❌ No API key found! Set DEEPSEEK_API_KEY or OPENAI_API_KEY in .env file")
        
        # Confidence threshold - don't trade below this
        self.min_confidence = 0.65
        
        # Track API usage for cost monitoring
        self.total_tokens_used = 0
        self.total_api_calls = 0
        self.total_cost_usd = 0.0
        
        # Load learned rules from learning system
        self.learned_rules = self._load_learned_rules()
    
    def _load_learned_rules(self) -> str:
        """Load learned rules from learning system"""
        try:
            rules_file = os.path.join(BASE_DIR, "learned_rules.txt")
            with open(rules_file, "r") as f:
                rules = f.read().strip()
            if rules:
                print(f"   📚 Loaded {len(rules.split(chr(10)))} learned rules")
                return rules
        except FileNotFoundError:
            pass
        return ""
    
    def _get_enhanced_system_prompt(self) -> str:
        """Get system prompt with learned rules appended"""
        if self.learned_rules:
            return SYSTEM_PROMPT + "\n\n" + self.learned_rules
        return SYSTEM_PROMPT
    
    def _format_compact_data(self, data: Dict) -> str:
        """Format market data compactly to reduce tokens (~200 tokens)"""
        price = data.get('current_price', 0)
        change_24h = data.get('price_change_24h', 0)
        
        # Order book summary
        ob = data.get('order_book', {})
        whale_bias = ob.get('whale_bias', 'NEUTRAL')
        buy_pressure = ob.get('buy_pressure', 0.5) * 100
        sell_pressure = ob.get('sell_pressure', 0.5) * 100
        
        # Last 5 candles summary
        candles = data.get('candles', [])[-5:]
        candle_summary = []
        for c in candles:
            if isinstance(c, (list, tuple)) and len(c) >= 5:
                o, close = float(c[1]), float(c[4])
                direction = "+" if close > o else "-"
                candle_summary.append(f"{direction}{abs((close-o)/o*100):.1f}%")
        
        # Patterns summary
        patterns = data.get('patterns', {})
        ob_count = len(patterns.get('order_blocks', []))
        fvg_count = len(patterns.get('fair_value_gaps', []))
        
        # Key levels from patterns
        key_levels = []
        for ob_item in patterns.get('order_blocks', [])[:2]:
            key_levels.append(f"OB@{ob_item.get('price', 0):.0f}")
        for fvg in patterns.get('fair_value_gaps', [])[:2]:
            key_levels.append(f"FVG@{fvg.get('low', 0):.0f}-{fvg.get('high', 0):.0f}")
        
        # Open positions
        positions = data.get('open_positions', [])
        pos_summary = "None"
        if positions:
            p = positions[0]
            pos_summary = f"{p.get('side')}@{p.get('entry_price', 0):.0f} P&L:{p.get('pnl', 0):.2f}"
        
        # Pending orders
        orders = data.get('pending_orders', [])
        order_summary = "None"
        if orders:
            o = orders[0]
            order_summary = f"{o.get('side')}@{o.get('price', 0):.0f}"
        
        # Account status
        balance = data.get('balance', 10000)
        daily_pnl = data.get('daily_pnl', 0)
        daily_limit = data.get('daily_loss_limit', 400)
        
        return f"""MARKET:
Price: ${price:,.0f} | 24h: {change_24h:+.1f}%
Whale: {whale_bias} | Buy: {buy_pressure:.0f}% | Sell: {sell_pressure:.0f}%
Candles: {' '.join(candle_summary)}
Patterns: {ob_count} OBs, {fvg_count} FVGs | Levels: {', '.join(key_levels) or 'None'}

ACCOUNT:
Balance: ${balance:,.0f} | Daily P&L: ${daily_pnl:.0f}/${daily_limit:.0f}
Position: {pos_summary}
Pending: {order_summary}

DECIDE NOW:"""
    
    def _should_force_wait(self, data: Dict) -> tuple:
        """Check if we should force WAIT to prevent overtrading"""
        current_time = time.time()
        
        # Check daily loss limit
        daily_pnl = data.get('daily_pnl', 0)
        daily_limit = data.get('daily_loss_limit', 400)
        if daily_pnl <= -daily_limit * 0.8:  # 80% of daily limit used
            return True, f"Daily loss limit nearly reached ({daily_pnl:.0f}/{daily_limit:.0f})"
        
        # Check if we already have a position
        if data.get('open_positions'):
            return True, "Already have an open position"
        
        # Check if we already have a pending order
        if data.get('pending_orders'):
            return True, "Already have a pending order"
        
        # Check minimum time between trades
        if current_time - self._last_trade_time < self._min_wait_between_trades:
            remaining = int(self._min_wait_between_trades - (current_time - self._last_trade_time))
            return True, f"Cooling down ({remaining}s remaining)"
        
        return False, ""
    
    def _validate_decision(self, decision: Dict, data: Dict) -> Dict:
        """Validate and potentially override AI decision"""
        action = decision.get('action', 'WAIT')
        confidence = decision.get('confidence', 0)
        params = decision.get('params', {})
        
        # Force WAIT if confidence too low
        if action in ['PLACE_LIMIT_ORDER', 'OPEN_MARKET'] and confidence < self.min_confidence:
            return {
                "action": "WAIT",
                "reasoning": f"Confidence too low ({confidence:.0%} < {self.min_confidence:.0%})",
                "confidence": confidence
            }
        
        # Validate R:R ratio
        if action in ['PLACE_LIMIT_ORDER', 'OPEN_MARKET']:
            entry = params.get('entry_price', params.get('price', data.get('current_price', 0)))
            sl = params.get('stop_loss', 0)
            tp = params.get('take_profit', 0)
            
            if entry and sl and tp:
                risk = abs(entry - sl)
                reward = abs(tp - entry)
                
                if risk > 0:
                    rr = reward / risk
                    if rr < 1.5:
                        return {
                            "action": "WAIT",
                            "reasoning": f"R:R ratio too low ({rr:.2f} < 1.5)",
                            "confidence": confidence
                        }
                
                # Validate SL distance
                sl_percent = (risk / entry) * 100 if entry > 0 else 0
                if sl_percent < 0.5:
                    return {
                        "action": "WAIT",
                        "reasoning": f"SL too tight ({sl_percent:.2f}% < 0.5%)",
                        "confidence": confidence
                    }
                if sl_percent > 3:
                    return {
                        "action": "WAIT",
                        "reasoning": f"SL too wide ({sl_percent:.2f}% > 3%)",
                        "confidence": confidence
                    }
        
        return decision
    
    def make_decision(self, market_data: Dict) -> Dict:
        """Make AI trading decision using OpenAI/DeepSeek API"""
        
        # Check if we should force WAIT
        should_wait, wait_reason = self._should_force_wait(market_data)
        if should_wait:
            print(f"   ⏸️ Forced WAIT: {wait_reason}")
            return {
                "action": "WAIT",
                "reasoning": wait_reason,
                "confidence": 0
            }
        
        try:
            # Prepare compact market summary
            user_message = self._format_compact_data(market_data)
            
            # Make API call
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._get_enhanced_system_prompt()},
                    {"role": "user", "content": user_message}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,  # Lower temperature for more consistent decisions
                max_tokens=500  # Reduced from 2000
            )
            
            # Track token usage and cost
            if hasattr(response, 'usage'):
                input_tokens = response.usage.prompt_tokens
                output_tokens = response.usage.completion_tokens
                total_tokens = response.usage.total_tokens
                
                # Calculate cost
                input_cost = (input_tokens / 1_000_000) * self.cost_per_1m["input"]
                output_cost = (output_tokens / 1_000_000) * self.cost_per_1m["output"]
                call_cost = input_cost + output_cost
                
                self.total_tokens_used += total_tokens
                self.total_api_calls += 1
                self.total_cost_usd += call_cost
                
                print(f"   📊 Tokens: {total_tokens} | Cost: ${call_cost:.4f} | Total: ${self.total_cost_usd:.4f} ({self.provider})")
            
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from API")
            
            decision = json.loads(content)
            
            # Validate decision
            decision = self._validate_decision(decision, market_data)
            
            # Update trade tracking if taking action
            if decision.get('action') in ['PLACE_LIMIT_ORDER', 'OPEN_MARKET']:
                self._last_trade_time = time.time()
                self._consecutive_trades += 1
            
            return decision
            
        except Exception as e:
            print(f"❌ Local AI Decision Error: {e}")
            return {
                "action": "WAIT",
                "reasoning": f"AI error: {str(e)}",
                "confidence": 0
            }
    
    def get_stats(self) -> Dict:
        """Get API usage statistics"""
        avg_tokens = self.total_tokens_used / max(self.total_api_calls, 1)
        avg_cost_per_call = self.total_cost_usd / max(self.total_api_calls, 1)
        
        # Calculate savings if using DeepSeek vs OpenAI
        openai_equivalent_cost = self.total_tokens_used * 0.00003  # GPT-4 Turbo avg
        savings = openai_equivalent_cost - self.total_cost_usd if self.provider == "DeepSeek" else 0
        
        return {
            "provider": self.provider,
            "model": self.model,
            "total_calls": self.total_api_calls,
            "total_tokens": self.total_tokens_used,
            "avg_tokens_per_call": round(avg_tokens, 0),
            "total_cost_usd": round(self.total_cost_usd, 4),
            "avg_cost_per_call": round(avg_cost_per_call, 6),
            "savings_vs_openai": round(savings, 4) if savings > 0 else 0
        }


# Test
if __name__ == "__main__":
    ai = LocalAIDecision()
    
    test_data = {
        "current_price": 91000,
        "price_change_24h": -2.5,  # Falling price
        "candles": [[0, 91500, 92000, 90500, 91000, 1000]] * 10,
        "patterns": {
            "order_blocks": [{"type": "BEARISH", "price": 92000, "strength": 0.8}],
            "fair_value_gaps": [{"type": "BEARISH", "low": 90000, "high": 90500}]
        },
        "order_book": {
            "whale_bias": "BEARISH",  # Bearish bias
            "buy_pressure": 0.35,
            "sell_pressure": 0.65
        },
        "open_positions": [],
        "pending_orders": [],
        "balance": 10000,
        "capital": 10000,
        "daily_pnl": 0,
        "daily_loss_limit": 400
    }
    
    decision = ai.make_decision(test_data)
    print(json.dumps(decision, indent=2))
    print("\n📊 Stats:", ai.get_stats())
