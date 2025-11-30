#!/usr/bin/env python3
"""
Balance Helper - İşlem Öncesi Bakiye Kontrolü
Bu script, bot'un her işlem öncesi Binance'den güncel bakiyeyi çekmesini ve
ayarlara göre kullanılacak sermayeyi hesaplamasını sağlar.
"""

import requests
from typing import Dict, Optional

class BalanceHelper:
    """Binance bakiye kontrolü ve sermaye hesaplama"""
    
    def __init__(self, dashboard_api_url: str):
        """
        Args:
            dashboard_api_url: Dashboard API URL'i (örn: https://your-dashboard.com)
        """
        self.dashboard_api_url = dashboard_api_url.rstrip('/')
        self.session = requests.Session()
    
    def get_current_balance(self) -> Optional[Dict]:
        """
        Dashboard API'den güncel Binance bakiyesini çek
        
        Returns:
            {
                'total': 523.45,      # Toplam USDT bakiyesi
                'available': 500.00,  # Kullanılabilir bakiye
            }
            veya None (bağlantı hatası)
        """
        try:
            response = self.session.get(f"{self.dashboard_api_url}/api/trpc/dashboard.balance")
            response.raise_for_status()
            
            data = response.json()
            if data and 'result' in data and 'data' in data['result']:
                balance = data['result']['data']
                return balance
            
            return None
        except Exception as e:
            print(f"❌ Bakiye çekme hatası: {e}")
            return None
    
    def get_settings(self) -> Optional[Dict]:
        """
        Dashboard'dan bot ayarlarını çek
        
        Returns:
            {
                'capitalLimit': '500',        # Opsiyonel: Maksimum sermaye limiti
                'useAllBalance': True,        # Tüm bakiyeyi kullan
                'compoundEnabled': False,     # Bileşik getiri
                'riskPerTradePercent': '2.00',
                'dailyLossLimitPercent': '4.00',
                ...
            }
        """
        try:
            response = self.session.get(f"{self.dashboard_api_url}/api/trpc/settings.get")
            response.raise_for_status()
            
            data = response.json()
            if data and 'result' in data and 'data' in data['result']:
                settings = data['result']['data']
                return settings
            
            return None
        except Exception as e:
            print(f"❌ Ayarları çekme hatası: {e}")
            return None
    
    def calculate_usable_capital(self) -> Optional[float]:
        """
        Kullanılacak sermayeyi hesapla
        
        Mantık:
        1. Binance'den güncel bakiyeyi çek
        2. Ayarlardan useAllBalance ve capitalLimit'i kontrol et
        3. useAllBalance=True ise → Tüm bakiyeyi kullan
        4. useAllBalance=False ise → capitalLimit'i kullan (varsa)
        5. capitalLimit yoksa → Tüm bakiyeyi kullan
        
        Returns:
            float: Kullanılacak sermaye miktarı (USDT)
            None: Hata durumunda
        """
        # 1. Güncel bakiyeyi çek
        balance = self.get_current_balance()
        if not balance:
            print("❌ Bakiye bilgisi alınamadı!")
            return None
        
        available_balance = balance.get('available', 0)
        
        # 2. Ayarları çek
        settings = self.get_settings()
        if not settings:
            print("❌ Ayarlar alınamadı!")
            return None
        
        use_all_balance = settings.get('useAllBalance', True)
        capital_limit = settings.get('capitalLimit')
        
        # 3. Kullanılacak sermayeyi hesapla
        if use_all_balance:
            # Tüm bakiyeyi kullan
            usable_capital = available_balance
            print(f"\n💰 Sermaye Hesaplama:")
            print(f"   Mod: Tüm Bakiye Kullan")
            print(f"   Kullanılabilir Bakiye: ${available_balance:.2f} USDT")
            print(f"   Kullanılacak Sermaye: ${usable_capital:.2f} USDT")
        else:
            # Sermaye limiti varsa onu kullan
            if capital_limit:
                limit = float(capital_limit)
                usable_capital = min(limit, available_balance)
                print(f"\n💰 Sermaye Hesaplama:")
                print(f"   Mod: Sermaye Limiti")
                print(f"   Kullanılabilir Bakiye: ${available_balance:.2f} USDT")
                print(f"   Sermaye Limiti: ${limit:.2f} USDT")
                print(f"   Kullanılacak Sermaye: ${usable_capital:.2f} USDT")
            else:
                # Limit yoksa tüm bakiyeyi kullan
                usable_capital = available_balance
                print(f"\n💰 Sermaye Hesaplama:")
                print(f"   Mod: Limit Yok (Tüm Bakiye)")
                print(f"   Kullanılabilir Bakiye: ${available_balance:.2f} USDT")
                print(f"   Kullanılacak Sermaye: ${usable_capital:.2f} USDT")
        
        return usable_capital
    
    def calculate_position_size(self, entry_price: float, stop_loss: float, 
                               direction: str = "LONG") -> Optional[Dict]:
        """
        Pozisyon büyüklüğünü hesapla (güncel bakiyeye göre)
        
        Args:
            entry_price: Giriş fiyatı
            stop_loss: Stop loss fiyatı
            direction: "LONG" veya "SHORT"
        
        Returns:
            {
                'usable_capital': 500.0,      # Kullanılacak sermaye
                'risk_amount': 10.0,          # Risk edilen miktar (%2)
                'position_size': 1000.0,      # Pozisyon büyüklüğü
                'leverage': 2,                # Hesaplanan kaldıraç
                'stop_loss_percent': 1.0,     # Stop loss mesafesi %
            }
        """
        # 1. Kullanılacak sermayeyi hesapla
        usable_capital = self.calculate_usable_capital()
        if not usable_capital:
            return None
        
        # 2. Ayarları çek
        settings = self.get_settings()
        if not settings:
            return None
        
        risk_percent = float(settings.get('riskPerTradePercent', '2.00'))
        
        # 3. Risk miktarını hesapla
        risk_amount = usable_capital * (risk_percent / 100)
        
        # 4. Stop loss mesafesini hesapla
        if direction == "LONG":
            stop_loss_distance = entry_price - stop_loss
        else:  # SHORT
            stop_loss_distance = stop_loss - entry_price
        
        stop_loss_percent = (stop_loss_distance / entry_price) * 100
        
        # 5. Pozisyon büyüklüğünü hesapla
        position_size = risk_amount / (stop_loss_percent / 100)
        
        # 6. Kaldıracı hesapla
        leverage = max(1, min(50, int(position_size / usable_capital)))
        
        result = {
            'usable_capital': usable_capital,
            'risk_amount': risk_amount,
            'position_size': position_size,
            'leverage': leverage,
            'stop_loss_percent': stop_loss_percent,
        }
        
        print(f"\n📊 Pozisyon Hesaplama:")
        print(f"   Kullanılacak Sermaye: ${usable_capital:.2f} USDT")
        print(f"   Risk/İşlem: {risk_percent}% = ${risk_amount:.2f} USDT")
        print(f"   Stop Loss Mesafesi: {stop_loss_percent:.2f}%")
        print(f"   Pozisyon Büyüklüğü: ${position_size:.2f} USDT")
        print(f"   Kaldıraç: {leverage}x")
        
        return result


    def should_use_compound_returns(self) -> bool:
        """
        Bileşik getiri (compound) aktif mi kontrol et
        
        Returns:
            bool: True ise kazançlar sermayeye eklenir
        """
        settings = self.get_settings()
        if settings:
            compound_enabled = settings.get('compoundEnabled', False)
            
            if compound_enabled:
                print("\n📈 Bileşik Getiri Aktif:")
                print("   Kazançlar otomatik olarak sermayeye eklenecek")
            else:
                print("\n📋 Bileşik Getiri Pasif:")
                print("   Sabit sermaye kullanılacak")
            
            return compound_enabled
        
        return False


