"""
Checkpoint Manager: Training Data Checkpoint Yönetimi
İptal edilen fine-tuning verilerini kaydet ve kurtarma stratejisi
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional


class CheckpointManager:
    """Training data checkpoint yönetimi"""
    
    def __init__(self):
        self.checkpoint_dir = "/home/ubuntu/ai-crypto-trader-dashboard/ai_bot/checkpoints"
        os.makedirs(self.checkpoint_dir, exist_ok=True)
    
    def save_checkpoint(self, trades: List[Dict], metadata: Dict) -> str:
        """Training data checkpoint'i kaydet"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        checkpoint_id = f"checkpoint_{timestamp}"
        
        checkpoint_data = {
            "checkpoint_id": checkpoint_id,
            "created_at": datetime.now().isoformat(),
            "trades": trades,
            "metadata": {
                "total_trades": len(trades),
                "win_rate": metadata.get("win_rate", 0),
                "patterns": metadata.get("patterns", []),
                "estimated_cost": metadata.get("estimated_cost", 0),
                "status": metadata.get("status", "pending")  # pending, completed, cancelled
            }
        }
        
        # JSON dosyası olarak kaydet
        checkpoint_path = f"{self.checkpoint_dir}/{checkpoint_id}.json"
        with open(checkpoint_path, "w") as f:
            json.dump(checkpoint_data, f, indent=2)
        
        print(f"✅ Checkpoint kaydedildi: {checkpoint_id}")
        print(f"   - İşlem sayısı: {len(trades)}")
        print(f"   - Win rate: {metadata.get('win_rate', 0):.1%}")
        print(f"   - Tahmini maliyet: ${metadata.get('estimated_cost', 0):.2f}")
        
        # Bildirim gönder
        try:
            from dashboard_client import DashboardClient
            dashboard = DashboardClient()
            dashboard.send_checkpoint_saved(
                checkpoint_id,
                len(trades),
                metadata.get('estimated_cost', 0)
            )
        except Exception as e:
            print(f"⚠️ Bildirim gönderme hatası: {e}")
        
        return checkpoint_id
    
    def load_checkpoint(self, checkpoint_id: str) -> Optional[Dict]:
        """Checkpoint'i yükle"""
        
        checkpoint_path = f"{self.checkpoint_dir}/{checkpoint_id}.json"
        
        if not os.path.exists(checkpoint_path):
            print(f"❌ Checkpoint bulunamadı: {checkpoint_id}")
            return None
        
        with open(checkpoint_path, "r") as f:
            checkpoint_data = json.load(f)
        
        print(f"✅ Checkpoint yüklendi: {checkpoint_id}")
        return checkpoint_data
    
    def list_checkpoints(self) -> List[Dict]:
        """Tüm checkpoint'leri listele"""
        
        checkpoints = []
        
        for filename in os.listdir(self.checkpoint_dir):
            if filename.endswith(".json"):
                checkpoint_id = filename.replace(".json", "")
                checkpoint_data = self.load_checkpoint(checkpoint_id)
                if checkpoint_data:
                    checkpoints.append(checkpoint_data)
        
        # Tarihe göre sırala (en yeni önce)
        checkpoints.sort(key=lambda x: x["created_at"], reverse=True)
        
        return checkpoints
    
    def update_checkpoint_status(self, checkpoint_id: str, status: str):
        """Checkpoint durumunu güncelle"""
        
        checkpoint_path = f"{self.checkpoint_dir}/{checkpoint_id}.json"
        
        if not os.path.exists(checkpoint_path):
            print(f"❌ Checkpoint bulunamadı: {checkpoint_id}")
            return
        
        with open(checkpoint_path, "r") as f:
            checkpoint_data = json.load(f)
        
        checkpoint_data["metadata"]["status"] = status
        checkpoint_data["metadata"]["updated_at"] = datetime.now().isoformat()
        
        with open(checkpoint_path, "w") as f:
            json.dump(checkpoint_data, f, indent=2)
        
        print(f"📝 Checkpoint durumu güncellendi: {checkpoint_id} → {status}")
    
    def delete_checkpoint(self, checkpoint_id: str):
        """Checkpoint'i sil"""
        
        checkpoint_path = f"{self.checkpoint_dir}/{checkpoint_id}.json"
        
        if not os.path.exists(checkpoint_path):
            print(f"❌ Checkpoint bulunamadı: {checkpoint_id}")
            return
        
        os.remove(checkpoint_path)
        print(f"🗑️ Checkpoint silindi: {checkpoint_id}")
    
    def get_last_successful_checkpoint(self) -> Optional[Dict]:
        """Son başarılı checkpoint'i bul"""
        
        checkpoints = self.list_checkpoints()
        
        for checkpoint in checkpoints:
            if checkpoint["metadata"]["status"] == "completed":
                return checkpoint
        
        return None
    
    def get_cancelled_checkpoints(self) -> List[Dict]:
        """İptal edilen checkpoint'leri bul"""
        
        checkpoints = self.list_checkpoints()
        
        cancelled = [
            cp for cp in checkpoints
            if cp["metadata"]["status"] == "cancelled"
        ]
        
        return cancelled
    
    def get_checkpoint_stats(self) -> Dict:
        """Checkpoint istatistikleri"""
        
        checkpoints = self.list_checkpoints()
        
        total = len(checkpoints)
        completed = sum(1 for cp in checkpoints if cp["metadata"]["status"] == "completed")
        cancelled = sum(1 for cp in checkpoints if cp["metadata"]["status"] == "cancelled")
        pending = sum(1 for cp in checkpoints if cp["metadata"]["status"] == "pending")
        
        total_trades = sum(cp["metadata"]["total_trades"] for cp in checkpoints)
        
        return {
            "total_checkpoints": total,
            "completed": completed,
            "cancelled": cancelled,
            "pending": pending,
            "total_trades": total_trades
        }


