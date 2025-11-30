"""
Learning System A: Prompt Güncelleme Sistemi
Haftalık analiz yapıp pattern bilgilerini günceller
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List
from dashboard_client import DashboardClient

class PromptLearningSystem:
    """Seçenek A: Basit prompt güncelleme ile öğrenme"""
    
    def __init__(self):
        self.dashboard = DashboardClient()
        self.model_version = "v1.0"
        self.learned_rules = []
    
    def weekly_analysis(self) -> Dict:
        """Haftalık analiz yap"""
        
        print("\n🔍 Haftalık analiz başlıyor...")
        
        # Son 7 günün işlemlerini al (Dashboard API'den)
        trades = self._get_last_week_trades()
        
        if len(trades) < 10:
            print(f"⚠️ Yetersiz veri ({len(trades)} işlem). En az 10 işlem gerekli.")
            return {"success": False, "reason": "Yetersiz veri"}
        
        # Pattern başarı analizi
        pattern_stats = self._analyze_pattern_success(trades)
        
        # Sentiment analizi
        sentiment_stats = self._analyze_sentiment_accuracy(trades)
        
        # Timeframe analizi
        timeframe_stats = self._analyze_timeframe_performance(trades)
        
        # Yeni kurallar oluştur
        new_rules = self._generate_new_rules(pattern_stats, sentiment_stats, timeframe_stats)
        
        # Prompt'u güncelle
        updated_prompt = self._update_prompt(new_rules)
        
        # Model versiyonunu yükselt
        self._increment_version()
        
        print(f"✅ Analiz tamamlandı! Model: {self.model_version}")
        print(f"📊 Toplam işlem: {len(trades)}")
        print(f"📈 Yeni kural sayısı: {len(new_rules)}")
        
        return {
            "success": True,
            "model_version": self.model_version,
            "total_trades": len(trades),
            "new_rules": new_rules,
            "pattern_stats": pattern_stats,
            "sentiment_stats": sentiment_stats
        }
    
    def _get_last_week_trades(self) -> List[Dict]:
        """Son 7 günün işlemlerini al (mock - gerçekte Dashboard API'den gelecek)"""
        # TODO: Dashboard API entegrasyonu
        # return self.dashboard.get_trades(days=7)
        
        # Şimdilik mock data
        return []
    
    def _analyze_pattern_success(self, trades: List[Dict]) -> Dict:
        """Pattern başarı oranlarını analiz et"""
        
        pattern_results = {}
        
        for trade in trades:
            pattern = trade.get("pattern", "UNKNOWN")
            result = trade.get("result", "UNKNOWN")  # WIN/LOSS
            
            if pattern not in pattern_results:
                pattern_results[pattern] = {"win": 0, "loss": 0, "total": 0}
            
            pattern_results[pattern]["total"] += 1
            if result == "WIN":
                pattern_results[pattern]["win"] += 1
            else:
                pattern_results[pattern]["loss"] += 1
        
        # Başarı oranlarını hesapla
        for pattern, stats in pattern_results.items():
            stats["success_rate"] = stats["win"] / stats["total"] if stats["total"] > 0 else 0
        
        return pattern_results
    
    def _analyze_sentiment_accuracy(self, trades: List[Dict]) -> Dict:
        """Sentiment doğruluğunu analiz et"""
        
        sentiment_ranges = {
            "very_positive": {"min": 0.5, "max": 1.0, "win": 0, "total": 0},
            "positive": {"min": 0.2, "max": 0.5, "win": 0, "total": 0},
            "neutral": {"min": -0.2, "max": 0.2, "win": 0, "total": 0},
            "negative": {"min": -0.5, "max": -0.2, "win": 0, "total": 0},
            "very_negative": {"min": -1.0, "max": -0.5, "win": 0, "total": 0}
        }
        
        for trade in trades:
            sentiment = trade.get("sentiment", 0)
            result = trade.get("result", "UNKNOWN")
            
            # Hangi range'e düşüyor?
            for range_name, range_data in sentiment_ranges.items():
                if range_data["min"] <= sentiment < range_data["max"]:
                    range_data["total"] += 1
                    if result == "WIN":
                        range_data["win"] += 1
                    break
        
        # Başarı oranlarını hesapla
        for range_name, range_data in sentiment_ranges.items():
            if range_data["total"] > 0:
                range_data["success_rate"] = range_data["win"] / range_data["total"]
            else:
                range_data["success_rate"] = 0
        
        return sentiment_ranges
    
    def _analyze_timeframe_performance(self, trades: List[Dict]) -> Dict:
        """Timeframe performansını analiz et"""
        
        timeframe_stats = {}
        
        for trade in trades:
            timeframe = trade.get("timeframe", "1h")
            result = trade.get("result", "UNKNOWN")
            
            if timeframe not in timeframe_stats:
                timeframe_stats[timeframe] = {"win": 0, "loss": 0, "total": 0}
            
            timeframe_stats[timeframe]["total"] += 1
            if result == "WIN":
                timeframe_stats[timeframe]["win"] += 1
            else:
                timeframe_stats[timeframe]["loss"] += 1
        
        # Başarı oranlarını hesapla
        for tf, stats in timeframe_stats.items():
            stats["success_rate"] = stats["win"] / stats["total"] if stats["total"] > 0 else 0
        
        return timeframe_stats
    
    def _generate_new_rules(self, pattern_stats: Dict, sentiment_stats: Dict, timeframe_stats: Dict) -> List[str]:
        """Yeni kurallar oluştur"""
        
        rules = []
        
        # Pattern kuralları
        for pattern, stats in pattern_stats.items():
            if stats["success_rate"] > 0.80 and stats["total"] >= 3:
                rules.append(f"✅ {pattern} pattern'i çok başarılı (%{stats['success_rate']*100:.0f}). Güven skorunu +10% artır.")
            elif stats["success_rate"] < 0.40 and stats["total"] >= 3:
                rules.append(f"❌ {pattern} pattern'i başarısız (%{stats['success_rate']*100:.0f}). Güven skorunu -15% azalt veya kullanma.")
        
        # Sentiment kuralları
        for range_name, range_data in sentiment_stats.items():
            if range_data["total"] >= 3:
                if range_data["success_rate"] > 0.75:
                    rules.append(f"✅ {range_name} sentiment'te işlem başarılı (%{range_data['success_rate']*100:.0f}). Bu aralıkta işlem aç.")
                elif range_data["success_rate"] < 0.40:
                    rules.append(f"❌ {range_name} sentiment'te işlem başarısız (%{range_data['success_rate']*100:.0f}). Bu aralıkta işlem açma.")
        
        # Timeframe kuralları
        for tf, stats in timeframe_stats.items():
            if stats["success_rate"] > 0.75 and stats["total"] >= 5:
                rules.append(f"✅ {tf} timeframe'de işlemler başarılı (%{stats['success_rate']*100:.0f}). Bu timeframe'i önceliklendir.")
            elif stats["success_rate"] < 0.40 and stats["total"] >= 5:
                rules.append(f"❌ {tf} timeframe'de işlemler başarısız (%{stats['success_rate']*100:.0f}). Bu timeframe'den kaçın.")
        
        return rules
    
    def _update_prompt(self, new_rules: List[str]) -> str:
        """Prompt'u yeni kurallarla güncelle"""
        
        # Yeni kuralları kaydet
        self.learned_rules.extend(new_rules)
        
        # Prompt'a eklenecek bölüm
        learned_section = "\n\n=== ÖĞRENİLEN KURALLAR (Gerçek İşlem Verilerinden) ===\n\n"
        learned_section += "\n".join(self.learned_rules)
        
        # pattern_knowledge.py'ye ekle (dosyaya yaz)
        with open("/home/ubuntu/ai-crypto-trader-dashboard/ai_bot/learned_rules.txt", "w") as f:
            f.write(learned_section)
        
        print(f"📝 Yeni kurallar learned_rules.txt dosyasına kaydedildi")
        
        return learned_section
    
    def _increment_version(self):
        """Model versiyonunu yükselt"""
        
        # v1.0 → v1.1 → v1.2 → v1.3
        current = float(self.model_version.replace("v", ""))
        new_version = current + 0.1
        self.model_version = f"v{new_version:.1f}"
        
        # Versiyonu kaydet
        with open("/home/ubuntu/ai-crypto-trader-dashboard/ai_bot/model_version.txt", "w") as f:
            f.write(self.model_version)
    
    def get_learned_rules(self) -> str:
        """Öğrenilen kuralları döndür (prompt'a eklenecek)"""
        
        try:
            with open("/home/ubuntu/ai-crypto-trader-dashboard/ai_bot/learned_rules.txt", "r") as f:
                return f.read()
        except FileNotFoundError:
            return ""
    
    def get_model_version(self) -> str:
        """Güncel model versiyonunu döndür"""
        
        try:
            with open("/home/ubuntu/ai-crypto-trader-dashboard/ai_bot/model_version.txt", "r") as f:
                return f.read().strip()
        except FileNotFoundError:
            return "v1.0"


# Test
if __name__ == "__main__":
    system = PromptLearningSystem()
    
    # Mock trade data
    mock_trades = [
        {"pattern": "FVG + OB", "result": "WIN", "sentiment": 0.7, "timeframe": "1h"},
        {"pattern": "FVG + OB", "result": "WIN", "sentiment": 0.6, "timeframe": "1h"},
        {"pattern": "FVG + OB", "result": "WIN", "sentiment": 0.8, "timeframe": "1h"},
        {"pattern": "Liquidity Sweep", "result": "LOSS", "sentiment": -0.2, "timeframe": "5m"},
        {"pattern": "Liquidity Sweep", "result": "LOSS", "sentiment": -0.1, "timeframe": "5m"},
        {"pattern": "BOS", "result": "WIN", "sentiment": 0.5, "timeframe": "4h"},
        {"pattern": "BOS", "result": "WIN", "sentiment": 0.6, "timeframe": "4h"},
        {"pattern": "BOS", "result": "LOSS", "sentiment": 0.3, "timeframe": "4h"},
        {"pattern": "FVG", "result": "WIN", "sentiment": 0.4, "timeframe": "1h"},
        {"pattern": "FVG", "result": "WIN", "sentiment": 0.5, "timeframe": "1h"},
    ]
    
    # Analiz yap
    result = system.weekly_analysis()
    print(json.dumps(result, indent=2))
