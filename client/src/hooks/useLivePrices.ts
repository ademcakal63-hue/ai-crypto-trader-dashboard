import { useState, useEffect, useRef } from 'react';

interface LivePrice {
  symbol: string;
  price: number;
  change24h?: number;
}

interface UseLivePricesOptions {
  symbols: string[];
  enabled?: boolean;
  updateInterval?: number; // ms
}

/**
 * Gerçek zamanlı fiyat güncellemesi için hook
 * WebSocket bağlantısı simüle edilmiş (gerçek bot bağlanınca WebSocket kullanılacak)
 */
export function useLivePrices({ symbols, enabled = true, updateInterval = 2000 }: UseLivePricesOptions) {
  const [prices, setPrices] = useState<Record<string, LivePrice>>(() => ({}));
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!enabled || symbols.length === 0) {
      return;
    }

    // Başlangıç fiyatları (gerçek bot bağlanınca API'den gelecek)
    const initialPrices: Record<string, LivePrice> = {
      'BTCUSDT': { symbol: 'BTCUSDT', price: 96500 },
      'ETHUSDT': { symbol: 'ETHUSDT', price: 3650 },
      'SOLUSDT': { symbol: 'SOLUSDT', price: 245.5 },
    };

    setPrices(initialPrices);
    setIsConnected(true);

    // Simüle edilmiş fiyat güncellemeleri
    // Gerçek bot bağlanınca WebSocket kullanılacak
    intervalRef.current = setInterval(() => {
      setPrices(prev => {
        const updated = { ...prev };
        
        symbols.forEach(symbol => {
          if (updated[symbol]) {
            // Rastgele fiyat değişimi (-0.5% ile +0.5% arası)
            const changePercent = (Math.random() - 0.5) * 0.01;
            const newPrice = updated[symbol].price * (1 + changePercent);
            
            updated[symbol] = {
              ...updated[symbol],
              price: newPrice,
            };
          }
        });
        
        return updated;
      });
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsConnected(false);
    };
  }, [symbols, enabled, updateInterval]);

  return {
    prices,
    isConnected,
  };
}