# Test
if __name__ == "__main__":
    manager = CheckpointManager()
    
    # Mock trade data
    mock_trades = [
        {
            "id": "trade_1",
            "symbol": "BTCUSDT",
            "pattern": "FVG + OB",
            "confidence": 0.85,
            "direction": "LONG",
            "entry": 45000,
            "stop_loss": 44100,
            "take_profit": 47700,
            "result": "WIN",
            "pnl": 800
        },
        {
            "id": "trade_2",
            "symbol": "ETHUSDT",
            "pattern": "Liquidity Sweep",
            "confidence": 0.75,
            "direction": "SHORT",
            "entry": 2500,
            "stop_loss": 2550,
            "take_profit": 2350,
            "result": "LOSS",
            "pnl": -150
        }
    ]
    
    # Checkpoint kaydet
    checkpoint_id = manager.save_checkpoint(
        trades=mock_trades,
        metadata={
            "win_rate": 0.65,
            "patterns": ["FVG + OB", "Liquidity Sweep"],
            "estimated_cost": 5.50,
            "status": "pending"
        }
    )
    
    # Checkpoint'leri listele
    print("\n📋 Checkpoint Listesi:")
    checkpoints = manager.list_checkpoints()
    for cp in checkpoints:
        print(f"   - {cp['checkpoint_id']}: {cp['metadata']['status']} ({cp['metadata']['total_trades']} işlem)")
    
    # İstatistikler
    print("\n📊 Checkpoint İstatistikleri:")
    stats = manager.get_checkpoint_stats()
    print(f"   - Toplam: {stats['total_checkpoints']}")
    print(f"   - Başarılı: {stats['completed']}")
    print(f"   - İptal: {stats['cancelled']}")
    print(f"   - Beklemede: {stats['pending']}")
    print(f"   - Toplam işlem: {stats['total_trades']}")
