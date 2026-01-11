"""
Cost Controller: OpenAI API Maliyet Kontrolü
Fine-tuning ve model kullanım maliyetlerini kontrol et
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
from dashboard_client import DashboardClient

# Base directory - works on both sandbox and VPS
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class CostController:
    """OpenAI API maliyet kontrolü ve limitleri"""
    
    # Maliyet limitleri
    MAX_COST_PER_FINETUNING = 10.0  # $10 per fine-tuning job
    MAX_MONTHLY_COST = 25.0  # $25 per month
    WARNING_THRESHOLD = 0.80  # %80'de uyarı
    
    # OpenAI fiyatlandırması (Aralık 2024)
    TRAINING_COST_PER_1M_TOKENS = 25.00  # $25 / 1M tokens
    INPUT_COST_PER_1M_TOKENS = 2.50  # $2.50 / 1M tokens (fine-tuned model)
    OUTPUT_COST_PER_1M_TOKENS = 10.00  # $10 / 1M tokens (fine-tuned model)
    
    def __init__(self):
        self.cost_tracking_file = os.path.join(BASE_DIR, "cost_tracking.json")
        self.dashboard = DashboardClient()
        self._load_cost_tracking()
    
    def _load_cost_tracking(self):
        """Maliyet takip dosyasını yükle"""
        
        if os.path.exists(self.cost_tracking_file):
            with open(self.cost_tracking_file, "r") as f:
                self.cost_data = json.load(f)
        else:
            self.cost_data = {
                "finetuning_jobs": [],
                "monthly_costs": {}
            }
    
    def _save_cost_tracking(self):
        """Maliyet takip dosyasını kaydet"""
        
        with open(self.cost_tracking_file, "w") as f:
            json.dump(self.cost_data, f, indent=2)
    
    def estimate_finetuning_cost(self, trades: List[Dict]) -> float:
        """Fine-tuning maliyetini tahmin et"""
        
        # Her trade ~500 token (ortalama)
        # Prompt + completion + formatting
        tokens_per_trade = 500
        total_tokens = len(trades) * tokens_per_trade
        
        # Training cost
        training_cost = (total_tokens / 1_000_000) * self.TRAINING_COST_PER_1M_TOKENS
        
        print(f"💰 Maliyet Tahmini:")
        print(f"   - İşlem sayısı: {len(trades)}")
        print(f"   - Toplam token: {total_tokens:,}")
        print(f"   - Training cost: ${training_cost:.2f}")
        
        return training_cost
    
    def estimate_monthly_usage_cost(self, daily_analyses: int = 24) -> float:
        """Aylık model kullanım maliyetini tahmin et"""
        
        # Bot her saat analiz yapıyor (24 × 30 = 720 analiz/ay)
        monthly_analyses = daily_analyses * 30
        
        # Her analiz:
        # - Input: ~1000 token (grafik + sentiment + pattern)
        # - Output: ~200 token (karar + açıklama)
        input_tokens = monthly_analyses * 1000
        output_tokens = monthly_analyses * 200
        
        input_cost = (input_tokens / 1_000_000) * self.INPUT_COST_PER_1M_TOKENS
        output_cost = (output_tokens / 1_000_000) * self.OUTPUT_COST_PER_1M_TOKENS
        
        total_cost = input_cost + output_cost
        
        print(f"💰 Aylık Kullanım Maliyeti Tahmini:")
        print(f"   - Günlük analiz: {daily_analyses}")
        print(f"   - Aylık analiz: {monthly_analyses}")
        print(f"   - Input cost: ${input_cost:.2f}")
        print(f"   - Output cost: ${output_cost:.2f}")
        print(f"   - Toplam: ${total_cost:.2f}")
        
        return total_cost
    
    def check_finetuning_cost_limit(self, estimated_cost: float) -> Tuple[bool, str]:
        """Fine-tuning maliyet limitini kontrol et"""
        
        # 1. Tek fine-tuning limiti
        if estimated_cost > self.MAX_COST_PER_FINETUNING:
            return False, f"Fine-tuning maliyeti limiti aşıldı: ${estimated_cost:.2f} > ${self.MAX_COST_PER_FINETUNING}"
        
        # 2. Uyarı eşiği
        if estimated_cost >= self.MAX_COST_PER_FINETUNING * self.WARNING_THRESHOLD:
            self._send_cost_warning(estimated_cost, self.MAX_COST_PER_FINETUNING)
        
        return True, "OK"
    
    def check_monthly_cost_limit(self, additional_cost: float) -> Tuple[bool, str]:
        """Aylık maliyet limitini kontrol et"""
        
        current_month = datetime.now().strftime("%Y-%m")
        monthly_cost = self.cost_data["monthly_costs"].get(current_month, 0)
        
        new_total = monthly_cost + additional_cost
        
        # 1. Aylık limit kontrolü
        if new_total > self.MAX_MONTHLY_COST:
            return False, f"Aylık maliyet limiti aşılacak: ${new_total:.2f} > ${self.MAX_MONTHLY_COST}"
        
        # 2. Uyarı eşiği
        if new_total >= self.MAX_MONTHLY_COST * self.WARNING_THRESHOLD:
            self._send_monthly_cost_warning(new_total, self.MAX_MONTHLY_COST)
        
        return True, "OK"
    
    def record_finetuning_cost(self, checkpoint_id: str, estimated_cost: float, status: str):
        """Fine-tuning maliyetini kaydet"""
        
        current_month = datetime.now().strftime("%Y-%m")
        
        # Fine-tuning job kaydı
        job_record = {
            "checkpoint_id": checkpoint_id,
            "date": datetime.now().isoformat(),
            "estimated_cost": estimated_cost,
            "status": status,  # pending, completed, cancelled
            "month": current_month
        }
        
        self.cost_data["finetuning_jobs"].append(job_record)
        
        # Aylık maliyet güncelle (sadece completed için)
        if status == "completed":
            if current_month not in self.cost_data["monthly_costs"]:
                self.cost_data["monthly_costs"][current_month] = 0
            
            self.cost_data["monthly_costs"][current_month] += estimated_cost
        
        self._save_cost_tracking()
        
        print(f"📝 Maliyet kaydedildi: {checkpoint_id} → ${estimated_cost:.2f} ({status})")
    
    def get_monthly_cost(self, month: str = None) -> float:
        """Belirtilen ay için toplam maliyeti getir"""
        
        if month is None:
            month = datetime.now().strftime("%Y-%m")
        
        return self.cost_data["monthly_costs"].get(month, 0)
    
    def get_cost_stats(self) -> Dict:
        """Maliyet istatistikleri"""
        
        current_month = datetime.now().strftime("%Y-%m")
        monthly_cost = self.get_monthly_cost(current_month)
        
        total_finetuning_jobs = len(self.cost_data["finetuning_jobs"])
        completed_jobs = sum(1 for job in self.cost_data["finetuning_jobs"] if job["status"] == "completed")
        cancelled_jobs = sum(1 for job in self.cost_data["finetuning_jobs"] if job["status"] == "cancelled")
        
        total_cost = sum(self.cost_data["monthly_costs"].values())
        
        return {
            "current_month": current_month,
            "monthly_cost": monthly_cost,
            "monthly_limit": self.MAX_MONTHLY_COST,
            "monthly_remaining": self.MAX_MONTHLY_COST - monthly_cost,
            "total_finetuning_jobs": total_finetuning_jobs,
            "completed_jobs": completed_jobs,
            "cancelled_jobs": cancelled_jobs,
            "total_cost_all_time": total_cost
        }
    
    def _send_cost_warning(self, estimated_cost: float, limit: float):
        """Maliyet uyarısı gönder"""
        
        self.dashboard.send_cost_warning(estimated_cost, limit, "fine-tuning")
    
    def _send_monthly_cost_warning(self, current_cost: float, limit: float):
        """Aylık maliyet uyarısı gönder"""
        
        self.dashboard.send_cost_warning(current_cost, limit, "aylık")
    
    def send_cost_exceeded_notification(self, estimated_cost: float, limit: float, reason: str):
        """Maliyet limiti aşıldı bildirimi"""
        
        self.dashboard.send_cost_exceeded(estimated_cost, limit, "fine-tuning")
    
    def send_monthly_limit_reached_notification(self, monthly_cost: float):
        """Aylık limit doldu bildirimi"""
        
        self.dashboard.send_monthly_limit_reached(monthly_cost, self.MAX_MONTHLY_COST)


# Test
if __name__ == "__main__":
    controller = CostController()
    
    # Mock trades
    mock_trades = [{"id": f"trade_{i}"} for i in range(50)]
    
    # Maliyet tahmini
    estimated_cost = controller.estimate_finetuning_cost(mock_trades)
    
    # Limit kontrolü
    can_proceed, reason = controller.check_finetuning_cost_limit(estimated_cost)
    print(f"\n✅ Fine-tuning yapılabilir mi? {can_proceed}")
    print(f"   Sebep: {reason}")
    
    # Aylık limit kontrolü
    can_proceed, reason = controller.check_monthly_cost_limit(estimated_cost)
    print(f"\n✅ Aylık limit uygun mu? {can_proceed}")
    print(f"   Sebep: {reason}")
    
    # Maliyet kaydet
    controller.record_finetuning_cost("checkpoint_test", estimated_cost, "completed")
    
    # İstatistikler
    print("\n📊 Maliyet İstatistikleri:")
    stats = controller.get_cost_stats()
    for key, value in stats.items():
        print(f"   - {key}: {value}")
