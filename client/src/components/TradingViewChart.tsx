import { useEffect, useRef, memo } from 'react';

interface TradingViewChartProps {
  symbol: string; // "BTCUSDT", "ETHUSDT", "SOLUSDT"
  positions?: Array<{
    entry_price: number;
    stop_loss: number;
    take_profit: number;
    direction: 'LONG' | 'SHORT';
  }>;
}

export const TradingViewChart = memo(({ symbol, positions = [] }: TradingViewChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // TradingView widget script'i yükle
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof (window as any).TradingView !== 'undefined' && containerRef.current) {
        // Önceki widget'ı temizle
        if (widgetRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Yeni widget oluştur
        widgetRef.current = new (window as any).TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${symbol}`,
          interval: '15', // 15 dakika
          timezone: 'Europe/Istanbul',
          theme: 'dark',
          style: '1', // Candlestick
          locale: 'tr',
          toolbar_bg: '#0f172a',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: containerRef.current.id,
          studies: [
            'Volume@tv-basicstudies',
          ],
          disabled_features: [
            'use_localstorage_for_settings',
            'header_symbol_search',
            'header_compare',
          ],
          enabled_features: [
            'study_templates',
          ],
          overrides: {
            'paneProperties.background': '#0f172a',
            'paneProperties.backgroundType': 'solid',
          },
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      if (widgetRef.current && containerRef.current) {
        containerRef.current.innerHTML = '';
        widgetRef.current = null;
      }
    };
  }, [symbol]);

  // Pozisyon marker'ları ekle (widget yüklendikten sonra)
  useEffect(() => {
    if (!widgetRef.current || positions.length === 0) return;

    // TradingView API ile marker ekleme (gelişmiş özellik)
    // Şu an sadece pozisyon bilgilerini gösteriyoruz
    // İleride TradingView'in Drawing API'si ile SL/TP çizgileri eklenebilir
  }, [positions]);

  return (
    <div className="w-full h-full bg-slate-950 rounded-lg overflow-hidden">
      <div
        id={`tradingview_${symbol}`}
        ref={containerRef}
        className="w-full h-full"
      />
    </div>
  );
});

TradingViewChart.displayName = 'TradingViewChart';
