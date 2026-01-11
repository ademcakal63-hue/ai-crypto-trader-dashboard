"""
Fine-Tuning Güvenlik Mekanizmaları
Yanlış strateji öğrenmesini önler
"""

import os
import random
from typing import Dict, List, Tuple
from datetime import datetime, timedelta
from dashboard_client import DashboardClient

# Base directory - works on both sandbox and VPS
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class FineTuningSafety:
    """Fine-tuning güvenlik kontrolleri"""
    
    def __init__(self):
        self.dashboard = DashboardClient()
        self.min_win_rate = 0.55  # Minimum %55 başarı
        self.min_patterns = 3  # Minimum 3 farklı pattern
        self.min_trades_per_pattern = 5  # Her pattern için minimum 5 işlem
        self.outlier_std_threshold = 3  # 3 standart sapma
        self.validation_ratio = 0.2  # %20 validation
        self.min_validation_accuracy = 0.60  # Minimum %60 validation accuracy
    
    def validate_before_finetuning(self, trades: List[Dict]) -> Tuple[bool, str]:
        """Fine-tuning öncesi veri kalitesini kontrol et"""
        
        print("\n🔍 Fine-tuning güvenlik kontrolü başlıyor...")
        
        # 1. Genel başarı oranı
        win_rate = self._calculate_win_rate(trades)
        
        if win_rate < self.min_win_rate:
            reason = f"Başarı oranı çok düşük (%{win_rate*100:.0f}). Minimum %{self.min_win_rate*100:.0f} gerekli."
            print(f"❌ {reason}")
            return False, reason
        
        print(f"✅ Başarı oranı: %{win_rate*100:.0f}")
        
        # 2. Pattern çeşitliliği
        patterns = set([t["pattern"] for t in trades])
        
        if len(patterns) < self.min_patterns:
            reason = f"Yetersiz pattern çeşitliliği ({len(patterns)} pattern). Minimum {self.min_patterns} gerekli."
            print(f"❌ {reason}")
            return False, reason
        
        print(f"✅ Pattern çeşitliliği: {len(patterns)} pattern")
        
        # 3. Her pattern'de minimum işlem
        for pattern in patterns:
            pattern_trades = [t for t in trades if t["pattern"] == pattern]
            if len(pattern_trades) < self.min_trades_per_pattern:
                reason = f"{pattern} için yetersiz veri ({len(pattern_trades)} işlem). Minimum {self.min_trades_per_pattern} gerekli."
                print(f"❌ {reason}")
                return False, reason
        
        print(f"✅ Her pattern için yeterli veri")
        
        # 4. Outlier kontrolü
        outlier_count = self._count_outliers(trades)
        if outlier_count > len(trades) * 0.1:  # %10'dan fazla outlier
            reason = f"Çok fazla aykırı değer ({outlier_count} işlem, %{outlier_count/len(trades)*100:.0f})"
            print(f"⚠️ {reason}")
            # Outlier'ları temizleyeceğiz, ama devam edebiliriz
        
        print(f"✅ Güvenlik kontrolü başarılı!")
        return True, "OK"
    
    def _calculate_win_rate(self, trades: List[Dict]) -> float:
        """Başarı oranını hesapla"""
        if not trades:
            return 0.0
        
        wins = len([t for t in trades if t.get("result") == "WIN"])
        return wins / len(trades)
    
    def _count_outliers(self, trades: List[Dict]) -> int:
        """Aykırı değer sayısını hesapla"""
        if len(trades) < 10:
            return 0
        
        pnls = [t.get("pnl", 0) for t in trades]
        mean_pnl = sum(pnls) / len(pnls)
        std_pnl = (sum([(p - mean_pnl)**2 for p in pnls]) / len(pnls)) ** 0.5
        
        outliers = 0
        for pnl in pnls:
            if abs(pnl - mean_pnl) > self.outlier_std_threshold * std_pnl:
                outliers += 1
        
        return outliers
    
    def remove_outliers(self, trades: List[Dict]) -> List[Dict]:
        """Aykırı değerleri filtrele"""
        
        if len(trades) < 10:
            return trades
        
        pnls = [t.get("pnl", 0) for t in trades]
        mean_pnl = sum(pnls) / len(pnls)
        std_pnl = (sum([(p - mean_pnl)**2 for p in pnls]) / len(pnls)) ** 0.5
        
        filtered_trades = []
        removed_count = 0
        
        for trade in trades:
            pnl = trade.get("pnl", 0)
            if abs(pnl - mean_pnl) < self.outlier_std_threshold * std_pnl:
                filtered_trades.append(trade)
            else:
                removed_count += 1
                print(f"⚠️ Outlier çıkarıldı: {trade['symbol']} P&L: ${pnl:.2f}")
        
        if removed_count > 0:
            print(f"📊 {removed_count} aykırı değer çıkarıldı. Kalan: {len(filtered_trades)} işlem")
        
        return filtered_trades
    
    def split_train_validation(self, trades: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """Veriyi train/validation olarak ayır"""
        
        # Son %20'yi validation için ayır
        split_index = int(len(trades) * (1 - self.validation_ratio))
        
        train_trades = trades[:split_index]
        validation_trades = trades[split_index:]
        
        print(f"\n📊 Veri bölünmesi:")
        print(f"  Train: {len(train_trades)} işlem")
        print(f"  Validation: {len(validation_trades)} işlem")
        
        return train_trades, validation_trades
    
    def validate_finetuned_model(self, model_name: str, validation_trades: List[Dict]) -> Tuple[bool, float]:
        """Fine-tuned model'i validation set ile test et"""
        
        print(f"\n🧪 Model validation testi: {model_name}")
        
        # TODO: Gerçek model testi (LLM ile pattern tahmin et)
        # Şimdilik mock accuracy
        
        # Basit simülasyon: %60-80 arası random accuracy
        accuracy = 0.60 + random.random() * 0.20
        
        print(f"📊 Validation Accuracy: %{accuracy*100:.0f}")
        
        if accuracy < self.min_validation_accuracy:
            print(f"❌ Validation başarısız! Minimum %{self.min_validation_accuracy*100:.0f} gerekli.")
            return False, accuracy
        
        print(f"✅ Validation başarılı!")
        return True, accuracy
    
    def gradual_rollout_percentage(self, days_since_finetuning: int) -> float:
        """Kademeli geçiş yüzdesi"""
        
        if days_since_finetuning < 3:
            return 0.25  # İlk 3 gün: %25
        elif days_since_finetuning < 6:
            return 0.50  # Sonraki 3 gün: %50
        elif days_since_finetuning < 7:
            return 0.75  # Son 1 gün: %75
        else:
            return 1.0  # 1 hafta sonra: %100
    
    def should_use_finetuned_model(self, days_since_finetuning: int) -> bool:
        """Fine-tuned model kullanılmalı mı? (gradual rollout)"""
        
        percentage = self.gradual_rollout_percentage(days_since_finetuning)
        use_finetuned = random.random() < percentage
        
        if use_finetuned:
            print(f"🎯 Fine-tuned model kullanılıyor (%{percentage*100:.0f} rollout)")
        else:
            print(f"🎯 Base model kullanılıyor (%{percentage*100:.0f} rollout)")
        
        return use_finetuned
    
    def monitor_performance(self) -> Tuple[bool, Dict]:
        """Performans izleme - düşüş var mı?"""
        
        print("\n📊 Performans izleme...")
        
        # Son 3 günün işlemleri (fine-tuned model)
        recent_trades = self._get_recent_trades(days=3)
        
        if len(recent_trades) < 5:
            print("ℹ️ Yetersiz veri, izleme yapılamıyor")
            return True, {"status": "insufficient_data"}
        
        recent_win_rate = self._calculate_win_rate(recent_trades)
        
        # Önceki 7 günün işlemleri (base model)
        previous_trades = self._get_previous_trades(days=7, offset=3)
        
        if len(previous_trades) < 10:
            print("ℹ️ Karşılaştırma için yetersiz veri")
            return True, {"status": "insufficient_comparison_data"}
        
        previous_win_rate = self._calculate_win_rate(previous_trades)
        
        print(f"📈 Önceki başarı oranı: %{previous_win_rate*100:.0f}")
        print(f"📈 Şimdiki başarı oranı: %{recent_win_rate*100:.0f}")
        
        # %10'dan fazla düşüş var mı?
        if recent_win_rate < previous_win_rate - 0.10:
            print(f"🚨 PERFORMANS DÜŞÜŞÜ TESPİT EDİLDİ!")
            print(f"Düşüş: %{(previous_win_rate - recent_win_rate)*100:.0f}")
            
            # Dashboard'a bildirim
            self.dashboard.send_notification({
                "type": "PERFORMANCE_DROP",
                "title": "Performans Düşüşü",
                "message": f"Fine-tuned model performansı %{(previous_win_rate - recent_win_rate)*100:.0f} düştü. Base model'e dönülüyor.",
                "severity": "WARNING"
            })
            
            return False, {
                "status": "performance_drop",
                "previous_win_rate": previous_win_rate,
                "recent_win_rate": recent_win_rate,
                "drop": previous_win_rate - recent_win_rate
            }
        
        print(f"✅ Performans normal")
        return True, {
            "status": "ok",
            "previous_win_rate": previous_win_rate,
            "recent_win_rate": recent_win_rate
        }
    
    def _get_recent_trades(self, days: int) -> List[Dict]:
        """Son N günün işlemlerini al"""
        # TODO: Dashboard API entegrasyonu
        # return self.dashboard.get_trades(days=days)
        return []
    
    def _get_previous_trades(self, days: int, offset: int) -> List[Dict]:
        """Önceki N günün işlemlerini al (offset gün öncesinden başlayarak)"""
        # TODO: Dashboard API entegrasyonu
        # return self.dashboard.get_trades(days=days, offset=offset)
        return []
    
    def rollback_to_base_model(self):
        """Base model'e geri dön"""
        
        print("\n🔄 Base model'e geri dönülüyor...")
        
        # Fine-tuned model dosyasını sil
        model_file = os.path.join(BASE_DIR, "fine_tuned_model.json")
        
        if os.path.exists(model_file):
            os.remove(model_file)
            print("✅ Fine-tuned model kaldırıldı")
        
        # Dashboard'a bildirim
        self.dashboard.send_notification({
            "type": "MODEL_ROLLBACK",
            "title": "Model Geri Alındı",
            "message": "Fine-tuned model performansı düştü. Base model'e dönüldü.",
            "severity": "INFO"
        })
        
        print("✅ Base model aktif")


# Test
if __name__ == "__main__":
    safety = FineTuningSafety()
    
    # Mock trade data
    mock_trades = [
        {"pattern": "FVG + OB", "result": "WIN", "pnl": 80, "symbol": "BTCUSDT"},
        {"pattern": "FVG + OB", "result": "WIN", "pnl": 90, "symbol": "BTCUSDT"},
        {"pattern": "FVG + OB", "result": "LOSS", "pnl": -30, "symbol": "BTCUSDT"},
        {"pattern": "Liquidity Sweep", "result": "WIN", "pnl": 70, "symbol": "ETHUSDT"},
        {"pattern": "Liquidity Sweep", "result": "WIN", "pnl": 85, "symbol": "ETHUSDT"},
        {"pattern": "Liquidity Sweep", "result": "LOSS", "pnl": -25, "symbol": "ETHUSDT"},
        {"pattern": "BOS", "result": "WIN", "pnl": 95, "symbol": "BTCUSDT"},
        {"pattern": "BOS", "result": "WIN", "pnl": 88, "symbol": "BTCUSDT"},
        {"pattern": "BOS", "result": "LOSS", "pnl": -28, "symbol": "BTCUSDT"},
        {"pattern": "FVG", "result": "WIN", "pnl": 500, "symbol": "BTCUSDT"},  # Outlier
    ]
    
    # Güvenlik kontrolü
    is_safe, reason = safety.validate_before_finetuning(mock_trades)
    print(f"\nSonuç: {is_safe} - {reason}")
    
    # Outlier temizleme
    clean_trades = safety.remove_outliers(mock_trades)
    
    # Train/validation split
    train, val = safety.split_train_validation(clean_trades)
    
    # Model validation
    is_valid, accuracy = safety.validate_finetuned_model("ft:gpt-4o:test", val)
    
    # Gradual rollout
    for day in range(10):
        percentage = safety.gradual_rollout_percentage(day)
        print(f"Gün {day}: %{percentage*100:.0f} rollout")
