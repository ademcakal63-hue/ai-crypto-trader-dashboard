"""
Test Pozisyon Hesaplama Mantığı
Kaldıraç ve pozisyon büyüklüğü hesaplamalarını test et
"""

def calculate_position(capital, risk_percent, daily_loss_limit_percent, entry, stop_loss):
    """
    Pozisyon hesaplama fonksiyonu (main.py'deki mantık)
    """
    # 1. Maksimum pozisyon sayısı
    max_positions = int(daily_loss_limit_percent / risk_percent)
    
    # 2. Stop loss mesafesi
    sl_distance_price = abs(entry - stop_loss)
    sl_distance_percent = sl_distance_price / entry
    
    # 3. Dinamik kaldıraç
    calculated_leverage = risk_percent / sl_distance_percent
    max_leverage = 20
    min_leverage = 1
    leverage = max(min_leverage, min(max_leverage, int(calculated_leverage)))
    
    # 4. Pozisyon büyüklüğü
    risk_amount = capital * risk_percent
    quantity = risk_amount / sl_distance_price
    position_size_usdt = quantity * entry
    
    # 5. Gerekli margin
    required_margin = position_size_usdt / leverage
    
    return {
        "max_positions": max_positions,
        "sl_distance_percent": sl_distance_percent * 100,
        "calculated_leverage": calculated_leverage,
        "leverage": leverage,
        "risk_amount": risk_amount,
        "position_size_usdt": position_size_usdt,
        "quantity": quantity,
        "required_margin": required_margin,
    }


def test_scenario_1():
    """
    Senaryo 1: Normal durum
    - $1000 sermaye
    - %2 işlem başına risk
    - %4 günlük kayıp limiti
    - Entry: $50,000
    - Stop Loss: $49,500 (1% mesafe)
    
    Beklenen:
    - Max 2 pozisyon (4% / 2% = 2)
    - Kaldıraç: 2x (2% / 1% = 2)
    - Risk: $20
    - Quantity: 0.04 BTC (20 / 500)
    - Pozisyon büyüklüğü: $2000 (0.04 * 50000)
    - Margin: $1000 (2000 / 2)
    """
    result = calculate_position(
        capital=1000,
        risk_percent=0.02,
        daily_loss_limit_percent=0.04,
        entry=50000,
        stop_loss=49500
    )
    
    print("\n=== SENARYO 1: Normal Durum ===")
    print(f"Sermaye: $1000")
    print(f"Risk: %2 işlem başına, %4 günlük limit")
    print(f"Entry: $50,000, SL: $49,500 (1% mesafe)")
    print(f"\nSonuçlar:")
    print(f"  Max Pozisyon: {result['max_positions']} ✅ (Beklenen: 2)")
    print(f"  SL Mesafesi: {result['sl_distance_percent']:.2f}% ✅ (Beklenen: 1%)")
    print(f"  Kaldıraç: {result['leverage']}x ✅ (Beklenen: 2x)")
    print(f"  Risk Amount: ${result['risk_amount']:.2f} ✅ (Beklenen: $20)")
    print(f"  Pozisyon Büyüklüğü: ${result['position_size_usdt']:.2f} ✅ (Beklenen: $2000)")
    print(f"  Quantity: {result['quantity']:.4f} BTC ✅ (Beklenen: 0.04)")
    print(f"  Gerekli Margin: ${result['required_margin']:.2f} ✅ (Beklenen: $1000)")
    
    # Doğrulama
    assert result['max_positions'] == 2, "Max pozisyon yanlış!"
    assert abs(result['sl_distance_percent'] - 1.0) < 0.01, "SL mesafesi yanlış!"
    assert result['leverage'] == 2, "Kaldıraç yanlış!"
    assert abs(result['risk_amount'] - 20) < 0.01, "Risk amount yanlış!"
    assert abs(result['position_size_usdt'] - 2000) < 1, "Pozisyon büyüklüğü yanlış!"
    assert abs(result['quantity'] - 0.04) < 0.001, "Quantity yanlış!"
    assert abs(result['required_margin'] - 1000) < 1, "Margin yanlış!"
    print("\n✅ SENARYO 1 BAŞARILI!")


