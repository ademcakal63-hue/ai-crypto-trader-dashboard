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
            data = response.json()["result"]["data"]
            # tRPC superjson wrapper - "json" key içinde gerçek data var
            if "json" in data:
                return data["json"]
            return data
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
        """İliyet uyarısı gönder"""
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

    def update_settings(self, updates: Dict) -> bool:
        """
        Update bot settings in database
        
        Args:
            updates: Dict of settings to update
            
        Returns:
            True if successful, False otherwise
        """
        try:
            response = requests.post(
                f"{self.api_base}/settings.update",
                json=updates,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"⚠️ Settings güncelleme hatası: {e}")
            return False
