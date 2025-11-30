"""
Hybrid Learning Manager
Seçenek A ve B'yi yönetir, otomatik geçiş yapar
"""

import os
import json
import schedule
import time
from datetime import datetime, timedelta
from learning_system_a import PromptLearningSystem
from learning_system_b import FineTuningSystem
from dashboard_client import DashboardClient
from finetuning_safety import FineTuningSafety

class HybridLearningManager:
    """Hybrid öğrenme sistemi yöneticisi"""
    
    def __init__(self):
        self.dashboard = DashboardClient()
        self.safety = FineTuningSafety()
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
        if not os.path.exists("/home/ubuntu/ai-crypto-trader-dashboard/ai_bot/start_date.txt"):
            self.start_date = datetime.now()
            with open("/home/ubuntu/ai-crypto-trader-dashboard/ai_bot/start_date.txt", "w") as f:
                f.write(self.start_date.isoformat())
            print(f"📅 Başlangıç tarihi kaydedildi: {self.start_date.strftime('%Y-%m-%d')}")
        else:
            with open("/home/ubuntu/ai-crypto-trader-dashboard/ai_bot/start_date.txt", "r") as f:
                self.start_date = datetime.fromisoformat(f.read().strip())
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
                
                # Dashboard'a bildirim
                self.dashboard.send_notification({
                    "type": "FINETUNING_COMPLETE",
                    "title": "Fine-Tuning Tamamlandı",
                    "message": f"Yeni model: {result['model']} ({result['training_samples']} işlem ile eğitildi)",
                    "severity": "INFO"
                })
            else:
                print(f"❌ Fine-tuning başarısız: {result['reason']}")
    
    def get_active_model(self) -> str:
        """Aktif modeli döndür (gradual rollout ile)"""
        
        if self.current_system == "A":
            return self.system_a.get_model_version()
        else:
            # Seçenek B: Gradual rollout
            if not self.finetuning_date:
                return self.system_b.get_active_model()
            
            days_since = (datetime.now() - self.finetuning_date).days
            use_finetuned = self.safety.should_use_finetuned_model(days_since)
            
            if use_finetuned:
                return self.system_b.get_active_model()
            else:
                return self.system_b.current_model  # Base model
    
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
        
        is_ok, result = self.safety.monitor_performance()
        
        if not is_ok:
            print("🚨 Performans düşüşü tespit edildi!")
            
            # Base model'e geri dön
            self.safety.rollback_to_base_model()
            self.current_system = "A"
            
            # Dashboard'a bildirim
            self.dashboard.send_notification({
                "type": "MODEL_ROLLBACK",
                "title": "Model Geri Alındı",
                "message": f"Fine-tuned model performansı düştü. Seçenek A'ya dönüldü.",
                "severity": "WARNING"
            })
    
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
