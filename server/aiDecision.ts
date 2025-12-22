/**
 * AI Decision Module - Server-side AI trading decisions using Manus built-in LLM
 * 
 * This module provides AI trading decisions without requiring external API keys.
 * Uses the Manus Forge API which is pre-configured in the environment.
 */

import { invokeLLM } from "./_core/llm";

interface MarketData {
  current_price: number;
  price_change_24h?: number;
  candles?: any[];
  patterns?: {
    order_blocks?: any[];
    fair_value_gaps?: any[];
    liquidity_sweeps?: any[];
    break_of_structure?: any[];
  };
  order_book?: {
    whale_bias?: string;
    buy_pressure?: number;
    sell_pressure?: number;
    walls?: {
      buy?: any[];
      sell?: any[];
    };
    whale_trades?: any[];
    absorptions?: any[];
  };
  open_positions?: any[];
  pending_orders?: any[];
  balance?: number;
  capital?: number;
  daily_pnl?: number;
  daily_loss_limit?: number;
}

interface AIDecision {
  action: 'WAIT' | 'PLACE_LIMIT_ORDER' | 'CANCEL_ORDER' | 'OPEN_MARKET' | 'CLOSE_POSITION' | 'MODIFY_SL_TP';
  params?: {
    side?: 'BUY' | 'SELL';
    price?: number;
    stop_loss?: number;
    take_profit?: number;
    leverage?: number;
    order_id?: string;
    position_id?: string;
    new_stop_loss?: number;
    new_take_profit?: number;
    reason?: string;
  };
  analysis?: {
    market_structure?: string;
    order_flow?: string;
    key_levels?: number[];
    risk_assessment?: string;
  };
  reasoning: string;
  confidence: number;
  risk_reward?: number;
}

const SYSTEM_PROMPT = `Sen profesyonel bir kripto trader AI'sın. BTCUSDT Futures piyasasında işlem yapıyorsun.

## SENİN GÖREVİN
Sana verilen tüm piyasa verilerini analiz et ve ne yapılması gerektiğine TAMAMEN SEN karar ver.
Hiçbir sabit kural yok - sen kendi stratejini geliştir ve uygula.

## TRADING BİLGİN
- Smart Money Concepts (SMC): Order Blocks, Fair Value Gaps, Liquidity Sweeps, Break of Structure
- Order Flow: Whale aktivitesi, alıcı/satıcı duvarları, absorption
- Risk yönetimi: Position sizing, stop loss, take profit
- Piyasa yapısı: Trend, momentum, volatilite

## SERMAYE VE RİSK
- Paper trading sermayesi: $10,000
- Her işlemde maksimum %2 risk ($200)
- Günlük maksimum kayıp: %4 ($400)
- Kaldıraç: 1x-10x arası (sen belirle)

## KARARLARİN
Şu kararlardan BİRİNİ ver:

1. WAIT - Bekle, hiçbir şey yapma
   Sebep: Uygun setup yok, piyasa belirsiz, vs.

2. PLACE_LIMIT_ORDER - Limit emir koy
   Gerekli: side (BUY/SELL), price, stop_loss, take_profit, leverage, reason

3. CANCEL_ORDER - Bekleyen emri iptal et
   Gerekli: order_id, reason

4. OPEN_MARKET - Market emri ile hemen pozisyon aç
   Gerekli: side (BUY/SELL), stop_loss, take_profit, leverage, reason

5. CLOSE_POSITION - Açık pozisyonu kapat
   Gerekli: position_id, reason

6. MODIFY_SL_TP - Stop loss veya take profit değiştir
   Gerekli: position_id, new_stop_loss, new_take_profit, reason

## ÖNEMLİ
- Her kararında NEDEN bu kararı verdiğini açıkla
- Risk/Reward oranını hesapla
- Piyasa koşullarını değerlendir
- Hata yapmaktan korkma - paper trading'de öğreniyorsun
- Agresif veya konservatif olabilirsin - sen karar ver

## ÇIKTI FORMATI
JSON formatında cevap ver:
{
    "action": "WAIT|PLACE_LIMIT_ORDER|CANCEL_ORDER|OPEN_MARKET|CLOSE_POSITION|MODIFY_SL_TP",
    "params": { ... },
    "analysis": {
        "market_structure": "...",
        "order_flow": "...",
        "key_levels": [...],
        "risk_assessment": "..."
    },
    "reasoning": "Detaylı açıklama...",
    "confidence": 0.0-1.0,
    "risk_reward": 0.0
}`;

function formatOrderBook(ob: MarketData['order_book']): string {
  if (!ob) return "Order book verisi yok";
  
  const lines: string[] = [];
  lines.push(`- Whale Bias: ${ob.whale_bias || 'NEUTRAL'}`);
  lines.push(`- Buy Pressure: ${((ob.buy_pressure || 0) * 100).toFixed(1)}%`);
  lines.push(`- Sell Pressure: ${((ob.sell_pressure || 0) * 100).toFixed(1)}%`);
  
  const buyWalls = ob.walls?.buy || [];
  const sellWalls = ob.walls?.sell || [];
  
  if (buyWalls.length > 0) {
    lines.push(`- Buy Walls: ${buyWalls.length} adet`);
    buyWalls.slice(0, 3).forEach(w => {
      lines.push(`  • $${(w.value_usd || 0).toLocaleString()} @ ${(w.price || 0).toLocaleString()}`);
    });
  }
  
  if (sellWalls.length > 0) {
    lines.push(`- Sell Walls: ${sellWalls.length} adet`);
    sellWalls.slice(0, 3).forEach(w => {
      lines.push(`  • $${(w.value_usd || 0).toLocaleString()} @ ${(w.price || 0).toLocaleString()}`);
    });
  }
  
  return lines.join('\n');
}

