"""
Hybrid Learning Manager
Seçenek A ve B'yi yönetir, otomatik geçiş yapar
"""

import os
import json
import schedule
import time
from datetime import datetime, timedelta

def parse_datetime_naive(dt_string: str) -> datetime:
    """Parse datetime string and ensure it's timezone-naive"""
    dt = datetime.fromisoformat(dt_string.replace('Z', '+00:00'))
    if dt.tzinfo is not None:
        dt = dt.replace(tzinfo=None)
    return dt
from learning_system_a import PromptLearningSystem

# Base directory - works on both sandbox and VPS
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
from learning_system_b import FineTuningSystem
from dashboard_client import DashboardClient
from finetuning_safety import FineTuningSafety
from gradual_rollout import GradualRollout
from performance_monitor import PerformanceMonitor

class HybridLearningManager:
    """Hybrid öğrenme sistemi yöneticisi"""
    
    def __init__(self):
        self.dashboard = DashboardClient()
        self.safety = FineTuningSafety()
        self.rollout = GradualRollout()
        self.performance_monitor = PerformanceMonitor()
        self.system_a = PromptLearningSystem()
        self.system_b = None  # Hafta 3'te aktif olacak
        self.current_system = "A"  # Başlangıçta A
        self.start_date = None
        self.finetuning_date = None
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
    
    def initialize(self):
        """Sistemi başlat"""
        
        print("\n🚀 Hybrid Learning Manager başlatılıyor...")
        
        # Başlangıç tarihini kaydet
        start_date_file = os.path.join(BASE_DIR, "start_date.txt")
        if not os.path.exists(start_date_file):
            self.start_date = datetime.now()
            with open(start_date_file, "w") as f:
                f.write(self.start_date.isoformat())
            print(f"📅 Başlangıç tarihi kaydedildi: {self.start_date.strftime('%Y-%m-%d')}")
        else:
            with open(start_date_file, "r") as f:
                self.start_date = parse_datetime_naive(f.read().strip())
            print(f"📅 Başlangıç tarihi: {self.start_date.strftime('%Y-%m-%d')}")
        
        # Hangi haftadayız?
        weeks_passed = (datetime.now() - self.start_date).days // 7
        print(f"📊 Geçen hafta sayısı: {weeks_passed}")
        
        # Hafta 3+ ise Seçenek B'ye geç
        if weeks_passed >= 2:  # Hafta 3 (0-indexed: 0, 1, 2)
            self._switch_to_system_b()
        else:
            print(f"✅ Seçenek A aktif (Hafta {weeks_passed + 1})")
        
        # Haftalık scheduler'ı başlat
        self._setup_scheduler()
    
    def _switch_to_system_b(self):
        """Seçenek B'ye geç"""
        
        if self.current_system == "B":
            print("ℹ️ Zaten Seçenek B aktif")
            return
        
        print("\n🔄 Seçenek A → B geçişi yapılıyor...")
        
        # OpenAI API Key kontrolü
        if not self.openai_api_key:
            print("⚠️ OPENAI_API_KEY bulunamadı! Seçenek A ile devam ediliyor.")
            print("Seçenek B için: export OPENAI_API_KEY='your_key_here'")
            return
        
        # İşlem sayısı kontrolü
        trade_count = self._get_trade_count()
        
        if trade_count < 50:
            print(f"⚠️ Yetersiz veri ({trade_count} işlem). En az 50 işlem gerekli.")
            print("Seçenek A ile devam ediliyor...")
            return
        
        # Seçenek B'yi başlat
        self.system_b = FineTuningSystem(self.openai_api_key)
        self.current_system = "B"
        
        # İlk fine-tuning'i yap
        print("🚀 İlk fine-tuning başlatılıyor...")
        result = self.system_b.weekly_finetuning()
        
        if result["success"]:
            print(f"✅ Seçenek B aktif! Model: {result['model']}")
            
            # Dashboard'a bildirim gönder
            self.dashboard.send_notification({
                "type": "MODEL_UPGRADE",
                "title": "AI Model Yükseltildi",
                "message": f"Seçenek A → B geçişi tamamlandı. Yeni model: {result['model']}",
                "severity": "INFO"
            })
        else:
            print(f"❌ Fine-tuning başarısız: {result['reason']}")
            print("Seçenek A ile devam ediliyor...")
            self.current_system = "A"
    
    def _get_trade_count(self) -> int:
        """Toplam işlem sayısını al"""
        # TODO: Dashboard API entegrasyonu
        # return len(self.dashboard.get_all_trades())
        
        # Şimdilik mock
        return 0
    
    def _setup_scheduler(self):
        """Haftalık scheduler'ı ayarla"""
        
        # Her Pazar 23:00'da çalıştır
        schedule.every().sunday.at("23:00").do(self.weekly_learning)
        
        print("📅 Haftalık scheduler ayarlandı: Her Pazar 23:00")
    
    def weekly_learning(self):
        """Haftalık öğrenme (A veya B)"""
        
        print(f"\n📊 Haftalık öğrenme başlıyor (Sistem: {self.current_system})...")
        
        if self.current_system == "A":
            # Seçenek A: Prompt güncelleme
            result = self.system_a.weekly_analysis()
            
            if result["success"]:
                print(f"✅ Prompt güncellendi! Model: {result['model_version']}")
                print(f"📈 Yeni kural sayısı: {len(result['new_rules'])}")
                
                # Dashboard'a bildirim
                self.dashboard.send_notification({
                    "type": "WEEKLY_LEARNING",
                    "title": "Haftalık Öğrenme Tamamlandı",
                    "message": f"Model {result['model_version']} güncellendi. {len(result['new_rules'])} yeni kural eklendi.",
                    "severity": "INFO"
                })
            
            # Hafta 3'e geçtik mi kontrol et
            weeks_passed = (datetime.now() - self.start_date).days // 7
            if weeks_passed >= 2:
                self._switch_to_system_b()
        
        elif self.current_system == "B":
            # Seçenek B: Gerçek fine-tuning
            result = self.system_b.weekly_finetuning()
            
            if result["success"]:
                print(f"✅ Fine-tuning tamamlandı! Model: {result['model']}")
                
                # Gradual rollout başlat
                self.rollout.start_rollout(result['model'])
                self.finetuning_date = datetime.now()
                
                # Dashboard'a bildirim
                self.dashboard.send_notification({
                    "type": "FINETUNING_COMPLETE",
                    "title": "Fine-Tuning Tamamlandı",
                    "message": f"Yeni model: {result['model']} ({result['training_samples']} işlem ile eğitildi)\n\n"
                              f"Gradual rollout başlatıldı: %25 → %100 (7 gün)",
                    "severity": "INFO"
                })
            else:
                print(f"❌ Fine-tuning başarısız: {result['reason']}")
                
                # Checkpoint kaydedildi mi?
                if "checkpoint_id" in result:
                    print(f"✅ Veriler checkpoint olarak kaydedildi: {result['checkpoint_id']}")
                    print(f"   Bir sonraki fine-tuning'de bu veriler kullanılacak.")
    
    def get_active_model(self) -> str:
        """Aktif modeli döndür (gradual rollout ile)"""
        
        if self.current_system == "A":
            return self.system_a.get_model_version()
        else:
            # Seçenek B: Gradual rollout
            base_model = self.system_b.current_model
            return self.rollout.get_active_model(base_model)
    
    def get_learned_rules(self) -> str:
        """Öğrenilen kuralları döndür (Seçenek A için)"""
        
        if self.current_system == "A":
            return self.system_a.get_learned_rules()
        else:
            return ""  # Seçenek B'de kurallar model içinde
    
    def check_performance(self):
        """Performans izleme (her gün)"""
        
        if self.current_system != "B":
            return  # Sadece Seçenek B'de kontrol et
        
        print("\n📊 Performans izleme başlıyor...")
        
        # Performans karşılaştırması yap
        rolled_back, reason = self.performance_monitor.check_and_rollback_if_needed()
        
        if rolled_back:
            print(f"🚨 Performans düşüşü tespit edildi: {reason}")
            
            # Gradual rollout'u durdur
            self.rollout.stop_rollout()
            
            # Seçenek A'ya geri dön
            self.current_system = "A"
            
            print("🔄 Seçenek A'ya geri dönüldü.")
        else:
            print(f"✅ Performans normal: {reason}")
    
    def record_trade_result(self, trade: dict):
        """İşlem sonucunu kaydet (performans izleme için)"""
        
        if self.current_system != "B":
            return
        
        # Hangi model kullanıldı?
        model_used = self.get_active_model()
        
        # Performans monitöre kaydet
        self.performance_monitor.record_trade(trade, model_used)
    
    def get_system_status(self) -> dict:
        """Sistem durumunu getir"""
        
        status = {
            "current_system": self.current_system,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "weeks_passed": (datetime.now() - self.start_date).days // 7 if self.start_date else 0,
            "openai_api_key_set": bool(self.openai_api_key)
        }
        
        if self.current_system == "B":
            status["rollout"] = self.rollout.get_rollout_status()
            status["performance"] = self.performance_monitor.get_performance_summary()
        
        return status
    
    def run_scheduler(self):
        """Scheduler'ı çalıştır (sürekli loop)"""
        
        print("\n🔄 Scheduler başlatıldı. Haftalık öğrenme bekleniyor...")
        
        # Performans izleme: Her gün 12:00'da
        schedule.every().day.at("12:00").do(self.check_performance)
        
        while True:
            schedule.run_pending()
            time.sleep(3600)  # 1 saat bekle


# Standalone kullanım
if __name__ == "__main__":
    manager = HybridLearningManager()
    manager.initialize()
    
    # Test: Haftalık öğrenmeyi manuel çalıştır
    manager.weekly_learning()
    
    # Scheduler'ı başlat (sürekli çalışır)
    # manager.run_scheduler()
