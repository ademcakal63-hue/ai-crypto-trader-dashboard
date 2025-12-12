"""
Order Book Analysis Module
Real-time order book data via Binance WebSocket
Detects imbalances, large orders, and liquidity zones
"""

import json
import asyncio
from typing import Dict, List, Optional
from binance.client import Client
from binance import AsyncClient, BinanceSocketManager
import statistics

class OrderBookAnalyzer:
    def __init__(self, api_key: str, api_secret: str, testnet: bool = False):
        self.api_key = api_key
        self.api_secret = api_secret
        self.testnet = testnet
        
        # Order book data storage
        self.orderbook_data = {}
        self.large_order_threshold = 100000  # $100k USD
        
    async def start_orderbook_stream(self, symbol: str, depth: int = 20):
        """
        Start real-time order book WebSocket stream
        
        Args:
            symbol: Trading pair (e.g., BTCUSDT)
            depth: Order book depth (5, 10, 20)
        """
        client = await AsyncClient.create(
            api_key=self.api_key,
            api_secret=self.api_secret,
            testnet=self.testnet
        )
        
        bm = BinanceSocketManager(client)
        
        # Depth socket
        depth_socket = bm.depth_socket(symbol, depth=depth)
        
        async with depth_socket as stream:
            while True:
                msg = await stream.recv()
                self.process_orderbook_update(symbol, msg)
                
    def process_orderbook_update(self, symbol: str, data: Dict):
        """Process order book update"""
        bids = data.get('bids', [])
        asks = data.get('asks', [])
        
        # Store order book
        self.orderbook_data[symbol] = {
            'bids': bids,
            'asks': asks,
            'timestamp': data.get('E', 0)
        }
        
    def analyze_orderbook(self, symbol: str, current_price: float) -> Dict:
        """
        Analyze order book for trading signals
        
        Returns:
            {
                "imbalance": float (-1 to 1),
                "imbalance_percent": float,
                "bid_volume_usd": float,
                "ask_volume_usd": float,
                "large_orders": List[Dict],
                "liquidity_zones": List[Dict],
                "spread_percent": float,
                "signal": "BUY" | "SELL" | "NEUTRAL"
            }
        """
        
        if symbol not in self.orderbook_data:
            return self._empty_analysis()
        
        ob = self.orderbook_data[symbol]
        bids = ob['bids']
        asks = ob['asks']
        
        # Calculate volumes
        bid_volume = sum(float(bid[1]) for bid in bids)
        ask_volume = sum(float(ask[1]) for ask in asks)
        
        bid_volume_usd = bid_volume * current_price
        ask_volume_usd = ask_volume * current_price
        
        # Calculate imbalance (-1 to 1)
        total_volume = bid_volume + ask_volume
        if total_volume == 0:
            imbalance = 0
        else:
            imbalance = (bid_volume - ask_volume) / total_volume
        
        imbalance_percent = imbalance * 100
        
        # Detect large orders (whale watching)
        large_orders = self._detect_large_orders(bids, asks, current_price)
        
        # Identify liquidity zones
        liquidity_zones = self._identify_liquidity_zones(bids, asks, current_price)
        
        # Calculate spread
        best_bid = float(bids[0][0]) if bids else 0
        best_ask = float(asks[0][0]) if asks else 0
        spread_percent = ((best_ask - best_bid) / best_bid * 100) if best_bid > 0 else 0
        
        # Generate signal
        signal = self._generate_signal(imbalance, large_orders, spread_percent)
        
        return {
            "imbalance": round(imbalance, 3),
            "imbalance_percent": round(imbalance_percent, 2),
            "bid_volume_usd": round(bid_volume_usd, 2),
            "ask_volume_usd": round(ask_volume_usd, 2),
            "large_orders": large_orders,
            "liquidity_zones": liquidity_zones,
            "spread_percent": round(spread_percent, 4),
            "signal": signal
        }
    
    def _detect_large_orders(self, bids: List, asks: List, current_price: float) -> List[Dict]:
        """Detect large orders (whale watching)"""
        large_orders = []
        
        # Check bids
        for bid in bids:
            price = float(bid[0])
            quantity = float(bid[1])
            value_usd = price * quantity
            
            if value_usd >= self.large_order_threshold:
                large_orders.append({
                    "side": "BID",
                    "price": price,
                    "quantity": quantity,
                    "value_usd": round(value_usd, 2),
                    "distance_percent": round((current_price - price) / current_price * 100, 2)
                })
        
        # Check asks
        for ask in asks:
            price = float(ask[0])
            quantity = float(ask[1])
            value_usd = price * quantity
            
            if value_usd >= self.large_order_threshold:
                large_orders.append({
                    "side": "ASK",
                    "price": price,
                    "quantity": quantity,
                    "value_usd": round(value_usd, 2),
                    "distance_percent": round((price - current_price) / current_price * 100, 2)
                })
        
        # Sort by value
        large_orders.sort(key=lambda x: x['value_usd'], reverse=True)
        
        return large_orders[:10]  # Top 10 large orders
    
    def _identify_liquidity_zones(self, bids: List, asks: List, current_price: float) -> List[Dict]:
        """Identify liquidity concentration zones"""
        zones = []
        
        # Group orders by price levels (1% buckets)
        bid_buckets = {}
        ask_buckets = {}
        
        for bid in bids:
            price = float(bid[0])
            quantity = float(bid[1])
            bucket = int(price / current_price * 100)  # 1% buckets
            bid_buckets[bucket] = bid_buckets.get(bucket, 0) + quantity
        
        for ask in asks:
            price = float(ask[0])
            quantity = float(ask[1])
            bucket = int(price / current_price * 100)
            ask_buckets[bucket] = ask_buckets.get(bucket, 0) + quantity
        
        # Find high liquidity zones (top 3)
        all_buckets = []
        
        for bucket, volume in bid_buckets.items():
            all_buckets.append({
                "side": "BID",
                "price_level": bucket / 100 * current_price,
                "volume": volume,
                "distance_percent": (current_price - (bucket / 100 * current_price)) / current_price * 100
            })
        
        for bucket, volume in ask_buckets.items():
            all_buckets.append({
                "side": "ASK",
                "price_level": bucket / 100 * current_price,
                "volume": volume,
                "distance_percent": ((bucket / 100 * current_price) - current_price) / current_price * 100
            })
        
        # Sort by volume
        all_buckets.sort(key=lambda x: x['volume'], reverse=True)
        
        return all_buckets[:5]  # Top 5 liquidity zones
    
    def _generate_signal(self, imbalance: float, large_orders: List[Dict], spread_percent: float) -> str:
        """Generate trading signal from order book data"""
        
        # Strong buy signal
        if imbalance > 0.3 and spread_percent < 0.05:
            # Check if large buy orders exist
            large_buys = [o for o in large_orders if o['side'] == 'BID']
            if len(large_buys) >= 2:
                return "STRONG_BUY"
            return "BUY"
        
        # Strong sell signal
        elif imbalance < -0.3 and spread_percent < 0.05:
            # Check if large sell orders exist
            large_sells = [o for o in large_orders if o['side'] == 'ASK']
            if len(large_sells) >= 2:
                return "STRONG_SELL"
            return "SELL"
        
        # Neutral
        else:
            return "NEUTRAL"
    
    def _empty_analysis(self) -> Dict:
        """Return empty analysis when no data available"""
        return {
            "imbalance": 0.0,
            "imbalance_percent": 0.0,
            "bid_volume_usd": 0.0,
            "ask_volume_usd": 0.0,
            "large_orders": [],
            "liquidity_zones": [],
            "spread_percent": 0.0,
            "signal": "NEUTRAL"
        }
    
    def get_orderbook_snapshot(self, symbol: str, limit: int = 20) -> Dict:
        """Get current order book snapshot (sync)"""
        client = Client(self.api_key, self.api_secret, testnet=self.testnet)
        
        try:
            depth = client.get_order_book(symbol=symbol, limit=limit)
            
            # Store snapshot
            self.orderbook_data[symbol] = {
                'bids': depth['bids'],
                'asks': depth['asks'],
                'timestamp': depth['lastUpdateId']
            }
            
            return depth
            
        except Exception as e:
            print(f"❌ Error fetching order book: {e}")
            return {"bids": [], "asks": []}


# Example usage
if __name__ == "__main__":
    import os
    
    api_key = os.getenv("BINANCE_API_KEY")
    api_secret = os.getenv("BINANCE_API_SECRET")
    
    analyzer = OrderBookAnalyzer(api_key, api_secret, testnet=False)
    
    # Get snapshot
    analyzer.get_orderbook_snapshot("BTCUSDT", limit=20)
    
    # Analyze
    current_price = 43500
    analysis = analyzer.analyze_orderbook("BTCUSDT", current_price)
    
    print(json.dumps(analysis, indent=2))
