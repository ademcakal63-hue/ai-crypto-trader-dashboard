"""
Learning System B: Gerçek OpenAI Fine-Tuning
Haftalık fine-tuning job başlatıp yeni model oluşturur
"""

import json
import time
import requests
from datetime import datetime, timedelta
from typing import Dict, List
from dashboard_client import DashboardClient
from finetuning_safety import FineTuningSafety

class FineTuningSystem:
    """Seçenek B: Gerçek OpenAI fine-tuning"""
    
    def __init__(self, openai_api_key: str):
        self.openai_api_key = openai_api_key
        self.openai_base_url = "https://api.openai.com/v1"
        self.dashboard = DashboardClient()
        self.safety = FineTuningSafety()
        self.current_model = "gpt-4o-2024-08-06"  # Base model
        self.fine_tuned_model = None
        self.finetuning_date = None
    
    def weekly_finetuning(self) -> Dict:
        """Haftalık fine-tuning job başlat"""
        
        print("\n🚀 Haftalık fine-tuning başlıyor...")
        
        # 1. Training data hazırla
        trades = self._get_all_trades()
        
        if len(trades) < 50:
            print(f"⚠️ Yetersiz veri ({len(trades)} işlem). En az 50 işlem gerekli.")
            return {"success": False, "reason": "Yetersiz veri"}
        
        # 2. Güvenlik kontrolü
        is_safe, reason = self.safety.validate_before_finetuning(trades)
        
        if not is_safe:
            print(f"❌ Fine-tuning iptal edildi: {reason}")
            return {"success": False, "reason": reason}
        
        # 3. Outlier'ları temizle
        trades = self.safety.remove_outliers(trades)
        
        # 4. Train/validation split
        train_trades, validation_trades = self.safety.split_train_validation(trades)
        
        training_file_path = self._prepare_training_data(train_trades)
        
        # 2. Training dosyasını OpenAI'ya yükle
        file_id = self._upload_training_file(training_file_path)
        
        if not file_id:
            return {"success": False, "reason": "Dosya yükleme başarısız"}
        
        # 3. Fine-tuning job başlat
        job_id = self._start_finetuning_job(file_id)
        
        if not job_id:
            return {"success": False, "reason": "Job başlatma başarısız"}
        
        # 4. Job tamamlanana kadar bekle (30-60 dakika)
        fine_tuned_model = self._wait_for_completion(job_id)
        
        if not fine_tuned_model:
            return {"success": False, "reason": "Fine-tuning başarısız"}
        
        # 5. Model validation
        is_valid, accuracy = self.safety.validate_finetuned_model(
            fine_tuned_model,
            validation_trades
        )
        
        if not is_valid:
            print(f"❌ Model validation başarısız! Accuracy: %{accuracy*100:.0f}")
            return {
                "success": False,
                "reason": f"Validation accuracy too low: {accuracy:.2f}"
            }
        
        # 6. Yeni modeli kaydet
        self.fine_tuned_model = fine_tuned_model
        self.finetuning_date = datetime.now()
        self._save_model_info(fine_tuned_model)
        
        print(f"✅ Fine-tuning tamamlandı! Yeni model: {fine_tuned_model}")
        print(f"📊 Validation Accuracy: %{accuracy*100:.0f}")
        
        return {
            "success": True,
            "model": fine_tuned_model,
            "training_samples": len(train_trades),
            "validation_samples": len(validation_trades),
            "validation_accuracy": accuracy,
            "job_id": job_id
        }
    
    def _get_all_trades(self) -> List[Dict]:
        """Tüm işlemleri al (Dashboard API'den)"""
        # TODO: Dashboard API entegrasyonu
        # return self.dashboard.get_all_trades()
        
        # Şimdilik mock data
        return []
    
    def _prepare_training_data(self, trades: List[Dict]) -> str:
        """Training data hazırla (JSONL formatı)"""
        
        training_data = []
        
        for trade in trades:
            # Her işlemi JSONL formatına çevir
            example = {
                "messages": [
                    {
                        "role": "system",
                        "content": "Sen bir profesyonel crypto trader'sın. Smart Money Concept (SMC) stratejilerini kullanarak işlem yapıyorsun."
                    },
                    {
                        "role": "user",
                        "content": self._format_chart_data(trade)
                    },
                    {
                        "role": "assistant",
                        "content": json.dumps({
                            "pattern": trade["pattern"],
                            "confidence": trade["confidence"],
                            "direction": trade["direction"],
                            "entry": trade["entry"],
                            "stop_loss": trade["stop_loss"],
                            "take_profit": trade["take_profit"],
                            "result": trade["result"],  # WIN/LOSS (gerçek sonuç)
                            "pnl": trade["pnl"]
                        })
                    }
                ]
            }
            training_data.append(example)
        
        # JSONL dosyası yaz
        file_path = "/home/ubuntu/ai-crypto-trader-dashboard/ai_bot/training_data.jsonl"
        with open(file_path, "w") as f:
            for example in training_data:
                f.write(json.dumps(example) + "\n")
        
        print(f"📝 Training data hazırlandı: {len(training_data)} örnek")
        return file_path
    
    def _format_chart_data(self, trade: Dict) -> str:
        """Grafik verilerini formatla"""
        
        # Mum verilerini string'e çevir
        candles = trade.get("candles", [])
        
        prompt = f"""
Grafik Analizi:
- Symbol: {trade['symbol']}
- Timeframe: {trade['timeframe']}
- Mum Sayısı: {len(candles)}
- Sentiment: {trade['sentiment']}
- Volume: {trade.get('volume', 'N/A')}

Son 10 Mum:
{json.dumps(candles[-10:], indent=2)}

Pattern tespit et ve işlem kararı ver.
"""
        return prompt
    
    def _upload_training_file(self, file_path: str) -> str:
        """Training dosyasını OpenAI'ya yükle"""
        
        try:
            with open(file_path, "rb") as f:
                response = requests.post(
                    f"{self.openai_base_url}/files",
                    headers={"Authorization": f"Bearer {self.openai_api_key}"},
                    files={"file": f},
                    data={"purpose": "fine-tune"}
                )
            
            if response.status_code == 200:
                file_id = response.json()["id"]
                print(f"✅ Dosya yüklendi: {file_id}")
                return file_id
            else:
                print(f"❌ Dosya yükleme hatası: {response.text}")
                return None
        
        except Exception as e:
            print(f"❌ Hata: {e}")
            return None
    
    def _start_finetuning_job(self, file_id: str) -> str:
        """Fine-tuning job başlat"""
        
        try:
            response = requests.post(
                f"{self.openai_base_url}/fine_tuning/jobs",
                headers={
                    "Authorization": f"Bearer {self.openai_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "training_file": file_id,
                    "model": self.current_model,
                    "hyperparameters": {
                        "n_epochs": 3  # 3 epoch yeterli
                    }
                }
            )
            
            if response.status_code == 200:
                job_id = response.json()["id"]
                print(f"✅ Fine-tuning job başlatıldı: {job_id}")
                return job_id
            else:
                print(f"❌ Job başlatma hatası: {response.text}")
                return None
        
        except Exception as e:
            print(f"❌ Hata: {e}")
            return None
    
    def _wait_for_completion(self, job_id: str, timeout_minutes: int = 120) -> str:
        """Job tamamlanana kadar bekle"""
        
        print("⏳ Fine-tuning işlemi devam ediyor (30-60 dakika sürebilir)...")
        
        start_time = time.time()
        
        while True:
            # Timeout kontrolü
            if (time.time() - start_time) > (timeout_minutes * 60):
                print("❌ Timeout! Fine-tuning çok uzun sürdü.")
                return None
            
            try:
                response = requests.get(
                    f"{self.openai_base_url}/fine_tuning/jobs/{job_id}",
                    headers={"Authorization": f"Bearer {self.openai_api_key}"}
                )
                
                if response.status_code == 200:
                    job_data = response.json()
                    status = job_data["status"]
                    
                    if status == "succeeded":
                        fine_tuned_model = job_data["fine_tuned_model"]
                        print(f"✅ Fine-tuning tamamlandı: {fine_tuned_model}")
                        return fine_tuned_model
                    
                    elif status == "failed":
                        print(f"❌ Fine-tuning başarısız: {job_data.get('error', 'Bilinmeyen hata')}")
                        return None
                    
                    else:
                        # Hala devam ediyor
                        print(f"⏳ Durum: {status} (Bekleniyor...)")
                        time.sleep(60)  # 1 dakika bekle
                
                else:
                    print(f"❌ Job durumu alınamadı: {response.text}")
                    time.sleep(60)
            
            except Exception as e:
                print(f"❌ Hata: {e}")
                time.sleep(60)
    
    def _save_model_info(self, fine_tuned_model: str):
        """Yeni model bilgilerini kaydet"""
        
        model_info = {
            "model": fine_tuned_model,
            "created_at": datetime.now().isoformat(),
            "base_model": self.current_model
        }
        
        with open("/home/ubuntu/ai-crypto-trader-dashboard/ai_bot/fine_tuned_model.json", "w") as f:
            json.dump(model_info, f, indent=2)
        
        print(f"📝 Model bilgileri kaydedildi: fine_tuned_model.json")
    
    def get_active_model(self) -> str:
        """Aktif modeli döndür (fine-tuned varsa onu, yoksa base model)"""
        
        try:
            with open("/home/ubuntu/ai-crypto-trader-dashboard/ai_bot/fine_tuned_model.json", "r") as f:
                model_info = json.load(f)
                return model_info["model"]
        except FileNotFoundError:
            return self.current_model  # Base model


# Test
if __name__ == "__main__":
    import os
    
    # OpenAI API Key (environment variable'dan al)
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("❌ OPENAI_API_KEY environment variable bulunamadı!")
        print("export OPENAI_API_KEY='your_key_here'")
        exit(1)
    
    system = FineTuningSystem(api_key)
    
    # Mock trade data
    mock_trades = [
        {
            "symbol": "BTCUSDT",
            "timeframe": "1h",
            "pattern": "FVG + OB",
            "confidence": 0.85,
            "direction": "LONG",
            "entry": 45000,
            "stop_loss": 44100,
            "take_profit": 47700,
            "result": "WIN",
            "pnl": 800,
            "sentiment": 0.7,
            "volume": "high",
            "candles": [
                {"open": 44500, "high": 44600, "low": 44400, "close": 44550},
                {"open": 44550, "high": 44700, "low": 44500, "close": 44650},
                # ... daha fazla mum
            ]
        }
        # ... toplam 50+ işlem gerekli
    ]
    
    # Fine-tuning başlat
    result = system.weekly_finetuning()
    print(json.dumps(result, indent=2))
