#!/usr/bin/env python3
"""
Learning Scheduler - Arka Planda Çalışır
Haftalık öğrenmeyi otomatik yapar
"""

import sys
from learning_manager import HybridLearningManager

def main():
    print("🚀 Learning Scheduler başlatılıyor...")
    
    # Learning manager'ı başlat
    manager = HybridLearningManager()
    manager.initialize()
    
    print("\n✅ Scheduler aktif!")
    print("📅 Her Pazar 23:00'da otomatik öğrenme yapılacak")
    print("🔄 Hafta 3'te otomatik olarak Seçenek B'ye geçilecek")
    print("\nDurdurmak için Ctrl+C tuşuna basın.\n")
    
    try:
        # Sürekli çalış
        manager.run_scheduler()
    except KeyboardInterrupt:
        print("\n\n⏹️ Scheduler durduruldu.")
        sys.exit(0)

if __name__ == "__main__":
    main()
