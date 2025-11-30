"""
Incremental Fine-Tuning: Eski ve yeni veriyi birleştir
İptal edilen checkpoint'lerdeki veriyi kurtarma stratejisi
"""

from typing import Dict, List
from checkpoint_manager import CheckpointManager
from finetuning_safety import FineTuningSafety


class IncrementalFineTuning:
    """Incremental fine-tuning: Eski veriyi koru, yeni veriyi ekle"""
    
    def __init__(self):
        self.checkpoint_manager = CheckpointManager()
        self.safety = FineTuningSafety()
    
    def prepare_incremental_training_data(self, new_trades: List[Dict]) -> List[Dict]:
        """Yeni veriyi eski checkpoint'lerle birleştir"""
        
        print("\n🔄 Incremental training data hazırlanıyor...")
        
        # 1. Son başarılı checkpoint'i bul
        last_checkpoint = self.checkpoint_manager.get_last_successful_checkpoint()
        
        old_trades = []
        if last_checkpoint:
            old_trades = last_checkpoint["trades"]
            print(f"✅ Son başarılı checkpoint: {last_checkpoint['checkpoint_id']}")
            print(f"   - Eski veri: {len(old_trades)} işlem")
        else:
            print("ℹ️ Önceki checkpoint yok. Sadece yeni veri kullanılacak.")
        
        # 2. İptal edilen checkpoint'leri bul
        cancelled_checkpoints = self.checkpoint_manager.get_cancelled_checkpoints()
        
        if cancelled_checkpoints:
            print(f"✅ {len(cancelled_checkpoints)} iptal edilmiş checkpoint bulundu:")
            for cp in cancelled_checkpoints:
                cp_trades = cp["trades"]
                old_trades.extend(cp_trades)
                print(f"   - {cp['checkpoint_id']}: {len(cp_trades)} işlem kurtarıldı")
        
        # 3. Yeni veriyi ekle
        all_trades = old_trades + new_trades
        print(f"✅ Yeni veri eklendi: {len(new_trades)} işlem")
        print(f"📊 Toplam (birleştirme öncesi): {len(all_trades)} işlem")
        
        # 4. Duplicate'leri temizle
        all_trades = self._remove_duplicates(all_trades)
        
        # 5. Kalite filtresi uygula
        all_trades = self._filter_low_quality_trades(all_trades)
        
        print(f"✅ Incremental training data hazır: {len(all_trades)} işlem")
        
        return all_trades
    
    def _remove_duplicates(self, trades: List[Dict]) -> List[Dict]:
        """Duplicate işlemleri temizle"""
        
        seen_ids = set()
        unique_trades = []
        
        for trade in trades:
            # Trade ID veya entry_time kullan
            trade_id = trade.get("id") or f"{trade.get('symbol')}_{trade.get('entry_time')}"
            
            if trade_id not in seen_ids:
                seen_ids.add(trade_id)
                unique_trades.append(trade)
        
        removed_count = len(trades) - len(unique_trades)
        if removed_count > 0:
            print(f"🗑️ {removed_count} duplicate işlem temizlendi")
        
        return unique_trades
    
    def _filter_low_quality_trades(self, trades: List[Dict]) -> List[Dict]:
        """Düşük kaliteli işlemleri filtrele"""
        
        filtered_trades = []
        
        for trade in trades:
            # 1. Confidence kontrolü
            if trade.get("confidence", 0) < 0.5:
                continue
            
            # 2. Eksik veri kontrolü
            required_fields = ["pattern", "direction", "entry", "stop_loss", "result"]
            if not all(field in trade for field in required_fields):
                continue
            
            # 3. Outlier kontrolü
            if self._is_outlier(trade, trades):
                continue
            
            filtered_trades.append(trade)
        
        removed_count = len(trades) - len(filtered_trades)
        if removed_count > 0:
            print(f"🗑️ {removed_count} düşük kaliteli işlem temizlendi")
        
        return filtered_trades
    
    def _is_outlier(self, trade: Dict, all_trades: List[Dict]) -> bool:
        """Outlier kontrolü (3 standart sapma)"""
        
        pnls = [t.get("pnl", 0) for t in all_trades if "pnl" in t]
        
        if len(pnls) < 10:
            return False  # Yeterli veri yok, outlier kontrolü yapma
        
        mean_pnl = sum(pnls) / len(pnls)
        variance = sum((x - mean_pnl) ** 2 for x in pnls) / len(pnls)
        std_pnl = variance ** 0.5
        
        trade_pnl = trade.get("pnl", 0)
        
        # 3 standart sapma dışındaysa outlier
        return abs(trade_pnl - mean_pnl) > 3 * std_pnl
    
    def merge_checkpoints(self, checkpoint_ids: List[str]) -> str:
        """Birden fazla checkpoint'i birleştir"""
        
        print(f"\n🔀 {len(checkpoint_ids)} checkpoint birleştiriliyor...")
        
        all_trades = []
        total_win_rate = 0
        all_patterns = set()
        total_cost = 0
        
        for checkpoint_id in checkpoint_ids:
            checkpoint = self.checkpoint_manager.load_checkpoint(checkpoint_id)
            
            if not checkpoint:
                print(f"⚠️ Checkpoint yüklenemedi: {checkpoint_id}")
                continue
            
            trades = checkpoint["trades"]
            all_trades.extend(trades)
            
            total_win_rate += checkpoint["metadata"]["win_rate"]
            all_patterns.update(checkpoint["metadata"]["patterns"])
            total_cost += checkpoint["metadata"]["estimated_cost"]
            
            print(f"   - {checkpoint_id}: {len(trades)} işlem eklendi")
        
        # Duplicate temizle
        all_trades = self._remove_duplicates(all_trades)
        
        # Kalite filtresi
        all_trades = self._filter_low_quality_trades(all_trades)
        
        # Yeni checkpoint oluştur
        avg_win_rate = total_win_rate / len(checkpoint_ids)
        
        merged_checkpoint_id = self.checkpoint_manager.save_checkpoint(
            trades=all_trades,
            metadata={
                "win_rate": avg_win_rate,
                "patterns": list(all_patterns),
                "estimated_cost": total_cost,
                "status": "completed",
                "merged_from": checkpoint_ids
            }
        )
        
        print(f"✅ Checkpoint'ler birleştirildi: {merged_checkpoint_id}")
        print(f"   - Toplam işlem: {len(all_trades)}")
        print(f"   - Ortalama win rate: {avg_win_rate:.1%}")
        
        return merged_checkpoint_id


# Test
if __name__ == "__main__":
    incremental = IncrementalFineTuning()
    
    # Mock new trades
    new_trades = [
        {
            "id": "trade_3",
            "symbol": "BTCUSDT",
            "pattern": "BOS",
            "confidence": 0.80,
            "direction": "LONG",
            "entry": 46000,
            "stop_loss": 45500,
            "take_profit": 47500,
            "result": "WIN",
            "pnl": 500,
            "entry_time": "2024-11-30T10:00:00"
        }
    ]
    
    # Incremental training data hazırla
    all_trades = incremental.prepare_incremental_training_data(new_trades)
    
    print(f"\n📊 Final Training Data: {len(all_trades)} işlem")