# Kullanım Örneği
if __name__ == "__main__":
    # Dashboard URL'inizi buraya yazın
    DASHBOARD_URL = "https://YOUR_DASHBOARD_URL"
    
    helper = BalanceHelper(DASHBOARD_URL)
    
    # Örnek: BTC Long pozisyon
    print("=" * 60)
    print("Örnek: BTC Long Pozisyon Hesaplama")
    print("=" * 60)
    
    result = helper.calculate_position_size(
        entry_price=96000,
        stop_loss=95040,  # %1 stop loss
        direction="LONG"
    )
    
    if result:
        print("\n✅ Hesaplama başarılı!")
        print(f"\nBot şimdi ${result['position_size']:.2f} USDT pozisyon açabilir")
        print(f"Kaldıraç: {result['leverage']}x")
    else:
        print("\n❌ Hesaplama başarısız!")

    # Bileşik getiri kontrolü
    print("\n" + "=" * 60)
    print("Bileşik Getiri Kontrolü")
    print("=" * 60)
    
    compound_enabled = helper.should_use_compound_returns()
    
    if compound_enabled:
        print("\n💡 Not: Her kazançlı işlem sonrası bakiye otomatik güncellenecek")
        print("   Örnek: 500 USDT → +50 USDT kazanç → Sonraki işlem 550 USDT ile")
    else:
        print("\n💡 Not: Sabit sermaye kullanılacak, kazançlar birikmeyecek")
        print("   Örnek: 500 USDT → +50 USDT kazanç → Sonraki işlem yine 500 USDT ile")
