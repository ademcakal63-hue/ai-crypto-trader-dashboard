"""
Smart Money Concepts (SMC) Detection Module
Detects Order Blocks, Fair Value Gaps, Liquidity Sweeps, Break of Structure
Uses OpenAI for advanced pattern recognition
"""

import json
from typing import Dict, List, Optional
from openai import OpenAI
import os

class SMCDetector:
    def __init__(self, api_key: str = None):
        # Her zaman Dashboard'dan API key'i yükle (env var eski olabilir)
        self._load_api_key_from_dashboard()
        
        # Eğer parametre verilmişse onu kullan
        if api_key:
            self.api_key = api_key
        
        if self.api_key:
            # Use direct OpenAI API (bypass Manus proxy to preserve fine-tuning)
            self.client = OpenAI(
                api_key=self.api_key,
                base_url="https://api.openai.com/v1"  # Direct OpenAI, not Manus proxy
            )
            self.use_ai = True
            print(f"✅ SMC Detector: OpenAI API loaded")
        else:
            print("⚠️ OPENAI_API_KEY not found. Using rule-based SMC detection.")
            self.use_ai = False
    
    def _load_api_key_from_dashboard(self):
        """Dashboard'dan OpenAI API key'i yükle"""
        try:
            import requests
            resp = requests.get("http://localhost:3000/api/trpc/settings.get", timeout=5)
            if resp.status_code == 200:
                data = resp.json().get('result', {}).get('data', {})
                if 'json' in data:
                    data = data['json']
                self.api_key = data.get('openaiApiKey')
        except Exception as e:
            print(f"⚠️ Could not load API key from Dashboard: {e}")
    
    def detect_all_patterns(self, candles: List[Dict], timeframe: str) -> Dict:
        """
        Detect all SMC patterns
        
        Args:
            candles: List of candle data
            timeframe: Timeframe (e.g., 15m, 1h, 4h)
            
        Returns:
            {
                "order_blocks": List[Dict],
                "fair_value_gaps": List[Dict],
                "liquidity_sweeps": List[Dict],
                "break_of_structure": List[Dict],
                "support_resistance": List[Dict]
            }
        """
        
        if self.use_ai:
            return self._detect_with_ai(candles, timeframe)
        else:
            return self._detect_rule_based(candles, timeframe)
    
    def _detect_with_ai(self, candles: List[Dict], timeframe: str) -> Dict:
        """Use OpenAI GPT-4 for advanced pattern recognition"""
        
        # Prepare candle data for AI
        candle_summary = {
            "timeframe": timeframe,
            "candle_count": len(candles),
            "recent_candles": candles[-50:],  # Last 50 candles
            "current_price": candles[-1]['close'],
            "high": max(c['high'] for c in candles[-50:]),
            "low": min(c['low'] for c in candles[-50:])
        }
        
        prompt = f"""
You are an expert in Smart Money Concepts (SMC) trading. Analyze these candles and identify:

**Candle Data:**
{json.dumps(candle_summary, indent=2)}

**Patterns to Detect:**
1. **Order Blocks (OB)**: Strong rejection candles where institutions entered
2. **Fair Value Gaps (FVG)**: Price gaps that act as magnets
3. **Liquidity Sweeps**: Stop hunts before reversals
4. **Break of Structure (BOS)**: Trend changes
5. **Support/Resistance**: Key price levels

**Response Format (JSON):**
{{
  "order_blocks": [
    {{
      "type": "BULLISH" | "BEARISH",
      "price": float,
      "strength": 0.0-1.0,
      "description": "..."
    }}
  ],
  "fair_value_gaps": [
    {{
      "type": "BULLISH" | "BEARISH",
      "top": float,
      "bottom": float,
      "strength": 0.0-1.0,
      "description": "..."
    }}
  ],
  "liquidity_sweeps": [
    {{
      "type": "BULLISH" | "BEARISH",
      "price": float,
      "description": "..."
    }}
  ],
  "break_of_structure": [
    {{
      "type": "BULLISH" | "BEARISH",
      "price": float,
      "description": "..."
    }}
  ],
  "support_resistance": [
    {{
      "type": "SUPPORT" | "RESISTANCE",
      "price": float,
      "strength": 0.0-1.0,
      "touches": int,
      "description": "..."
    }}
  ]
}}

**Rules:**
- Only include high-probability patterns (strength > 0.6)
- Prioritize recent patterns (last 20 candles)
- Consider timeframe context (higher TF = stronger patterns)
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are an expert Smart Money Concepts trader."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            print(f"❌ OpenAI SMC detection error: {e}")
            return self._detect_rule_based(candles, timeframe)
    
    def _detect_rule_based(self, candles: List[Dict], timeframe: str) -> Dict:
        """Rule-based SMC detection (fallback)"""
        
        order_blocks = self._detect_order_blocks(candles)
        fair_value_gaps = self._detect_fair_value_gaps(candles)
        liquidity_sweeps = self._detect_liquidity_sweeps(candles)
        break_of_structure = self._detect_break_of_structure(candles)
        support_resistance = self._detect_support_resistance(candles)
        
        return {
            "order_blocks": order_blocks,
            "fair_value_gaps": fair_value_gaps,
            "liquidity_sweeps": liquidity_sweeps,
            "break_of_structure": break_of_structure,
            "support_resistance": support_resistance
        }
    
    def _detect_order_blocks(self, candles: List[Dict]) -> List[Dict]:
        """Detect Order Blocks (strong rejection candles)"""
        order_blocks = []
        
        for i in range(2, len(candles) - 1):
            prev_candle = candles[i-1]
            current_candle = candles[i]
            next_candle = candles[i+1]
            
            # Bullish Order Block
            if (current_candle['close'] > current_candle['open'] and  # Green candle
                current_candle['close'] > prev_candle['high'] and  # Breaks previous high
                next_candle['low'] > current_candle['low']):  # Price doesn't come back
                
                body_size = current_candle['close'] - current_candle['open']
                candle_range = current_candle['high'] - current_candle['low']
                strength = body_size / candle_range if candle_range > 0 else 0
                
                if strength > 0.6:  # Strong candle
                    order_blocks.append({
                        "type": "BULLISH",
                        "price": current_candle['low'],
                        "strength": round(strength, 2),
                        "description": f"Bullish OB at {current_candle['low']:.2f}"
                    })
            
            # Bearish Order Block
            elif (current_candle['close'] < current_candle['open'] and  # Red candle
                  current_candle['close'] < prev_candle['low'] and  # Breaks previous low
                  next_candle['high'] < current_candle['high']):  # Price doesn't come back
                
                body_size = current_candle['open'] - current_candle['close']
                candle_range = current_candle['high'] - current_candle['low']
                strength = body_size / candle_range if candle_range > 0 else 0
                
                if strength > 0.6:
                    order_blocks.append({
                        "type": "BEARISH",
                        "price": current_candle['high'],
                        "strength": round(strength, 2),
                        "description": f"Bearish OB at {current_candle['high']:.2f}"
                    })
        
        return order_blocks[-5:]  # Last 5 OBs
    
    def _detect_fair_value_gaps(self, candles: List[Dict]) -> List[Dict]:
        """Detect Fair Value Gaps (price gaps)"""
        fvgs = []
        
        for i in range(1, len(candles) - 1):
            prev_candle = candles[i-1]
            current_candle = candles[i]
            next_candle = candles[i+1]
            
            # Bullish FVG
            if prev_candle['high'] < next_candle['low']:
                gap_size = next_candle['low'] - prev_candle['high']
                avg_range = (prev_candle['high'] - prev_candle['low'] + 
                            next_candle['high'] - next_candle['low']) / 2
                strength = min(gap_size / avg_range, 1.0) if avg_range > 0 else 0
                
                if strength > 0.3:  # Significant gap
                    fvgs.append({
                        "type": "BULLISH",
                        "top": next_candle['low'],
                        "bottom": prev_candle['high'],
                        "strength": round(strength, 2),
                        "description": f"Bullish FVG: {prev_candle['high']:.2f} - {next_candle['low']:.2f}"
                    })
            
            # Bearish FVG
            elif prev_candle['low'] > next_candle['high']:
                gap_size = prev_candle['low'] - next_candle['high']
                avg_range = (prev_candle['high'] - prev_candle['low'] + 
                            next_candle['high'] - next_candle['low']) / 2
                strength = min(gap_size / avg_range, 1.0) if avg_range > 0 else 0
                
                if strength > 0.3:
                    fvgs.append({
                        "type": "BEARISH",
                        "top": prev_candle['low'],
                        "bottom": next_candle['high'],
                        "strength": round(strength, 2),
                        "description": f"Bearish FVG: {next_candle['high']:.2f} - {prev_candle['low']:.2f}"
                    })
        
        return fvgs[-3:]  # Last 3 FVGs
    
    def _detect_liquidity_sweeps(self, candles: List[Dict]) -> List[Dict]:
        """Detect Liquidity Sweeps (stop hunts)"""
        sweeps = []
        
        # Find recent highs and lows
        recent_high = max(c['high'] for c in candles[-20:])
        recent_low = min(c['low'] for c in candles[-20:])
        
        for i in range(len(candles) - 5, len(candles)):
            candle = candles[i]
            
            # Bullish sweep (wick below recent low, then closes higher)
            if (candle['low'] <= recent_low * 0.999 and  # Sweeps low
                candle['close'] > candle['open'] and  # Closes green
                candle['close'] > recent_low):  # Closes above low
                
                sweeps.append({
                    "type": "BULLISH",
                    "price": candle['low'],
                    "description": f"Bullish liquidity sweep at {candle['low']:.2f}"
                })
            
            # Bearish sweep (wick above recent high, then closes lower)
            elif (candle['high'] >= recent_high * 1.001 and  # Sweeps high
                  candle['close'] < candle['open'] and  # Closes red
                  candle['close'] < recent_high):  # Closes below high
                
                sweeps.append({
                    "type": "BEARISH",
                    "price": candle['high'],
                    "description": f"Bearish liquidity sweep at {candle['high']:.2f}"
                })
        
        return sweeps
    
    def _detect_break_of_structure(self, candles: List[Dict]) -> List[Dict]:
        """Detect Break of Structure (trend changes)"""
        bos_list = []
        
        # Simple BOS: price breaks recent swing high/low
        swing_highs = []
        swing_lows = []
        
        for i in range(2, len(candles) - 2):
            # Swing high
            if (candles[i]['high'] > candles[i-1]['high'] and
                candles[i]['high'] > candles[i-2]['high'] and
                candles[i]['high'] > candles[i+1]['high'] and
                candles[i]['high'] > candles[i+2]['high']):
                swing_highs.append(candles[i]['high'])
            
            # Swing low
            if (candles[i]['low'] < candles[i-1]['low'] and
                candles[i]['low'] < candles[i-2]['low'] and
                candles[i]['low'] < candles[i+1]['low'] and
                candles[i]['low'] < candles[i+2]['low']):
                swing_lows.append(candles[i]['low'])
        
        current_price = candles[-1]['close']
        
        # Bullish BOS
        if swing_highs and current_price > max(swing_highs[-3:]):
            bos_list.append({
                "type": "BULLISH",
                "price": max(swing_highs[-3:]),
                "description": f"Bullish BOS at {max(swing_highs[-3:]):.2f}"
            })
        
        # Bearish BOS
        if swing_lows and current_price < min(swing_lows[-3:]):
            bos_list.append({
                "type": "BEARISH",
                "price": min(swing_lows[-3:]),
                "description": f"Bearish BOS at {min(swing_lows[-3:]):.2f}"
            })
        
        return bos_list
    
    def _detect_support_resistance(self, candles: List[Dict]) -> List[Dict]:
        """Detect Support/Resistance levels"""
        levels = []
        
        # Find price levels that were tested multiple times
        price_tests = {}
        tolerance = 0.002  # 0.2% tolerance
        
        for candle in candles[-50:]:
            # Round price to nearest 0.2%
            high_level = round(candle['high'] / (1 + tolerance)) * (1 + tolerance)
            low_level = round(candle['low'] / (1 + tolerance)) * (1 + tolerance)
            
            price_tests[high_level] = price_tests.get(high_level, 0) + 1
            price_tests[low_level] = price_tests.get(low_level, 0) + 1
        
        # Find levels with multiple touches
        for price, touches in price_tests.items():
            if touches >= 3:  # At least 3 touches
                current_price = candles[-1]['close']
                
                level_type = "RESISTANCE" if price > current_price else "SUPPORT"
                strength = min(touches / 10, 1.0)  # Max 10 touches = 1.0 strength
                
                levels.append({
                    "type": level_type,
                    "price": price,
                    "strength": round(strength, 2),
                    "touches": touches,
                    "description": f"{level_type} at {price:.2f} ({touches} touches)"
                })
        
        # Sort by strength
        levels.sort(key=lambda x: x['strength'], reverse=True)
        
        return levels[:5]  # Top 5 levels


# Example usage
if __name__ == "__main__":
    detector = SMCDetector()
    
    # Example candle data
    candles = [
        {"open": 43000, "high": 43500, "low": 42800, "close": 43200},
        {"open": 43200, "high": 43800, "low": 43100, "close": 43600},
        # ... more candles
    ]
    
    patterns = detector.detect_all_patterns(candles, "1h")
    print(json.dumps(patterns, indent=2))
