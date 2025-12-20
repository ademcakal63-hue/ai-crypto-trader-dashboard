"""
Limit Order Manager - Paper Trading için simüle limit emirler
Fiyat belirlenen seviyeye gelince otomatik pozisyon açar
"""

import json
import time
from typing import Dict, List, Optional
from datetime import datetime
from dashboard_client import DashboardClient

class LimitOrderManager:
    """
    Paper Trading Limit Order Sistemi
    
    Özellikleri:
    1. Limit emir oluşturma (BUY/SELL)
    2. Fiyat kontrolü ve otomatik tetikleme
    3. Emir güncelleme ve iptal
    4. SL/TP ile birlikte emir
    """
    
    def __init__(self):
        self.dashboard = DashboardClient()
        self.pending_orders: List[Dict] = []
        self._load_orders()
    
    def _load_orders(self):
        """Bekleyen emirleri yükle"""
        try:
            settings = self.dashboard.get_settings()
            self.pending_orders = settings.get('pending_orders', [])
        except:
            self.pending_orders = []
    
    def _save_orders(self):
        """Emirleri kaydet"""
        try:
            self.dashboard.update_settings({
                'pending_orders': self.pending_orders
            })
        except Exception as e:
            print(f"⚠️ Failed to save orders: {e}")
    
    def create_limit_order(
        self,
        symbol: str,
        side: str,  # "BUY" veya "SELL"
        entry_price: float,
        position_size: float,
        stop_loss: float,
        take_profit: float,
        leverage: float,
        reason: str,
        entry_zone_type: str,
        confidence: float,
        expiry_minutes: int = 30
    ) -> Dict:
        """
        Yeni limit emir oluştur
        
        Args:
            symbol: İşlem çifti (BTCUSDT)
            side: BUY (long) veya SELL (short)
            entry_price: Giriş fiyatı
            position_size: Pozisyon büyüklüğü (USD)
            stop_loss: Stop loss fiyatı
            take_profit: Take profit fiyatı
            leverage: Kaldıraç
            reason: AI'ın gerekçesi
            entry_zone_type: OB, FVG, SWEEP vs
            confidence: Güven skoru
            expiry_minutes: Emir geçerlilik süresi (dakika)
            
        Returns:
            Oluşturulan emir
        """
        order_id = f"LO_{int(time.time() * 1000)}"
        
        order = {
            "order_id": order_id,
            "symbol": symbol,
            "side": side,
            "type": "LIMIT",
            "status": "PENDING",
            "entry_price": entry_price,
            "current_price": None,
            "position_size": position_size,
            "stop_loss": stop_loss,
            "take_profit": take_profit,
            "leverage": leverage,
            "reason": reason,
            "entry_zone_type": entry_zone_type,
            "confidence": confidence,
            "created_at": datetime.now().isoformat(),
            "expires_at": datetime.fromtimestamp(
                time.time() + expiry_minutes * 60
            ).isoformat(),
            "triggered_at": None,
            "cancelled_at": None
        }
        
        self.pending_orders.append(order)
        self._save_orders()
        
        print(f"📝 Limit Order Created: {order_id}")
        print(f"   {side} {symbol} @ {entry_price:,.2f}")
        print(f"   Size: ${position_size:,.2f} | Leverage: {leverage}x")
        print(f"   SL: {stop_loss:,.2f} | TP: {take_profit:,.2f}")
        print(f"   Zone: {entry_zone_type} | Confidence: {confidence:.2f}")
        print(f"   Expires in {expiry_minutes} minutes")
        
        return order
    
    def check_orders(self, current_price: float) -> List[Dict]:
        """
        Bekleyen emirleri kontrol et ve tetiklenmesi gerekenleri döndür
        
        Args:
            current_price: Güncel fiyat
            
        Returns:
            Tetiklenen emirler listesi
        """
        triggered_orders = []
        now = datetime.now()
        
        for order in self.pending_orders[:]:  # Copy list to modify during iteration
            if order["status"] != "PENDING":
                continue
            
            # Süre dolmuş mu?
            expires_at = datetime.fromisoformat(order["expires_at"])
            if now > expires_at:
                order["status"] = "EXPIRED"
                order["cancelled_at"] = now.isoformat()
                print(f"⏰ Order Expired: {order['order_id']}")
                continue
            
            # Fiyat kontrolü
            order["current_price"] = current_price
            triggered = False
            
            if order["side"] == "BUY":
                # Long için: Fiyat entry_price'a düşmeli veya altına inmeli
                if current_price <= order["entry_price"]:
                    triggered = True
            else:  # SELL
                # Short için: Fiyat entry_price'a çıkmalı veya üstüne çıkmalı
                if current_price >= order["entry_price"]:
                    triggered = True
            
            if triggered:
                order["status"] = "TRIGGERED"
                order["triggered_at"] = now.isoformat()
                order["fill_price"] = current_price  # Gerçek dolum fiyatı
                triggered_orders.append(order)
                print(f"🎯 Order Triggered: {order['order_id']} @ {current_price:,.2f}")
        
        # Tetiklenen ve süresi dolan emirleri listeden çıkar
        self.pending_orders = [
            o for o in self.pending_orders 
            if o["status"] == "PENDING"
        ]
        self._save_orders()
        
        return triggered_orders
    
    def cancel_order(self, order_id: str) -> bool:
        """Emri iptal et"""
        for order in self.pending_orders:
            if order["order_id"] == order_id and order["status"] == "PENDING":
                order["status"] = "CANCELLED"
                order["cancelled_at"] = datetime.now().isoformat()
                self._save_orders()
                print(f"❌ Order Cancelled: {order_id}")
                return True
        return False
    
    def cancel_all_orders(self, symbol: str = None) -> int:
        """Tüm emirleri iptal et"""
        cancelled = 0
        for order in self.pending_orders:
            if order["status"] == "PENDING":
                if symbol is None or order["symbol"] == symbol:
                    order["status"] = "CANCELLED"
                    order["cancelled_at"] = datetime.now().isoformat()
                    cancelled += 1
        
        self._save_orders()
        print(f"❌ Cancelled {cancelled} orders")
        return cancelled
    
    def update_order(self, order_id: str, updates: Dict) -> bool:
        """
        Emri güncelle
        
        Args:
            order_id: Emir ID
            updates: Güncellenecek alanlar
            
        Returns:
            Başarılı mı
        """
        for order in self.pending_orders:
            if order["order_id"] == order_id and order["status"] == "PENDING":
                for key, value in updates.items():
                    if key in order and key not in ["order_id", "created_at", "status"]:
                        order[key] = value
                self._save_orders()
                print(f"📝 Order Updated: {order_id}")
                return True
        return False
    
    def get_pending_orders(self, symbol: str = None) -> List[Dict]:
        """Bekleyen emirleri getir"""
        if symbol:
            return [o for o in self.pending_orders if o["symbol"] == symbol and o["status"] == "PENDING"]
        return [o for o in self.pending_orders if o["status"] == "PENDING"]
    
    def get_order(self, order_id: str) -> Optional[Dict]:
        """Belirli bir emri getir"""
        for order in self.pending_orders:
            if order["order_id"] == order_id:
                return order
        return None
    
    def has_pending_order(self, symbol: str, side: str = None) -> bool:
        """Bekleyen emir var mı?"""
        for order in self.pending_orders:
            if order["symbol"] == symbol and order["status"] == "PENDING":
                if side is None or order["side"] == side:
                    return True
        return False
    
    def get_summary(self) -> Dict:
        """Emir özeti"""
        pending = [o for o in self.pending_orders if o["status"] == "PENDING"]
        
        return {
            "total_pending": len(pending),
            "buy_orders": len([o for o in pending if o["side"] == "BUY"]),
            "sell_orders": len([o for o in pending if o["side"] == "SELL"]),
            "orders": pending
        }


# Test
if __name__ == "__main__":
    manager = LimitOrderManager()
    
    # Test emir oluştur
    order = manager.create_limit_order(
        symbol="BTCUSDT",
        side="BUY",
        entry_price=87000,
        position_size=10000,
        stop_loss=86500,
        take_profit=88500,
        leverage=5,
        reason="OB test",
        entry_zone_type="ORDER_BLOCK",
        confidence=0.8,
        expiry_minutes=30
    )
    
    print(f"\nPending orders: {manager.get_summary()}")
    
    # Fiyat kontrolü
    triggered = manager.check_orders(current_price=86900)
    print(f"Triggered: {triggered}")
