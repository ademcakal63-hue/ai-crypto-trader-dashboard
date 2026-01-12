"""
Performance Monitor: Model performansını izle ve karşılaştır
Base model vs Fine-tuned model performans takibi
Otomatik rollback mekanizması
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

def parse_datetime_naive(dt_string: str) -> datetime:
    """Parse datetime string and ensure it's timezone-naive"""
    dt = datetime.fromisoformat(dt_string.replace('Z', '+00:00'))
    if dt.tzinfo is not None:
        dt = dt.replace(tzinfo=None)
    return dt

from dashboard_client import DashboardClient
from gradual_rollout import GradualRollout

# Base directory - works on both sandbox and VPS
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class PerformanceMonitor:
    """Model performans izleme ve karşılaştırma"""
    
    # Performans eşikleri
    MIN_WIN_RATE_DROP = 0.10  # %10 düşüş = rollback
    MIN_TRADES_FOR_COMPARISON = 20  # En az 20 işlem gerekli
    
    def __init__(self):
        self.performance_file = os.path.join(BASE_DIR, "performance_tracking.json")
        self.dashboard = DashboardClient()
        self.rollout = GradualRollout()
        self._load_performance_data()
    
    def _load_performance_data(self):
        """Performans verilerini yükle"""
        
        if os.path.exists(self.performance_file):
            with open(self.performance_file, "r") as f:
                self.performance_data = json.load(f)
        else:
            self.performance_data = {
                "base_model": {
                    "trades": [],
                    "win_rate": 0,
                    "avg_pnl": 0
                },
                "finetuned_model": {
                    "trades": [],
                    "win_rate": 0,
                    "avg_pnl": 0
                },
                "comparisons": []
            }
    
    def _save_performance_data(self):
        """Performans verilerini kaydet"""
        
        with open(self.performance_file, "w") as f:
            json.dump(self.performance_data, f, indent=2)
    
    def record_trade(self, trade: Dict, model_used: str):
        """İşlem sonucunu kaydet"""
        
        trade_record = {
            "id": trade.get("id"),
            "date": datetime.now().isoformat(),
            "model": model_used,
            "pattern": trade.get("pattern"),
            "result": trade.get("result"),  # WIN/LOSS
            "pnl": trade.get("pnl", 0),
            "confidence": trade.get("confidence", 0)
        }
        
        # Model tipine göre kaydet
        if "fine-tuned" in model_used.lower() or "ft:" in model_used:
            self.performance_data["finetuned_model"]["trades"].append(trade_record)
        else:
            self.performance_data["base_model"]["trades"].append(trade_record)
        
        self._save_performance_data()
    
    def calculate_win_rate(self, trades: List[Dict]) -> float:
        """Win rate hesapla"""
        
        if not trades:
            return 0.0
        
        wins = sum(1 for t in trades if t.get("result") == "WIN")
        return wins / len(trades)
    
    def calculate_avg_pnl(self, trades: List[Dict]) -> float:
        """Ortalama P&L hesapla"""
        
        if not trades:
            return 0.0
        
        total_pnl = sum(t.get("pnl", 0) for t in trades)
        return total_pnl / len(trades)
    
    def get_recent_trades(self, model_type: str, days: int = 7) -> List[Dict]:
        """Son N gündeki işlemleri getir"""
        
        cutoff_date = datetime.now() - timedelta(days=days)
        
        if model_type == "base":
            trades = self.performance_data["base_model"]["trades"]
        else:
            trades = self.performance_data["finetuned_model"]["trades"]
        
        recent_trades = [
            t for t in trades
            if parse_datetime_naive(t["date"]) >= cutoff_date
        ]
        
        return recent_trades
    
    def compare_performance(self, days: int = 7) -> Dict:
        """Base model vs Fine-tuned model performans karşılaştırması"""
        
        print(f"\n📊 Performans Karşılaştırması (Son {days} gün)...")
        
        # Son N gündeki işlemler
        base_trades = self.get_recent_trades("base", days)
        finetuned_trades = self.get_recent_trades("finetuned", days)
        
        # Yeterli veri var mı?
        if len(base_trades) < self.MIN_TRADES_FOR_COMPARISON:
            print(f"⚠️ Base model için yetersiz veri ({len(base_trades)} işlem)")
            return {"sufficient_data": False, "reason": "Not enough base model trades"}
        
        if len(finetuned_trades) < self.MIN_TRADES_FOR_COMPARISON:
            print(f"⚠️ Fine-tuned model için yetersiz veri ({len(finetuned_trades)} işlem)")
            return {"sufficient_data": False, "reason": "Not enough fine-tuned model trades"}
        
        # Performans metrikleri
        base_win_rate = self.calculate_win_rate(base_trades)
        finetuned_win_rate = self.calculate_win_rate(finetuned_trades)
        
        base_avg_pnl = self.calculate_avg_pnl(base_trades)
        finetuned_avg_pnl = self.calculate_avg_pnl(finetuned_trades)
        
        # Performans farkı
        win_rate_diff = finetuned_win_rate - base_win_rate
        pnl_diff = finetuned_avg_pnl - base_avg_pnl
        
        comparison = {
            "sufficient_data": True,
            "date": datetime.now().isoformat(),
            "days": days,
            "base_model": {
                "trades": len(base_trades),
                "win_rate": base_win_rate,
                "avg_pnl": base_avg_pnl
            },
            "finetuned_model": {
                "trades": len(finetuned_trades),
                "win_rate": finetuned_win_rate,
                "avg_pnl": finetuned_avg_pnl
            },
            "difference": {
                "win_rate": win_rate_diff,
                "avg_pnl": pnl_diff
            },
            "performance_drop": win_rate_diff < -self.MIN_WIN_RATE_DROP
        }
        
        # Karşılaştırmayı kaydet
        self.performance_data["comparisons"].append(comparison)
        self._save_performance_data()
        
        # Sonuçları yazdır
        print(f"\n📊 Base Model:")
        print(f"   - İşlem sayısı: {len(base_trades)}")
        print(f"   - Win rate: {base_win_rate:.1%}")
        print(f"   - Avg P&L: ${base_avg_pnl:.2f}")
        
        print(f"\n📊 Fine-tuned Model:")
        print(f"   - İşlem sayısı: {len(finetuned_trades)}")
        print(f"   - Win rate: {finetuned_win_rate:.1%}")
        print(f"   - Avg P&L: ${finetuned_avg_pnl:.2f}")
        
        print(f"\n📈 Fark:")
        print(f"   - Win rate: {win_rate_diff:+.1%}")
        print(f"   - Avg P&L: ${pnl_diff:+.2f}")
        
        return comparison
    
    def check_and_rollback_if_needed(self) -> Tuple[bool, str]:
        """Performans düşüşü varsa otomatik rollback"""
        
        comparison = self.compare_performance(days=7)
        
        if not comparison["sufficient_data"]:
            return False, "Yetersiz veri"
        
        if comparison["performance_drop"]:
            # Performans %10'dan fazla düştü!
            win_rate_diff = comparison["difference"]["win_rate"]
            
            print(f"\n🚨 PERFORMANS DÜŞÜŞÜ TESPİT EDİLDİ!")
            print(f"   - Win rate farkı: {win_rate_diff:.1%}")
            print(f"   - Eşik: {-self.MIN_WIN_RATE_DROP:.1%}")
            print(f"\n🔄 Base model'e geri dönülüyor...")
            
            # Gradual rollout'u durdur
            self.rollout.stop_rollout()
            
            # Dashboard'a bildirim gönder
            self.dashboard.send_performance_drop_alert(
                comparison['base_model']['win_rate'],
                comparison['finetuned_model']['win_rate'],
                win_rate_diff
            )
            
            return True, "Performans düşüşü nedeniyle rollback yapıldı"
        
        else:
            print(f"\n✅ Performans normal. Fine-tuned model iyi çalışıyor.")
            return False, "Performans normal"
    
    def get_performance_summary(self) -> Dict:
        """Performans özeti"""
        
        base_trades = self.performance_data["base_model"]["trades"]
        finetuned_trades = self.performance_data["finetuned_model"]["trades"]
        
        return {
            "base_model": {
                "total_trades": len(base_trades),
                "win_rate": self.calculate_win_rate(base_trades),
                "avg_pnl": self.calculate_avg_pnl(base_trades)
            },
            "finetuned_model": {
                "total_trades": len(finetuned_trades),
                "win_rate": self.calculate_win_rate(finetuned_trades),
                "avg_pnl": self.calculate_avg_pnl(finetuned_trades)
            },
            "total_comparisons": len(self.performance_data["comparisons"]),
            "last_comparison": self.performance_data["comparisons"][-1] if self.performance_data["comparisons"] else None
        }


