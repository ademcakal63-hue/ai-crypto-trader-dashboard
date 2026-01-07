"""
Order Book WebSocket - Gerçek zamanlı büyük emir takibi
Binance Futures WebSocket ile order book değişikliklerini izler
"""

import json
import asyncio
import websockets
from typing import Dict, List, Callable, Optional
from datetime import datetime
from collections import deque
import threading

class OrderBookWebSocket:
    """
    Binance Futures Order Book WebSocket
    
    Özellikleri:
    1. Gerçek zamanlı order book güncellemeleri
    2. Büyük emir tespiti (whale orders)
    3. Alıcı/satıcı duvarları (buy/sell walls)
    4. Absorption tespiti (emirlerin yutulması)
    5. Iceberg order tespiti
    """
    
    # Büyük emir eşikleri (USD)
    WHALE_ORDER_THRESHOLD = 200000  # $200K+ = whale (increased to reduce spam)
    WALL_THRESHOLD = 500000  # $500K+ = duvar
    
    def __init__(self, symbol: str = "BTCUSDT"):
        self.symbol = symbol.lower()
        self.ws_url = f"wss://fstream.binance.com/ws/{self.symbol}@depth20@100ms"
        self.trade_url = f"wss://fstream.binance.com/ws/{self.symbol}@aggTrade"
        
        self.orderbook = {"bids": {}, "asks": {}}
        self.recent_trades = deque(maxlen=1000)
        self.whale_orders = []
        self.walls = {"buy": [], "sell": []}
        self.absorptions = []
        self._logged_absorptions = set()  # Spam önleme için
        self._logged_whales = set()  # Spam önleme için
        
        self.running = False
        self.callbacks = []
        self._lock = threading.Lock()
        
        # WebSocket connection status
        self.connection_status = {
            "depth": "DISCONNECTED",  # CONNECTED, DISCONNECTED, RECONNECTING
            "trade": "DISCONNECTED",
            "last_depth_update": None,
            "last_trade_update": None,
            "reconnect_count": 0
        }
        
        # Son analiz sonuçları
        self.last_analysis = {
            "timestamp": None,
            "buy_pressure": 0,
            "sell_pressure": 0,
            "whale_bias": "NEUTRAL",
            "walls": {"buy": [], "sell": []},
            "absorptions": [],
            "recommendation": None
        }
    
    def add_callback(self, callback: Callable):
        """Yeni veri geldiğinde çağrılacak callback ekle"""
        self.callbacks.append(callback)
    
    async def _process_depth(self, data: Dict):
        """Order book derinlik verilerini işle"""
        with self._lock:
            # Bids (alış emirleri)
            for bid in data.get("b", []):
                price, qty = float(bid[0]), float(bid[1])
                if qty > 0:
                    self.orderbook["bids"][price] = qty
                elif price in self.orderbook["bids"]:
                    del self.orderbook["bids"][price]
            
            # Asks (satış emirleri)
            for ask in data.get("a", []):
                price, qty = float(ask[0]), float(ask[1])
                if qty > 0:
                    self.orderbook["asks"][price] = qty
                elif price in self.orderbook["asks"]:
                    del self.orderbook["asks"][price]
        
        # Analiz yap
        self._analyze_orderbook()
    
    async def _process_trade(self, data: Dict):
        """Gerçekleşen işlemleri işle"""
        trade = {
            "price": float(data["p"]),
            "qty": float(data["q"]),
            "value_usd": float(data["p"]) * float(data["q"]),
            "is_buyer_maker": data["m"],  # True = satış, False = alış
            "timestamp": datetime.now()
        }
        
        self.recent_trades.append(trade)
        
        # Whale trade kontrolü
        if trade["value_usd"] >= self.WHALE_ORDER_THRESHOLD:
            self._detect_whale_trade(trade)
        
        # Absorption kontrolü
        self._detect_absorption(trade)
    
    def _analyze_orderbook(self):
        """Order book analizi yap"""
        with self._lock:
            if not self.orderbook["bids"] or not self.orderbook["asks"]:
                return
            
            # En iyi fiyatları al
            best_bid = max(self.orderbook["bids"].keys())
            best_ask = min(self.orderbook["asks"].keys())
            mid_price = (best_bid + best_ask) / 2
            
            # %1 aralıkta toplam hacim
            bid_volume = 0
            ask_volume = 0
            
            for price, qty in self.orderbook["bids"].items():
                if price >= mid_price * 0.99:
                    bid_volume += qty * price
            
            for price, qty in self.orderbook["asks"].items():
                if price <= mid_price * 1.01:
                    ask_volume += qty * price
            
            # Alıcı/satıcı duvarlarını tespit et
            buy_walls = []
            sell_walls = []
            
            for price, qty in self.orderbook["bids"].items():
                value = qty * price
                if value >= self.WALL_THRESHOLD:
                    buy_walls.append({
                        "price": price,
                        "qty": qty,
                        "value_usd": value,
                        "distance_percent": ((mid_price - price) / mid_price) * 100
                    })
            
            for price, qty in self.orderbook["asks"].items():
                value = qty * price
                if value >= self.WALL_THRESHOLD:
                    sell_walls.append({
                        "price": price,
                        "qty": qty,
                        "value_usd": value,
                        "distance_percent": ((price - mid_price) / mid_price) * 100
                    })
            
            # Sırala (en yakın önce)
            buy_walls.sort(key=lambda x: x["distance_percent"])
            sell_walls.sort(key=lambda x: x["distance_percent"])
            
            # Whale bias hesapla
            total_volume = bid_volume + ask_volume
            if total_volume > 0:
                buy_pressure = bid_volume / total_volume
                sell_pressure = ask_volume / total_volume
            else:
                buy_pressure = 0.5
                sell_pressure = 0.5
            
            if buy_pressure > 0.6:
                whale_bias = "BULLISH"
            elif sell_pressure > 0.6:
                whale_bias = "BEARISH"
            else:
                whale_bias = "NEUTRAL"
            
            # Sonuçları güncelle
            self.last_analysis = {
                "timestamp": datetime.now(),
                "mid_price": mid_price,
                "best_bid": best_bid,
                "best_ask": best_ask,
                "spread": best_ask - best_bid,
                "spread_percent": ((best_ask - best_bid) / mid_price) * 100,
                "buy_volume_usd": bid_volume,
                "sell_volume_usd": ask_volume,
                "buy_pressure": buy_pressure,
                "sell_pressure": sell_pressure,
                "whale_bias": whale_bias,
                "walls": {
                    "buy": buy_walls[:5],  # En yakın 5 duvar
                    "sell": sell_walls[:5]
                },
                "recommendation": self._get_recommendation(whale_bias, buy_walls, sell_walls)
            }
            
            # Callback'leri çağır
            for callback in self.callbacks:
                try:
                    callback(self.last_analysis)
                except Exception as e:
                    print(f"Callback error: {e}")
    
    def _detect_whale_trade(self, trade: Dict):
        """Whale trade tespit et"""
        direction = "SELL" if trade["is_buyer_maker"] else "BUY"
        
        # Spam önleme - aynı fiyat ve yönde 30 saniye içinde tekrar loglama
        whale_key = f"{direction}_{round(trade['price'], 0)}"
        current_time = datetime.now().timestamp()
        
        whale_info = {
            "timestamp": trade["timestamp"],
            "direction": direction,
            "price": trade["price"],
            "value_usd": trade["value_usd"],
            "qty": trade["qty"]
        }
        
        self.whale_orders.append(whale_info)
        
        # Son 100 whale order'ı tut
        if len(self.whale_orders) > 100:
            self.whale_orders = self.whale_orders[-100:]
        
        # Spam kontrolü - aynı whale 30 saniye içinde tekrar loglanmasın
        if whale_key in self._logged_whales:
            return
        
        self._logged_whales.add(whale_key)
        print(f"🐋 WHALE {direction}: ${trade['value_usd']:,.0f} @ {trade['price']:,.2f}")
        
        # 30 saniye sonra key'i temizle
        def clear_whale_key():
            import time
            time.sleep(30)
            self._logged_whales.discard(whale_key)
        
        import threading
        threading.Thread(target=clear_whale_key, daemon=True).start()
    
    def _detect_absorption(self, trade: Dict):
        """Absorption tespit et - büyük emirlerin yutulması"""
        # Son 10 saniyedeki işlemleri kontrol et
        recent = [t for t in self.recent_trades 
                  if (datetime.now() - t["timestamp"]).seconds < 10]
        
        if len(recent) < 10:
            return
        
        # Aynı fiyat seviyesinde çok sayıda işlem = absorption
        price_counts = {}
        for t in recent:
            price_key = round(t["price"], 0)
            if price_key not in price_counts:
                price_counts[price_key] = {"count": 0, "volume": 0, "buys": 0, "sells": 0}
            price_counts[price_key]["count"] += 1
            price_counts[price_key]["volume"] += t["value_usd"]
            if t["is_buyer_maker"]:
                price_counts[price_key]["sells"] += t["value_usd"]
            else:
                price_counts[price_key]["buys"] += t["value_usd"]
        
        # Absorption tespiti
        for price, data in price_counts.items():
            if data["count"] >= 20 and data["volume"] >= 500000:
                # Büyük hacim aynı fiyatta = absorption
                if data["buys"] > data["sells"] * 1.5:
                    absorption_type = "BUY_ABSORPTION"
                elif data["sells"] > data["buys"] * 1.5:
                    absorption_type = "SELL_ABSORPTION"
                else:
                    continue
                
                # Spam önleme - aynı absorption 60 saniye içinde tekrar loglanmasın
                absorption_key = f"{absorption_type}_{price}"
                
                if absorption_key in self._logged_absorptions:
                    continue
                
                absorption = {
                    "timestamp": datetime.now(),
                    "price": price,
                    "type": absorption_type,
                    "volume_usd": data["volume"],
                    "trade_count": data["count"]
                }
                
                self.absorptions.append(absorption)
                self._logged_absorptions.add(absorption_key)
                print(f"🔥 {absorption_type} @ {price:,.0f} - ${data['volume']:,.0f}")
                
                # 60 saniye sonra key'i temizle
                def clear_absorption_key(key):
                    import time
                    time.sleep(60)
                    self._logged_absorptions.discard(key)
                
                import threading
                threading.Thread(target=clear_absorption_key, args=(absorption_key,), daemon=True).start()
        
        # Son 50 absorption'ı tut
        if len(self.absorptions) > 50:
            self.absorptions = self.absorptions[-50:]
    
    def _get_recommendation(self, whale_bias: str, buy_walls: List, sell_walls: List) -> Dict:
        """Order book'a göre öneri oluştur"""
        recommendation = {
            "action": "WAIT",
            "confidence": 0,
            "reason": "",
            "entry_zones": []
        }
        
        # Yakın buy wall varsa = destek
        if buy_walls and buy_walls[0]["distance_percent"] < 0.5:
            wall = buy_walls[0]
            recommendation["entry_zones"].append({
                "type": "BUY_WALL_SUPPORT",
                "price": wall["price"],
                "strength_usd": wall["value_usd"],
                "direction": "LONG"
            })
        
        # Yakın sell wall varsa = direnç
        if sell_walls and sell_walls[0]["distance_percent"] < 0.5:
            wall = sell_walls[0]
            recommendation["entry_zones"].append({
                "type": "SELL_WALL_RESISTANCE",
                "price": wall["price"],
                "strength_usd": wall["value_usd"],
                "direction": "SHORT"
            })
        
        # Whale bias'a göre öneri
        if whale_bias == "BULLISH" and buy_walls:
            recommendation["action"] = "LOOK_FOR_LONG"
            recommendation["confidence"] = 0.7
            recommendation["reason"] = f"Güçlü alıcı baskısı, ${buy_walls[0]['value_usd']:,.0f} buy wall"
        elif whale_bias == "BEARISH" and sell_walls:
            recommendation["action"] = "LOOK_FOR_SHORT"
            recommendation["confidence"] = 0.7
            recommendation["reason"] = f"Güçlü satıcı baskısı, ${sell_walls[0]['value_usd']:,.0f} sell wall"
        else:
            recommendation["action"] = "WAIT"
            recommendation["confidence"] = 0.3
            recommendation["reason"] = "Net yön yok, bekle"
        
        return recommendation
    
    def get_analysis(self) -> Dict:
        """Son analiz sonuçlarını döndür"""
        return self.last_analysis
    
    def get_entry_confirmation(self, direction: str, price: float) -> Dict:
        """
        Belirli bir fiyat ve yön için order book teyidi
        
        Args:
            direction: "LONG" veya "SHORT"
            price: Giriş fiyatı
            
        Returns:
            {
                "confirmed": bool,
                "confidence": float,
                "reason": str,
                "supporting_walls": list
            }
        """
        analysis = self.last_analysis
        
        if not analysis.get("timestamp"):
            return {
                "confirmed": False,
                "confidence": 0,
                "reason": "Order book verisi yok"
            }
        
        result = {
            "confirmed": False,
            "confidence": 0,
            "reason": "",
            "supporting_walls": []
        }
        
        if direction == "LONG":
            # Long için: Alıcı baskısı ve yakın buy wall olmalı
            if analysis["buy_pressure"] > 0.55:
                result["confidence"] += 0.3
            
            # Yakın buy wall var mı?
            for wall in analysis["walls"]["buy"]:
                if wall["price"] <= price and wall["distance_percent"] < 1:
                    result["supporting_walls"].append(wall)
                    result["confidence"] += 0.2
            
            # Whale bias
            if analysis["whale_bias"] == "BULLISH":
                result["confidence"] += 0.2
            
            if result["confidence"] >= 0.5:
                result["confirmed"] = True
                result["reason"] = f"Order book LONG destekliyor (buy pressure: {analysis['buy_pressure']:.1%})"
            else:
                result["reason"] = f"Order book LONG için zayıf (buy pressure: {analysis['buy_pressure']:.1%})"
        
        elif direction == "SHORT":
            # Short için: Satıcı baskısı ve yakın sell wall olmalı
            if analysis["sell_pressure"] > 0.55:
                result["confidence"] += 0.3
            
            # Yakın sell wall var mı?
            for wall in analysis["walls"]["sell"]:
                if wall["price"] >= price and wall["distance_percent"] < 1:
                    result["supporting_walls"].append(wall)
                    result["confidence"] += 0.2
            
            # Whale bias
            if analysis["whale_bias"] == "BEARISH":
                result["confidence"] += 0.2
            
            if result["confidence"] >= 0.5:
                result["confirmed"] = True
                result["reason"] = f"Order book SHORT destekliyor (sell pressure: {analysis['sell_pressure']:.1%})"
            else:
                result["reason"] = f"Order book SHORT için zayıf (sell pressure: {analysis['sell_pressure']:.1%})"
        
        return result
    
    async def _run_depth_ws(self):
        """Order book WebSocket döngüsü"""
        while self.running:
            try:
                self.connection_status["depth"] = "RECONNECTING"
                async with websockets.connect(self.ws_url) as ws:
                    self.connection_status["depth"] = "CONNECTED"
                    print(f"📡 Order Book WebSocket connected: {self.symbol.upper()}")
                    while self.running:
                        try:
                            msg = await asyncio.wait_for(ws.recv(), timeout=30)
                            data = json.loads(msg)
                            self.connection_status["last_depth_update"] = datetime.now().isoformat()
                            await self._process_depth(data)
                        except asyncio.TimeoutError:
                            # Ping to keep alive
                            await ws.ping()
            except Exception as e:
                self.connection_status["depth"] = "DISCONNECTED"
                self.connection_status["reconnect_count"] += 1
                print(f"❌ Order Book WS error: {e}")
                if self.running:
                    await asyncio.sleep(5)
    
    async def _run_trade_ws(self):
        """Trade WebSocket döngüsü"""
        while self.running:
            try:
                self.connection_status["trade"] = "RECONNECTING"
                async with websockets.connect(self.trade_url) as ws:
                    self.connection_status["trade"] = "CONNECTED"
                    print(f"📡 Trade WebSocket connected: {self.symbol.upper()}")
                    while self.running:
                        try:
                            msg = await asyncio.wait_for(ws.recv(), timeout=30)
                            data = json.loads(msg)
                            self.connection_status["last_trade_update"] = datetime.now().isoformat()
                            await self._process_trade(data)
                        except asyncio.TimeoutError:
                            await ws.ping()
            except Exception as e:
                self.connection_status["trade"] = "DISCONNECTED"
                self.connection_status["reconnect_count"] += 1
                print(f"❌ Trade WS error: {e}")
                if self.running:
                    await asyncio.sleep(5)
    
    def get_connection_status(self) -> dict:
        """Get current WebSocket connection status"""
        return {
            "depth_ws": self.connection_status["depth"],
            "trade_ws": self.connection_status["trade"],
            "last_depth_update": self.connection_status["last_depth_update"],
            "last_trade_update": self.connection_status["last_trade_update"],
            "reconnect_count": self.connection_status["reconnect_count"],
            "is_healthy": (
                self.connection_status["depth"] == "CONNECTED" and 
                self.connection_status["trade"] == "CONNECTED"
            )
        }
    
    def start(self):
        """WebSocket'leri başlat (ayrı thread'de)"""
        self.running = True
        
        def run_async():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(asyncio.gather(
                self._run_depth_ws(),
                self._run_trade_ws()
            ))
        
        self._thread = threading.Thread(target=run_async, daemon=True)
        self._thread.start()
        print(f"🚀 Order Book WebSocket started for {self.symbol.upper()}")
    
    def stop(self):
        """WebSocket'leri durdur ve bağlantıları kapat"""
        print(f"🛑 Stopping Order Book WebSocket for {self.symbol.upper()}...")
        self.running = False
        
        # Thread'in bitmesini bekle (maksimum 5 saniye)
        if hasattr(self, '_thread') and self._thread.is_alive():
            self._thread.join(timeout=5)
            if self._thread.is_alive():
                print(f"⚠️ WebSocket thread still alive after 5s timeout")
            else:
                print(f"✅ WebSocket thread stopped cleanly")
        
        print(f"✅ Order Book WebSocket stopped for {self.symbol.upper()}")


# Test
if __name__ == "__main__":
    import time
    
    ws = OrderBookWebSocket("BTCUSDT")
    
    def on_update(analysis):
        print(f"\n📊 Update: {analysis['whale_bias']} | Buy: {analysis['buy_pressure']:.1%} | Sell: {analysis['sell_pressure']:.1%}")
        if analysis['walls']['buy']:
            print(f"   Buy walls: {len(analysis['walls']['buy'])}")
        if analysis['walls']['sell']:
            print(f"   Sell walls: {len(analysis['walls']['sell'])}")
    
    ws.add_callback(on_update)
    ws.start()
    
    try:
        while True:
            time.sleep(10)
            analysis = ws.get_analysis()
            if analysis.get("recommendation"):
                print(f"\n💡 Recommendation: {analysis['recommendation']['action']}")
    except KeyboardInterrupt:
        ws.stop()
