"""
Dashboard API Client - AI Bot'tan Dashboard'a veri gönderme
With retry mechanism and better error handling
"""

import os
import time
import requests
from typing import Dict, Any, Optional
from functools import wraps


def retry_on_failure(max_retries: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """Decorator for retrying failed API calls with exponential backoff"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            current_delay = delay
            
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except requests.exceptions.Timeout:
                    last_exception = TimeoutError(f"Request timed out after {attempt + 1} attempts")
                    print(f"   ⏱️ Timeout (attempt {attempt + 1}/{max_retries})")
                except requests.exceptions.ConnectionError as e:
                    last_exception = e
                    print(f"   🔌 Connection error (attempt {attempt + 1}/{max_retries})")
                except requests.exceptions.HTTPError as e:
                    # Don't retry on 4xx errors (client errors)
                    if e.response and 400 <= e.response.status_code < 500:
                        raise
                    last_exception = e
                    print(f"   ❌ HTTP error (attempt {attempt + 1}/{max_retries})")
                except Exception as e:
                    last_exception = e
                    print(f"   ⚠️ Error: {e} (attempt {attempt + 1}/{max_retries})")
                
                if attempt < max_retries - 1:
                    time.sleep(current_delay)
                    current_delay *= backoff
            
            # All retries failed
            print(f"   ❌ All {max_retries} attempts failed")
            raise last_exception
        return wrapper
    return decorator


class DashboardClient:
    """Dashboard API ile iletişim - with retry and error handling"""
    
    def __init__(self, dashboard_url: str = None):
        # Get dashboard URL from environment or use localhost
        self.dashboard_url = dashboard_url or os.getenv(
            "DASHBOARD_URL",
            "http://localhost:3000"
        )
        self.api_base = f"{self.dashboard_url}/api/trpc"
        
        # Connection health tracking
        self._last_successful_call = 0
        self._consecutive_failures = 0
        self._max_consecutive_failures = 5
    
    def _record_success(self):
        """Record successful API call"""
        self._last_successful_call = time.time()
        self._consecutive_failures = 0
    
    def _record_failure(self):
        """Record failed API call"""
        self._consecutive_failures += 1
        if self._consecutive_failures >= self._max_consecutive_failures:
            print(f"   🚨 Dashboard API: {self._consecutive_failures} consecutive failures!")
    
    def is_healthy(self) -> bool:
        """Check if dashboard connection is healthy"""
        return self._consecutive_failures < self._max_consecutive_failures
    
    @retry_on_failure(max_retries=3, delay=1.0)
    def get_settings(self) -> Dict:
        """Dashboard'dan bot ayarlarını çek"""
        try:
            response = requests.get(f"{self.api_base}/settings.get", timeout=10)
            response.raise_for_status()
            data = response.json()["result"]["data"]
            # tRPC superjson wrapper - "json" key içinde gerçek data var
            if "json" in data:
                self._record_success()
                return data["json"]
            self._record_success()
            return data
        except Exception as e:
            self._record_failure()
            print(f"⚠️ Settings çekme hatası: {e}")
            return {}
    
    def is_bot_active(self) -> bool:
        """Bot aktif mi?"""
        settings = self.get_settings()
        return settings.get("isActive", False)
    
    @retry_on_failure(max_retries=2, delay=0.5)
    def check_daily_loss_limit(self) -> Dict:
        """Günlük kayıp limiti kontrolü"""
        try:
            response = requests.get(f"{self.api_base}/dailyLoss.check", timeout=10)
            response.raise_for_status()
            self._record_success()
            return response.json()["result"]["data"]
        except Exception as e:
            self._record_failure()
            print(f"⚠️ Daily loss kontrolü hatası: {e}")
            return {"exceeded": False, "currentLoss": 0, "limit": 1000, "remaining": 1000, "percentage": 0}
    
    @retry_on_failure(max_retries=3, delay=1.0)
    def open_position_notification(self, position: Dict) -> int:
        """Pozisyon açıldı bildirimi - returns database ID"""
        try:
            # tRPC format: {"json": {...}}
            payload = {"json": position}
            response = requests.post(
                f"{self.api_base}/bot.openPosition",
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            
            # Get database ID from response
            result = response.json()
            # Response format: {"result": {"data": {"json": {"positionId": 123, ...}}}}
            db_id = result.get('result', {}).get('data', {}).get('json', {}).get('positionId', 0)
            
            self._record_success()
            print(f"✅ Pozisyon database'e kaydedildi: {position['symbol']} {position['direction']} (ID: {db_id})")
            return db_id
        except Exception as e:
            self._record_failure()
            print(f"⚠️ Pozisyon açma bildirimi hatası: {e}")
            return 0
    
    @retry_on_failure(max_retries=2, delay=0.5)
    def update_position_pnl(self, position_update: Dict):
        """Pozisyon P&L güncelleme"""
        try:
            # tRPC format: {"json": {...}}
            payload = {"json": position_update}
            response = requests.post(
                f"{self.api_base}/bot.updatePositionPnL",
                json=payload,
                timeout=5
            )
            if response.status_code != 200:
                print(f"   ⚠️ P&L update failed: {response.status_code}")
            else:
                self._record_success()
                print(f"   ✅ P&L güncellendi: ID {position_update.get('id')}")
        except Exception as e:
            self._record_failure()
            print(f"   ⚠️ P&L update API hatası: {e}")
    
    @retry_on_failure(max_retries=3, delay=1.0)
    def close_position_notification(self, position: Dict):
        """Pozisyon kapandı bildirimi"""
        try:
            # tRPC format: {"json": {...}}
            payload = {"json": position}
            response = requests.post(
                f"{self.api_base}/bot.closePosition",
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            self._record_success()
            print(f"✅ Pozisyon kapatıldı (ID: {position.get('positionId', 'unknown')})")
        except Exception as e:
            self._record_failure()
            print(f"⚠️ Pozisyon kapatma bildirimi hatası: {e}")
    
    def send_daily_report(self, report: Dict):
        """Günlük rapor gönder"""
        try:
            requests.post(
                f"{self.api_base}/bot.dailyReport",
                json=report,
                timeout=10
            )
            self._record_success()
        except Exception as e:
            self._record_failure()
            print(f"⚠️ Rapor gönderme hatası: {e}")
    
    def send_notification(self, notification_type: str, title: str, message: str, severity: str = "INFO"):
        """Genel bildirim gönder (maliyet, performans, vb.)"""
        try:
            # Direkt database'e yaz (daha güvenilir)
            from notification_writer import NotificationWriter
            writer = NotificationWriter()
            
            return writer.write_notification(
                notification_type=notification_type,
                title=title,
                message=message,
                severity=severity
            )
                
        except Exception as e:
            print(f"⚠️ Bildirim gönderme hatası: {e}")
            return False
    
    def send_cost_warning(self, current_cost: float, limit: float, cost_type: str = "fine-tuning"):
        """Maliyet uyarısı gönder"""
        percentage = (current_cost / limit) * 100
        
        return self.send_notification(
            notification_type="COST_WARNING",
            title=f"⚠️ Maliyet Limiti Yakın ({cost_type})",
            message=f"Mevcut maliyet: ${current_cost:.2f}\n"
                    f"Limit: ${limit:.2f}\n"
                    f"Kullanım: %{percentage:.0f}\n\n"
                    f"Limit aşılırsa fine-tuning iptal edilecek.",
            severity="WARNING"
        )
    
    def send_cost_exceeded(self, current_cost: float, limit: float, cost_type: str = "fine-tuning"):
        """Maliyet limiti aşıldı bildirimi"""
        
        return self.send_notification(
            notification_type="COST_EXCEEDED",
            title=f"🚨 Maliyet Limiti Aşıldı ({cost_type})",
            message=f"Maliyet: ${current_cost:.2f}\n"
                    f"Limit: ${limit:.2f}\n\n"
                    f"❌ Fine-tuning iptal edildi.\n"
                    f"✅ Veriler checkpoint olarak kaydedildi.\n"
                    f"Bir sonraki fine-tuning'de bu veriler kullanılacak.",
            severity="ERROR"
        )
    
    def send_monthly_limit_reached(self, monthly_cost: float, limit: float):
        """Aylık limit doldu bildirimi"""
        
        from datetime import datetime, timedelta
        next_month = (datetime.now() + timedelta(days=30)).strftime("%B %Y")
        
        return self.send_notification(
            notification_type="MONTHLY_LIMIT_REACHED",
            title="📊 Aylık Maliyet Limiti Doldu",
            message=f"Bu ay ${monthly_cost:.2f} harcandı.\n\n"
                    f"{next_month} başında fine-tuning otomatik aktifleşecek.\n\n"
                    f"Seçenek A ile devam ediliyor.",
            severity="INFO"
        )
    
    def send_performance_drop_alert(self, base_win_rate: float, finetuned_win_rate: float, difference: float):
        """Performans düşüşü uyarısı"""
        
        return self.send_notification(
            notification_type="PERFORMANCE_DROP",
            title="🚨 Model Geri Alındı",
            message=f"Fine-tuned model performansı düştü!\n\n"
                    f"Base model: {base_win_rate:.1%}\n"
                    f"Fine-tuned model: {finetuned_win_rate:.1%}\n"
                    f"Fark: {difference:.1%}\n\n"
                    f"🔄 Base model'e geri dönüldü.",
            severity="ERROR"
        )
    
    def send_finetuning_success(self, model_name: str, training_samples: int, validation_accuracy: float):
        """Fine-tuning başarılı bildirimi"""
        
        return self.send_notification(
            notification_type="FINETUNING_SUCCESS",
            title="✅ Fine-Tuning Tamamlandı",
            message=f"Yeni model: {model_name}\n\n"
                    f"📊 Eğitim: {training_samples} işlem\n"
                    f"🎯 Accuracy: {validation_accuracy:.1%}\n\n"
                    f"🚀 Gradual rollout başlatıldı: %25 → %100 (7 gün)",
            severity="SUCCESS"
        )
    
    def send_finetuning_failed(self, reason: str, checkpoint_id: str = None):
        """Fine-tuning başarısız bildirimi"""
        
        message = f"Sebep: {reason}\n\n"
        
        if checkpoint_id:
            message += f"✅ Veriler checkpoint olarak kaydedildi: {checkpoint_id}\n"
            message += f"Bir sonraki fine-tuning'de bu veriler kullanılacak.\n\n"
        
        message += f"Seçenek A ile devam ediliyor."
        
        return self.send_notification(
            notification_type="FINETUNING_FAILED",
            title="❌ Fine-Tuning Başarısız",
            message=message,
            severity="ERROR"
        )
    
    def send_rollout_phase_update(self, phase: int, percentage: int, model_name: str):
        """Gradual rollout faz güncellemesi"""
        
        return self.send_notification(
            notification_type="ROLLOUT_PHASE_UPDATE",
            title=f"📈 Rollout Fazı Güncellendi",
            message=f"Model: {model_name}\n\n"
                    f"Faz {phase}: %{percentage} aktif\n\n"
                    f"Fine-tuned model'in kullanım oranı arttırıldı.",
            severity="INFO"
        )
    
    def send_checkpoint_saved(self, checkpoint_id: str, trade_count: int, estimated_cost: float):
        """Checkpoint kaydedildi bildirimi"""
        
        return self.send_notification(
            notification_type="CHECKPOINT_SAVED",
            title="💾 Checkpoint Kaydedildi",
            message=f"Checkpoint: {checkpoint_id}\n\n"
                    f"📊 İşlem sayısı: {trade_count}\n"
                    f"💰 Tahmini maliyet: ${estimated_cost:.2f}\n\n"
                    f"Veriler güvenli bir şekilde kaydedildi.",
            severity="INFO"
        )
    
    def _get_timestamp(self) -> str:
        """ISO format timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()

    @retry_on_failure(max_retries=3, delay=1.0)
    def update_settings(self, updates: Dict) -> bool:
        """
        Update bot settings in database
        
        Args:
            updates: Dict of settings to update
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # tRPC expects input wrapped in {"json": {...}}
            payload = {"json": updates}
            response = requests.post(
                f"{self.api_base}/settings.update",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            response.raise_for_status()
            self._record_success()
            return True
        except Exception as e:
            self._record_failure()
            print(f"⚠️ Settings güncelleme hatası: {e}")
            return False
    
    def get_connection_status(self) -> Dict:
        """Get connection health status"""
        return {
            "healthy": self.is_healthy(),
            "consecutive_failures": self._consecutive_failures,
            "last_successful_call": self._last_successful_call,
            "dashboard_url": self.dashboard_url
        }