# Test
if __name__ == "__main__":
    monitor = PerformanceMonitor()
    
    # Mock trades - Base model
    for i in range(25):
        monitor.record_trade({
            "id": f"base_trade_{i}",
            "pattern": "FVG",
            "result": "WIN" if i % 2 == 0 else "LOSS",  # %50 win rate
            "pnl": 100 if i % 2 == 0 else -50,
            "confidence": 0.75
        }, model_used="gpt-4o-2024-08-06")
    
    # Mock trades - Fine-tuned model (daha kötü performans)
    for i in range(25):
        monitor.record_trade({
            "id": f"ft_trade_{i}",
            "pattern": "FVG",
            "result": "WIN" if i % 3 == 0 else "LOSS",  # %33 win rate (kötü!)
            "pnl": 100 if i % 3 == 0 else -50,
            "confidence": 0.75
        }, model_used="ft:gpt-4o-2024-08-06:abc123")
    
    # Performans karşılaştırması
    comparison = monitor.compare_performance(days=7)
    
    # Rollback kontrolü
    rolled_back, reason = monitor.check_and_rollback_if_needed()
    
    if rolled_back:
        print(f"\n🔄 Rollback yapıldı: {reason}")
    else:
        print(f"\n✅ Rollback gerekmedi: {reason}")
    
    # Özet
    print(f"\n📊 Performans Özeti:")
    summary = monitor.get_performance_summary()
    print(json.dumps(summary, indent=2))
