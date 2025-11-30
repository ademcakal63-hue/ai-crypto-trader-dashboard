"""
Gradual Rollout: Fine-tuned model'i kademeli olarak kullan
7 gün boyunca %25 → %50 → %75 → %100 geçiş
"""

import json
import os
import random
from datetime import datetime, timedelta
from typing import Dict, Optional


class GradualRollout:
    """Fine-tuned model'i kademeli olarak devreye alma"""
    
    def __init__(self):
        self.rollout_file = "/home/ubuntu/ai-crypto-trader-dashboard/ai_bot/rollout_status.json"
        self._load_rollout_status()
    
    def _load_rollout_status(self):
        """Rollout durumunu yükle"""
        
        if os.path.exists(self.rollout_file):
            with open(self.rollout_file, "r") as f:
                self.rollout_data = json.load(f)
        else:
            self.rollout_data = {
                "active": False,
                "model": None,
                "start_date": None,
                "current_percentage": 0,
                "phase": 0,
                "phases": [
                    {"day": 1, "percentage": 25},
                    {"day": 3, "percentage": 50},
                    {"day": 5, "percentage": 75},
                    {"day": 7, "percentage": 100}
                ]
            }
    
    def _save_rollout_status(self):
        """Rollout durumunu kaydet"""
        
        with open(self.rollout_file, "w") as f:
            json.dump(self.rollout_data, f, indent=2)
    
    def start_rollout(self, fine_tuned_model: str):
        """Gradual rollout başlat"""
        
        self.rollout_data = {
            "active": True,
            "model": fine_tuned_model,
            "start_date": datetime.now().isoformat(),
            "current_percentage": 25,  # İlk gün %25
            "phase": 0,
            "phases": [
                {"day": 1, "percentage": 25},
                {"day": 3, "percentage": 50},
                {"day": 5, "percentage": 75},
                {"day": 7, "percentage": 100}
            ]
        }
        
        self._save_rollout_status()
        
        print(f"✅ Gradual rollout başlatıldı: {fine_tuned_model}")
        print(f"   - Başlangıç: %25")
        print(f"   - Gün 3: %50")
        print(f"   - Gün 5: %75")
        print(f"   - Gün 7: %100")
    
    def update_rollout_phase(self):
        """Rollout fazını güncelle (günlük kontrol)"""
        
        if not self.rollout_data["active"]:
            return
        
        start_date = datetime.fromisoformat(self.rollout_data["start_date"])
        days_passed = (datetime.now() - start_date).days
        
        # Hangi fazda olmalıyız?
        current_phase = self.rollout_data["phase"]
        phases = self.rollout_data["phases"]
        
        for i, phase in enumerate(phases):
            if days_passed >= phase["day"] and i > current_phase:
                # Yeni faza geç
                self.rollout_data["phase"] = i
                self.rollout_data["current_percentage"] = phase["percentage"]
                self._save_rollout_status()
                
                print(f"📈 Rollout fazı güncellendi:")
                print(f"   - Gün {days_passed}: %{phase['percentage']}")
                
                # Bildirim gönder
                try:
                    from dashboard_client import DashboardClient
                    dashboard = DashboardClient()
                    dashboard.send_rollout_phase_update(
                        i + 1,
                        phase["percentage"],
                        self.rollout_data["model"]
                    )
                except Exception as e:
                    print(f"⚠️ Bildirim gönderme hatası: {e}")
                
                # Son faz mı?
                if phase["percentage"] == 100:
                    print("🎉 Gradual rollout tamamlandı! Fine-tuned model %100 aktif.")
                
                break
    
    def should_use_finetuned_model(self) -> bool:
        """Bu işlemde fine-tuned model kullanılmalı mı?"""
        
        if not self.rollout_data["active"]:
            return False
        
        # Rollout fazını güncelle
        self.update_rollout_phase()
        
        # Mevcut yüzdeye göre karar ver
        percentage = self.rollout_data["current_percentage"]
        
        # Random seçim (örn: %25 ise 4 işlemden 1'i fine-tuned model kullanır)
        return random.random() < (percentage / 100)
    
    def get_active_model(self, base_model: str) -> str:
        """Aktif modeli döndür (base veya fine-tuned)"""
        
        if self.should_use_finetuned_model():
            return self.rollout_data["model"]
        else:
            return base_model
    
    def stop_rollout(self):
        """Rollout'u durdur (performans düşerse)"""
        
        self.rollout_data["active"] = False
        self._save_rollout_status()
        
        print("🛑 Gradual rollout durduruldu.")
    
    def complete_rollout(self):
        """Rollout'u tamamla (%100'e geç)"""
        
        self.rollout_data["current_percentage"] = 100
        self.rollout_data["phase"] = len(self.rollout_data["phases"]) - 1
        self._save_rollout_status()
        
        print("🎉 Gradual rollout manuel olarak tamamlandı! Fine-tuned model %100 aktif.")
    
    def get_rollout_status(self) -> Dict:
        """Rollout durumunu getir"""
        
        if not self.rollout_data["active"]:
            return {
                "active": False,
                "message": "Gradual rollout aktif değil"
            }
        
        start_date = datetime.fromisoformat(self.rollout_data["start_date"])
        days_passed = (datetime.now() - start_date).days
        
        return {
            "active": True,
            "model": self.rollout_data["model"],
            "start_date": self.rollout_data["start_date"],
            "days_passed": days_passed,
            "current_percentage": self.rollout_data["current_percentage"],
            "phase": self.rollout_data["phase"] + 1,
            "total_phases": len(self.rollout_data["phases"]),
            "next_phase": self._get_next_phase()
        }
    
    def _get_next_phase(self) -> Optional[Dict]:
        """Bir sonraki fazı getir"""
        
        current_phase = self.rollout_data["phase"]
        phases = self.rollout_data["phases"]
        
        if current_phase + 1 < len(phases):
            next_phase = phases[current_phase + 1]
            start_date = datetime.fromisoformat(self.rollout_data["start_date"])
            next_date = start_date + timedelta(days=next_phase["day"])
            
            return {
                "day": next_phase["day"],
                "percentage": next_phase["percentage"],
                "date": next_date.isoformat()
            }
        else:
            return None


# Test
if __name__ == "__main__":
    rollout = GradualRollout()
    
    # Rollout başlat
    rollout.start_rollout("ft:gpt-4o-2024-08-06:abc123")
    
    # Durum
    status = rollout.get_rollout_status()
    print(f"\n📊 Rollout Durumu:")
    print(f"   - Aktif: {status['active']}")
    print(f"   - Model: {status['model']}")
    print(f"   - Gün: {status['days_passed']}")
    print(f"   - Yüzde: %{status['current_percentage']}")
    print(f"   - Faz: {status['phase']}/{status['total_phases']}")
    
    # 10 işlem simülasyonu
    print(f"\n🎲 10 İşlem Simülasyonu (%{status['current_percentage']} rollout):")
    base_count = 0
    finetuned_count = 0
    
    for i in range(10):
        if rollout.should_use_finetuned_model():
            print(f"   İşlem {i+1}: Fine-tuned model")
            finetuned_count += 1
        else:
            print(f"   İşlem {i+1}: Base model")
            base_count += 1
    
    print(f"\n📊 Sonuç:")
    print(f"   - Base model: {base_count}/10 (%{base_count*10})")
    print(f"   - Fine-tuned model: {finetuned_count}/10 (%{finetuned_count*10})")