function formatCandles(candles: any[]): string {
  if (!candles || candles.length === 0) return "Mum verisi yok";
  
  const lines: string[] = [];
  candles.slice(-10).forEach(c => {
    if (Array.isArray(c) && c.length >= 5) {
      const [, o, h, l, close] = c;
      const direction = close > o ? "🟢" : "🔴";
      const change = o > 0 ? ((close - o) / o * 100).toFixed(2) : "0.00";
      lines.push(`${direction} O:${o.toFixed(0)} H:${h.toFixed(0)} L:${l.toFixed(0)} C:${close.toFixed(0)} (${change}%)`);
    }
  });
  
  return lines.length > 0 ? lines.join('\n') : "Mum verisi formatı uyumsuz";
}

function formatPatterns(patterns: MarketData['patterns']): string {
  if (!patterns) return "Pattern tespit edilmedi";
  
  const lines: string[] = [];
  
  if (patterns.order_blocks?.length) {
    lines.push(`Order Blocks: ${patterns.order_blocks.length} adet`);
    patterns.order_blocks.slice(0, 3).forEach(ob => {
      lines.push(`  • ${ob.type || '?'} @ ${(ob.price || 0).toLocaleString()} (strength: ${(ob.strength || 0).toFixed(2)})`);
    });
  }
  
  if (patterns.fair_value_gaps?.length) {
    lines.push(`Fair Value Gaps: ${patterns.fair_value_gaps.length} adet`);
    patterns.fair_value_gaps.slice(0, 3).forEach(fvg => {
      lines.push(`  • ${fvg.type || '?'} ${(fvg.low || 0).toLocaleString()}-${(fvg.high || 0).toLocaleString()}`);
    });
  }
  
  return lines.length > 0 ? lines.join('\n') : "Pattern yok";
}

function formatPositions(positions: any[]): string {
  if (!positions || positions.length === 0) return "Açık pozisyon yok";
  
  return positions.map(p => {
    const emoji = (p.pnl || 0) >= 0 ? "🟢" : "🔴";
    return `${emoji} ${p.side || '?'} @ ${(p.entry_price || 0).toLocaleString()} | P&L: $${(p.pnl || 0).toFixed(2)} (${(p.pnl_percent || 0).toFixed(2)}%) | SL: ${(p.stop_loss || 0).toLocaleString()} | TP: ${(p.take_profit || 0).toLocaleString()}`;
  }).join('\n');
}

function formatPendingOrders(orders: any[]): string {
  if (!orders || orders.length === 0) return "Bekleyen emir yok";
  
  return orders.map(o => {
    return `📝 ${o.side || '?'} @ ${(o.price || 0).toLocaleString()} | SL: ${(o.stop_loss || 0).toLocaleString()} | TP: ${(o.take_profit || 0).toLocaleString()} | ID: ${o.order_id || '?'}`;
  }).join('\n');
}

function prepareMarketSummary(data: MarketData): string {
  return `
## GÜNCEL PİYASA VERİLERİ

### Fiyat Bilgisi
- Güncel Fiyat: $${(data.current_price || 0).toLocaleString()}
- 24h Değişim: ${(data.price_change_24h || 0).toFixed(2)}%

### Order Book Analizi
${formatOrderBook(data.order_book)}

### Son Mumlar (15m)
${formatCandles(data.candles || [])}

### SMC Pattern'ler
${formatPatterns(data.patterns)}

### Açık Pozisyonlar
${formatPositions(data.open_positions || [])}

### Bekleyen Emirler
${formatPendingOrders(data.pending_orders || [])}

### Hesap Durumu
- Sermaye: $${(data.capital || 10000).toLocaleString()}
- Güncel Bakiye: $${(data.balance || 10000).toLocaleString()}
- Günlük P&L: $${(data.daily_pnl || 0).toFixed(2)}
- Günlük Kayıp Limiti: $${(data.daily_loss_limit || 400).toFixed(2)}

---
Şimdi tüm bu verileri analiz et ve ne yapılması gerektiğine karar ver.
`;
}

export async function makeAIDecision(marketData: MarketData): Promise<AIDecision> {
  try {
    const userMessage = prepareMarketSummary(marketData);
    
    const response = await invokeLLM({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("Empty response from LLM");
    }
    
    const decision = JSON.parse(content) as AIDecision;
    return decision;
    
  } catch (error) {
    console.error("AI Decision Error:", error);
    return {
      action: "WAIT",
      reasoning: `Hata: ${error instanceof Error ? error.message : 'Unknown error'}`,
      confidence: 0
    };
  }
}
