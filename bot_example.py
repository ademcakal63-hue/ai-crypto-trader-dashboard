#!/usr/bin/env python3
"""
AI Crypto Trader Bot - Dashboard API Entegrasyonu
Bu script, trading botunuzun dashboard'a nasıl bağlanacağını gösterir.
"""

import requests
import time
from datetime import datetime
from typing import Dict, Any

# Dashboard API URL (Kendi dashboard URL'inizi buraya yazın)
DASHBOARD_API_URL = "https://YOUR_DASHBOARD_URL/api/bot"

class TradingBotDashboard:
    """Trading Bot Dashboard API Client"""
    
    def __init__(self, api_url: str = DASHBOARD_API_URL):
        self.api_url = api_url
        self.session = requests.Session()
    
    def open_position(self, symbol: str, direction: str, entry_price: float, 
                     stop_loss: float, take_profit: float, position_size: float) -> Dict[str, Any]:
        """
        Yeni pozisyon aç
        
        Args:
            symbol: Trading pair (örn: "BTCUSDT")
            direction: "LONG" veya "SHORT"
            entry_price: Giriş fiyatı
            stop_loss: Stop loss fiyatı
            take_profit: Take profit fiyatı
            position_size: Pozisyon büyüklüğü (USDT)
        
        Returns:
            API response
        """
        payload = {
            "symbol": symbol,
            "direction": direction,
            "entryPrice": entry_price,
            "stopLoss": stop_loss,
            "takeProfit": take_profit,
            "positionSize": position_size,
        }
        
        response = self.session.post(f"{self.api_url}/position/open", json=payload)
        response.raise_for_status()
        return response.json()
    
    def close_position(self, position_id: int, exit_price: float, 
                      pnl: float, reason: str = "Target reached") -> Dict[str, Any]:
        """
        Pozisyonu kapat
        
        Args:
            position_id: Pozisyon ID
            exit_price: Çıkış fiyatı
            pnl: Kâr/Zarar (USDT)
            reason: Kapanma nedeni
        
        Returns:
            API response
        """
        payload = {
            "positionId": position_id,
            "exitPrice": exit_price,
            "pnl": pnl,
            "reason": reason,
        }
        
        response = self.session.post(f"{self.api_url}/position/close", json=payload)
        response.raise_for_status()
        return response.json()
    
    def update_position(self, position_id: int, stop_loss: float = None, 
                       take_profit: float = None) -> Dict[str, Any]:
        """
        Pozisyon SL/TP güncelle
        
        Args:
            position_id: Pozisyon ID
            stop_loss: Yeni stop loss (opsiyonel)
            take_profit: Yeni take profit (opsiyonel)
        
        Returns:
            API response
        """
        payload = {"positionId": position_id}
        if stop_loss is not None:
            payload["stopLoss"] = stop_loss
        if take_profit is not None:
            payload["takeProfit"] = take_profit
        
        response = self.session.post(f"{self.api_url}/position/update", json=payload)
        response.raise_for_status()
        return response.json()
    
    def complete_trade(self, symbol: str, direction: str, entry_price: float,
                      exit_price: float, pnl: float, r_ratio: float,
                      pattern_used: str = None) -> Dict[str, Any]:
        """
        Tamamlanmış işlemi kaydet
        
        Args:
            symbol: Trading pair
            direction: "LONG" veya "SHORT"
            entry_price: Giriş fiyatı
            exit_price: Çıkış fiyatı
            pnl: Kâr/Zarar (USDT)
            r_ratio: R oranı (örn: 2.5)
            pattern_used: Kullanılan pattern (opsiyonel)
        
        Returns:
            API response
        """
        payload = {
            "symbol": symbol,
            "direction": direction,
            "entryPrice": entry_price,
            "exitPrice": exit_price,
            "pnl": pnl,
            "rRatio": r_ratio,
        }
        if pattern_used:
            payload["patternUsed"] = pattern_used
        
        response = self.session.post(f"{self.api_url}/trade/complete", json=payload)
        response.raise_for_status()
        return response.json()
    
    def update_metrics(self, daily_pnl: float, win_rate: float, 
                      avg_r_ratio: float, total_trades: int) -> Dict[str, Any]:
        """
        Performans metriklerini güncelle
        
        Args:
            daily_pnl: Günlük kâr/zarar (USDT)
            win_rate: Başarı oranı (0-100)
            avg_r_ratio: Ortalama R oranı
            total_trades: Toplam işlem sayısı
        
        Returns:
            API response
        """
        payload = {
            "dailyPnl": daily_pnl,
            "winRate": win_rate,
            "avgRRatio": avg_r_ratio,
            "totalTrades": total_trades,
        }
        
        response = self.session.post(f"{self.api_url}/metrics/update", json=payload)
        response.raise_for_status()
        return response.json()
    
    def emergency_stop(self) -> Dict[str, Any]:
        """
        Acil durdur - Tüm pozisyonları kapat
        
        Returns:
            API response
        """
        response = self.session.post(f"{self.api_url}/emergency-stop")
        response.raise_for_status()
        return response.json()