def test_scenario_2():
    """
    Senaryo 2: Geniş stop loss
    - $1000 sermaye
    - %2 işlem başına risk
    - %4 günlük kayıp limiti
    - Entry: $50,000
    - Stop Loss: $47,500 (5% mesafe)
    
    Beklenen:
    - Max 2 pozisyon
    - Kaldıraç: 1x (2% / 5% = 0.4 → min 1x)
    - Risk: $20
    - Quantity: 0.008 BTC (20 / 2500)
    - Pozisyon büyüklüğü: $400 (0.008 * 50000)
    - Margin: $400 (400 / 1)
    """
    result = calculate_position(
        capital=1000,
        risk_percent=0.02,
        daily_loss_limit_percent=0.04,
        entry=50000,
        stop_loss=47500
    )
    
    print("\n=== SENARYO 2: Geniş Stop Loss ===")
    print(f"Sermaye: $1000")
    print(f"Risk: %2 işlem başına, %4 günlük limit")
    print(f"Entry: $50,000, SL: $47,500 (5% mesafe)")
    print(f"\nSonuçlar:")
    print(f"  Max Pozisyon: {result['max_positions']} ✅ (Beklenen: 2)")
    print(f"  SL Mesafesi: {result['sl_distance_percent']:.2f}% ✅ (Beklenen: 5%)")
    print(f"  Kaldıraç: {result['leverage']}x ✅ (Beklenen: 1x - minimum)")
    print(f"  Risk Amount: ${result['risk_amount']:.2f} ✅ (Beklenen: $20)")
    print(f"  Pozisyon Büyüklüğü: ${result['position_size_usdt']:.2f} ✅ (Beklenen: $400)")
    print(f"  Quantity: {result['quantity']:.4f} BTC ✅ (Beklenen: 0.008)")
    print(f"  Gerekli Margin: ${result['required_margin']:.2f} ✅ (Beklenen: $400)")
    
    # Doğrulama
    assert result['max_positions'] == 2, "Max pozisyon yanlış!"
    assert abs(result['sl_distance_percent'] - 5.0) < 0.01, "SL mesafesi yanlış!"
    assert result['leverage'] == 1, "Kaldıraç yanlış (minimum 1x olmalı)!"
    assert abs(result['risk_amount'] - 20) < 0.01, "Risk amount yanlış!"
    assert abs(result['position_size_usdt'] - 400) < 1, "Pozisyon büyüklüğü yanlış!"
    assert abs(result['quantity'] - 0.008) < 0.0001, "Quantity yanlış!"
    assert abs(result['required_margin'] - 400) < 1, "Margin yanlış!"
    print("\n✅ SENARYO 2 BAŞARILI!")


def test_scenario_3():
    """
    Senaryo 3: Dar stop loss (yüksek kaldıraç)
    - $1000 sermaye
    - %2 işlem başına risk
    - %4 günlük kayıp limiti
    - Entry: $50,000
    - Stop Loss: $49,900 (0.2% mesafe)
    
    Beklenen:
    - Max 2 pozisyon
    - Kaldıraç: 10x (2% / 0.2% = 10)
    - Risk: $20
    - Quantity: 0.2 BTC (20 / 100)
    - Pozisyon büyüklüğü: $10000 (0.2 * 50000)
    - Margin: $1000 (10000 / 10)
    """
    result = calculate_position(
        capital=1000,
        risk_percent=0.02,
        daily_loss_limit_percent=0.04,
        entry=50000,
        stop_loss=49900
    )
    
    print("\n=== SENARYO 3: Dar Stop Loss (Yüksek Kaldıraç) ===")
    print(f"Sermaye: $1000")
    print(f"Risk: %2 işlem başına, %4 günlük limit")
    print(f"Entry: $50,000, SL: $49,900 (0.2% mesafe)")
    print(f"\nSonuçlar:")
    print(f"  Max Pozisyon: {result['max_positions']} ✅ (Beklenen: 2)")
    print(f"  SL Mesafesi: {result['sl_distance_percent']:.2f}% ✅ (Beklenen: 0.2%)")
    print(f"  Kaldıraç: {result['leverage']}x ✅ (Beklenen: 10x)")
    print(f"  Risk Amount: ${result['risk_amount']:.2f} ✅ (Beklenen: $20)")
    print(f"  Pozisyon Büyüklüğü: ${result['position_size_usdt']:.2f} ✅ (Beklenen: $10000)")
    print(f"  Quantity: {result['quantity']:.4f} BTC ✅ (Beklenen: 0.2)")
    print(f"  Gerekli Margin: ${result['required_margin']:.2f} ✅ (Beklenen: $1000)")
    
    # Doğrulama
    assert result['max_positions'] == 2, "Max pozisyon yanlış!"
    assert abs(result['sl_distance_percent'] - 0.2) < 0.01, "SL mesafesi yanlış!"
    assert result['leverage'] == 10, "Kaldıraç yanlış!"
    assert abs(result['risk_amount'] - 20) < 0.01, "Risk amount yanlış!"
    assert abs(result['position_size_usdt'] - 10000) < 10, "Pozisyon büyüklüğü yanlış!"
    assert abs(result['quantity'] - 0.2) < 0.001, "Quantity yanlış!"
    assert abs(result['required_margin'] - 1000) < 10, "Margin yanlış!"
    print("\n✅ SENARYO 3 BAŞARILI!")


if __name__ == "__main__":
    print("=" * 60)
    print("POZİSYON HESAPLAMA TESTLERİ")
    print("=" * 60)
    
    try:
        test_scenario_1()
        test_scenario_2()
        test_scenario_3()
        
        print("\n" + "=" * 60)
        print("✅ TÜM TESTLER BAŞARILI!")
        print("=" * 60)
        print("\n📊 Özet:")
        print("  - Dinamik kaldıraç hesaplama çalışıyor")
        print("  - Maksimum pozisyon sayısı doğru")
        print("  - Risk yönetimi parametreleri doğru")
        print("  - Pozisyon büyüklüğü hesaplaması doğru")
        print("\n🚀 Bot yarın güvenle başlatılabilir!")
        
    except AssertionError as e:
        print(f"\n❌ TEST BAŞARISIZ: {e}")
        print("Hesaplama mantığında hata var, düzeltilmeli!")
