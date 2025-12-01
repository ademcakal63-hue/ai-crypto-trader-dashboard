"""
Binance API Client - Mum verileri çekme ve işlem yönetimi
"""

import os
import time
import hmac
import hashlib
from typing import Dict, List, Optional
from urllib.parse import urlencode
import requests

class BinanceClient:
    """Binance Futures API Client"""
    
    def __init__(self, api_key: str = None, api_secret: str = None, testnet: bool = False):
        """
        Args:
            api_key: Binance API Key (None ise env'den alınır)
            api_secret: Binance API Secret (None ise env'den alınır)
            testnet: Testnet kullan (default: False - Mainnet)
        """
        self.api_key = api_key or os.getenv("BINANCE_API_KEY")
        self.api_secret = api_secret or os.getenv("BINANCE_API_SECRET")
        
        if testnet or os.getenv("BINANCE_USE_TESTNET", "false").lower() == "true":
            self.base_url = "https://testnet.binancefuture.com"
        else:
            self.base_url = "https://fapi.binance.com"
        
        if not self.api_key or not self.api_secret:
            raise ValueError("Binance API Key ve Secret gerekli! Env variable'ları ayarlayın.")
    
    def get_klines(self, symbol: str, interval: str, limit: int = 100) -> List[Dict]:
        """
        Mum verilerini çek
        
        Args:
            symbol: İşlem çifti (örn: "BTCUSDT")
            interval: Zaman dilimi ("1m", "5m", "15m", "1h", "4h", "1d")
            limit: Kaç mum çekilecek (max: 1500)
        
        Returns:
            [
                {
                    "open_time": 1638316800000,
                    "open": 45000.0,
                    "high": 45500.0,
                    "low": 44800.0,
                    "close": 45200.0,
                    "volume": 1000.5,
                    "close_time": 1638320400000
                },
                ...
            ]
        """
        endpoint = "/fapi/v1/klines"
        url = f"{self.base_url}{endpoint}"
        
        params = {
            "symbol": symbol,
            "interval": interval,
            "limit": limit
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            raw_klines = response.json()
            
            # Format klines
            klines = []
            for k in raw_klines:
                klines.append({
                    "open_time": k[0],
                    "open": float(k[1]),
                    "high": float(k[2]),
                    "low": float(k[3]),
                    "close": float(k[4]),
                    "volume": float(k[5]),
                    "close_time": k[6]
                })
            
            return klines
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Binance API hatası (klines): {e}")
            return []
    
    def get_multi_timeframe_klines(self, symbol: str, timeframes: List[str] = None, limit: int = 100) -> Dict[str, List[Dict]]:
        """
        Birden fazla timeframe'den mum verileri çek
        
        Args:
            symbol: İşlem çifti
            timeframes: Zaman dilimleri listesi (None ise default: ["1m", "5m", "15m", "1h", "4h"])
            limit: Her timeframe için kaç mum
        
        Returns:
            {
                "1m": [...],
                "5m": [...],
                "15m": [...],
                "1h": [...],
                "4h": [...]
            }
        """
        if timeframes is None:
            timeframes = ["1m", "5m", "15m", "1h", "4h"]
        
        result = {}
        for tf in timeframes:
            result[tf] = self.get_klines(symbol, tf, limit)
            time.sleep(0.1)  # Rate limit koruması
        
        return result
    
    def get_current_price(self, symbol: str) -> float:
        """
        Anlık fiyat
        
        Args:
            symbol: İşlem çifti
        
        Returns:
            Güncel fiyat (float)
        """
        endpoint = "/fapi/v1/ticker/price"
        url = f"{self.base_url}{endpoint}"
        
        params = {"symbol": symbol}
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            return float(data["price"])
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Binance API hatası (price): {e}")
            return 0.0
    
    def get_account_balance(self) -> Dict:
        """
        Futures hesap bakiyesi
        
        Returns:
            {
                "total": 1500.0,
                "available": 1200.0,
                "used": 300.0
            }
        """
        endpoint = "/fapi/v2/account"
        url = f"{self.base_url}{endpoint}"
        
        timestamp = int(time.time() * 1000)
        params = {"timestamp": timestamp}
        
        # Signature oluştur
        query_string = urlencode(params)
        signature = hmac.new(
            self.api_secret.encode("utf-8"),
            query_string.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        
        params["signature"] = signature
        
        headers = {"X-MBX-APIKEY": self.api_key}
        
        try:
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # USDT bakiyesini bul
            usdt_balance = next((asset for asset in data["assets"] if asset["asset"] == "USDT"), None)
            
            if usdt_balance:
                return {
                    "total": float(usdt_balance["walletBalance"]),
                    "available": float(usdt_balance["availableBalance"]),
                    "used": float(usdt_balance["walletBalance"]) - float(usdt_balance["availableBalance"])
                }
            else:
                return {"total": 0.0, "available": 0.0, "used": 0.0}
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Binance API hatası (balance): {e}")
            return {"total": 0.0, "available": 0.0, "used": 0.0}
    
    def open_position(self, symbol: str, direction: str, quantity: float, leverage: int = 10) -> Dict:
        """
        Pozisyon aç
        
        Args:
            symbol: İşlem çifti
            direction: "LONG" veya "SHORT"
            quantity: Miktar (BTC, ETH vb.)
            leverage: Kaldıraç (default: 10x)
        
        Returns:
            {
                "success": True,
                "order_id": "123456",
                "entry_price": 45000.0
            }
        """
        # Önce kaldıracı ayarla
        self._set_leverage(symbol, leverage)
        
        # Market order aç
        endpoint = "/fapi/v1/order"
        url = f"{self.base_url}{endpoint}"
        
        side = "BUY" if direction == "LONG" else "SELL"
        
        timestamp = int(time.time() * 1000)
        params = {
            "symbol": symbol,
            "side": side,
            "type": "MARKET",
            "quantity": quantity,
            "timestamp": timestamp
        }
        
        # Signature
        query_string = urlencode(params)
        signature = hmac.new(
            self.api_secret.encode("utf-8"),
            query_string.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        
        params["signature"] = signature
        
        headers = {"X-MBX-APIKEY": self.api_key}
        
        try:
            response = requests.post(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                "success": True,
                "order_id": str(data["orderId"]),
                "entry_price": float(data["avgPrice"])
            }
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Pozisyon açma hatası: {e}")
            return {
                "success": False,
                "order_id": None,
                "entry_price": 0.0,
                "error": str(e)
            }
    
    def place_stop_loss_order(self, symbol: str, direction: str, quantity: float, stop_price: float) -> Dict:
        """
        Stop loss order yerleştir (STOP_MARKET)
        
        Args:
            symbol: İşlem çifti
            direction: Pozisyon yönü ("LONG" veya "SHORT")
            quantity: Miktar
            stop_price: Stop loss fiyatı
        
        Returns:
            {
                "success": True,
                "order_id": "123456",
                "stop_price": 49500.0
            }
        """
        endpoint = "/fapi/v1/order"
        url = f"{self.base_url}{endpoint}"
        
        # Ters yönde stop order (LONG için SELL, SHORT için BUY)
        side = "SELL" if direction == "LONG" else "BUY"
        
        timestamp = int(time.time() * 1000)
        params = {
            "symbol": symbol,
            "side": side,
            "type": "STOP_MARKET",  # Stop loss order tipi
            "quantity": quantity,
            "stopPrice": str(stop_price),  # Tetiklenme fiyatı
            "timestamp": timestamp
        }
        
        # Signature
        query_string = urlencode(params)
        signature = hmac.new(
            self.api_secret.encode("utf-8"),
            query_string.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        
        params["signature"] = signature
        
        headers = {"X-MBX-APIKEY": self.api_key}
        
        try:
            response = requests.post(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                "success": True,
                "order_id": str(data["orderId"]),
                "stop_price": float(data["stopPrice"])
            }
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Stop loss order hatası: {e}")
            if hasattr(e.response, 'text'):
                print(f"   Detay: {e.response.text}")
            return {
                "success": False,
                "order_id": None,
                "stop_price": 0.0,
                "error": str(e)
            }
    
    def place_take_profit_order(self, symbol: str, direction: str, quantity: float, take_profit_price: float) -> Dict:
        """
        Take profit order yerleştir (TAKE_PROFIT_MARKET)
        
        Args:
            symbol: İşlem çifti
            direction: Pozisyon yönü ("LONG" veya "SHORT")
            quantity: Miktar
            take_profit_price: Take profit fiyatı
        
        Returns:
            {
                "success": True,
                "order_id": "123456",
                "take_profit_price": 51500.0
            }
        """
        endpoint = "/fapi/v1/order"
        url = f"{self.base_url}{endpoint}"
        
        # Ters yönde TP order (LONG için SELL, SHORT için BUY)
        side = "SELL" if direction == "LONG" else "BUY"
        
        timestamp = int(time.time() * 1000)
        params = {
            "symbol": symbol,
            "side": side,
            "type": "TAKE_PROFIT_MARKET",  # Take profit order tipi
            "quantity": quantity,
            "stopPrice": str(take_profit_price),  # Tetiklenme fiyatı
            "timestamp": timestamp
        }
        
        # Signature
        query_string = urlencode(params)
        signature = hmac.new(
            self.api_secret.encode("utf-8"),
            query_string.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        
        params["signature"] = signature
        
        headers = {"X-MBX-APIKEY": self.api_key}
        
        try:
            response = requests.post(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                "success": True,
                "order_id": str(data["orderId"]),
                "take_profit_price": float(data["stopPrice"])
            }
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Take profit order hatası: {e}")
            if hasattr(e.response, 'text'):
                print(f"   Detay: {e.response.text}")
            return {
                "success": False,
                "order_id": None,
                "take_profit_price": 0.0,
                "error": str(e)
            }
    
    def close_position(self, symbol: str, direction: str, quantity: float) -> Dict:
        """
        Pozisyon kapat
        
        Args:
            symbol: İşlem çifti
            direction: Açık pozisyonun yönü ("LONG" veya "SHORT")
            quantity: Miktar
        
        Returns:
            {
                "success": True,
                "exit_price": 46000.0
            }
        """
        endpoint = "/fapi/v1/order"
        url = f"{self.base_url}{endpoint}"
        
        # Ters yönde order aç (pozisyonu kapat)
        side = "SELL" if direction == "LONG" else "BUY"
        
        timestamp = int(time.time() * 1000)
        params = {
            "symbol": symbol,
            "side": side,
            "type": "MARKET",
            "quantity": quantity,
            "timestamp": timestamp
        }
        
        # Signature
        query_string = urlencode(params)
        signature = hmac.new(
            self.api_secret.encode("utf-8"),
            query_string.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        
        params["signature"] = signature
        
        headers = {"X-MBX-APIKEY": self.api_key}
        
        try:
            response = requests.post(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                "success": True,
                "exit_price": float(data["avgPrice"])
            }
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Pozisyon kapatma hatası: {e}")
            return {
                "success": False,
                "exit_price": 0.0,
                "error": str(e)
            }
    
    def _set_leverage(self, symbol: str, leverage: int):
        """Kaldıraç ayarla (internal)"""
        endpoint = "/fapi/v1/leverage"
        url = f"{self.base_url}{endpoint}"
        
        timestamp = int(time.time() * 1000)
        params = {
            "symbol": symbol,
            "leverage": leverage,
            "timestamp": timestamp
        }
        
        # Signature
        query_string = urlencode(params)
        signature = hmac.new(
            self.api_secret.encode("utf-8"),
            query_string.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        
        params["signature"] = signature
        
        headers = {"X-MBX-APIKEY": self.api_key}
        
        try:
            response = requests.post(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Kaldıraç ayarlama hatası: {e}")


# Test fonksiyonu
if __name__ == "__main__":
    client = BinanceClient(testnet=True)
    
    # Mum verileri çek
    klines = client.get_klines("BTCUSDT", "1h", limit=10)
    print(f"✅ {len(klines)} mum çekildi")
    
    if klines:
        latest = klines[-1]
        print(f"Son fiyat: ${latest['close']:.2f}")
    
    # Multi-timeframe
    multi = client.get_multi_timeframe_klines("BTCUSDT", ["1h", "4h"], limit=5)
    print(f"✅ Multi-timeframe: {list(multi.keys())}")
