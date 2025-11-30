"""
Dashboard API Client - AI Bot'tan Dashboard'a veri gönderme
"""

import os
import requests
from typing import Dict, Any

class DashboardClient:
    """Dashboard API ile iletişim"""
    
    def __init__(self, dashboard_url: str = None):
        self.dashboard_url = dashboard_url or os.getenv(
            "DASHBOARD_URL",
            "https://3000-ikaiwbprvfhkce8zuz9o8-2c56880c.manus-asia.computer"
        )
        self.api_base = f"{self.dashboard_url}/api/trpc"
    
    def get_settings(self) -> Dict:
        """Dashboard'dan bot ayarlarını çek"""
        try:
            response = requests.get(f"{self.api_base}/settings.get", timeout=10)
            response.raise_for_status()
            return response.json()["result"]["data"]
        except Exception as e:
            print(f"⚠️ Settings çekme hatası: {e}")
            return {}
    
    def is_bot_active(self) -> bool:
        """Bot aktif mi?"""
        settings = self.get_settings()
        return settings.get("isActive", False)
    
    def check_daily_loss_limit(self) -> Dict:
        """Günlük kayıp limiti kontrolü"""
        try:
            response = requests.get(f"{self.api_base}/dailyLoss.check", timeout=10)
            response.raise_for_status()
            return response.json()["result"]["data"]
        except Exception as e:
            print(f"⚠️ Daily loss kontrolü hatası: {e}")
            return {"exceeded": False, "currentLoss": 0, "limit": 1000, "remaining": 1000, "percentage": 0}
    
    def open_position_notification(self, position: Dict):
        """Pozisyon açıldı bildirimi"""
        try:
            requests.post(
                f"{self.api_base}/bot.position.open",
                json=position,
                timeout=10
            )
        except Exception as e:
            print(f"⚠️ Pozisyon açma bildirimi hatası: {e}")
    
    def close_position_notification(self, position: Dict):
        """Pozisyon kapandı bildirimi"""
        try:
            requests.post(
                f"{self.api_base}/bot.position.close",
                json=position,
                timeout=10
            )
        except Exception as e:
            print(f"⚠️ Pozisyon kapatma bildirimi hatası: {e}")
    
    def send_daily_report(self, report: Dict):
        """Günlük rapor gönder"""
        try:
            requests.post(
                f"{self.api_base}/bot.dailyReport",
                json=report,
                timeout=10
            )
        except Exception as e:
            print(f"⚠️ Rapor gönderme hatası: {e}")