# KULLANIM ÖRNEĞİ
if __name__ == "__main__":
    # Dashboard client oluştur
    dashboard = TradingBotDashboard()
    
    print("🤖 AI Crypto Trader Bot - Dashboard Test")
    print("=" * 50)
    
    # Örnek 1: Yeni pozisyon aç
    print("\n1️⃣ Yeni pozisyon açılıyor...")
    try:
        result = dashboard.open_position(
            symbol="BTCUSDT",
            direction="LONG",
            entry_price=96500.0,
            stop_loss=96000.0,
            take_profit=97500.0,
            position_size=100.0  # 100 USDT
        )
        print(f"✅ Pozisyon açıldı: {result}")
        position_id = result.get("positionId")
    except Exception as e:
        print(f"❌ Hata: {e}")
        position_id = None
    
    # Örnek 2: Pozisyon güncelle
    if position_id:
        print("\n2️⃣ Pozisyon SL/TP güncelleniyor...")
        time.sleep(2)
        try:
            result = dashboard.update_position(
                position_id=position_id,
                stop_loss=96200.0,  # SL yukarı çek
                take_profit=98000.0  # TP yukarı çek
            )
            print(f"✅ Pozisyon güncellendi: {result}")
        except Exception as e:
            print(f"❌ Hata: {e}")
    
    # Örnek 3: Pozisyon kapat
    if position_id:
        print("\n3️⃣ Pozisyon kapatılıyor...")
        time.sleep(2)
        try:
            result = dashboard.close_position(
                position_id=position_id,
                exit_price=97500.0,
                pnl=10.0,  # 10 USDT kâr
                reason="Take profit reached"
            )
            print(f"✅ Pozisyon kapatıldı: {result}")
        except Exception as e:
            print(f"❌ Hata: {e}")
    
    # Örnek 4: Tamamlanmış işlem kaydet
    print("\n4️⃣ Tamamlanmış işlem kaydediliyor...")
    time.sleep(2)
    try:
        result = dashboard.complete_trade(
            symbol="ETHUSDT",
            direction="LONG",
            entry_price=3500.0,
            exit_price=3550.0,
            pnl=14.28,  # 14.28 USDT kâr
            r_ratio=2.5,  # 2.5R
            pattern_used="Order Block + FVG"
        )
        print(f"✅ İşlem kaydedildi: {result}")
    except Exception as e:
        print(f"❌ Hata: {e}")
    
    # Örnek 5: Metrikleri güncelle
    print("\n5️⃣ Performans metrikleri güncelleniyor...")
    time.sleep(2)
    try:
        result = dashboard.update_metrics(
            daily_pnl=24.28,  # Bugünkü toplam kâr
            win_rate=75.0,  # %75 başarı oranı
            avg_r_ratio=2.3,  # Ortalama 2.3R
            total_trades=4  # 4 işlem
        )
        print(f"✅ Metrikler güncellendi: {result}")
    except Exception as e:
        print(f"❌ Hata: {e}")
    
    print("\n" + "=" * 50)
    print("✅ Test tamamlandı! Dashboard'u kontrol edin.")
    print("🌐 Dashboard: https://3000-ikaiwbprvfhkce8zuz9o8-2c56880c.manus-asia.computer")
