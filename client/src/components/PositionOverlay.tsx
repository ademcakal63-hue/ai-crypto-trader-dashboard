import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { TrendingUp, TrendingDown, Target, Shield } from "lucide-react";

interface Position {
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  quantity: number;
  current_price?: number;
  pnl?: number;
  pnl_percent?: number;
}

interface PositionOverlayProps {
  positions: Position[];
  currentPrice: number;
}

export function PositionOverlay({ positions, currentPrice }: PositionOverlayProps) {
  if (positions.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 z-10 space-y-2 max-w-sm">
      {positions.map((position, index) => {
        const pnl = position.pnl || 0;
        const pnlPercent = position.pnl_percent || 0;
        const isProfitable = pnl >= 0;

        // Fiyat seviyeleri
        const priceToSL = Math.abs(currentPrice - position.stop_loss);
        const priceToTP = Math.abs(currentPrice - position.take_profit);
        const priceToEntry = Math.abs(currentPrice - position.entry_price);

        return (
          <Card key={index} className="bg-slate-900/95 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  {position.direction === 'LONG' ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  {position.direction} Pozisyon
                </CardTitle>
                <Badge variant={isProfitable ? "default" : "destructive"} className="text-xs">
                  {isProfitable ? '+' : ''}{pnlPercent.toFixed(2)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {/* Entry Price */}
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Entry
                </span>
                <span className="font-mono">${position.entry_price.toFixed(2)}</span>
              </div>

              {/* Current Price */}
              <div className="flex items-center justify-between text-white font-semibold">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  Current
                </span>
                <span className="font-mono">${currentPrice.toFixed(2)}</span>
              </div>

              {/* Stop Loss */}
              <div className="flex items-center justify-between text-red-400">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Stop Loss
                </span>
                <span className="font-mono">${position.stop_loss.toFixed(2)}</span>
              </div>

              {/* Take Profit */}
              <div className="flex items-center justify-between text-green-400">
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Take Profit
                </span>
                <span className="font-mono">${position.take_profit.toFixed(2)}</span>
              </div>

              {/* P&L */}
              <div className="pt-2 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">P&L</span>
                  <span className={`font-mono font-semibold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                    {isProfitable ? '+' : ''}${pnl.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Distance to levels */}
              <div className="pt-2 space-y-1 text-[10px] text-slate-500">
                <div className="flex justify-between">
                  <span>SL mesafesi:</span>
                  <span>${priceToSL.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TP mesafesi:</span>
                  <span>${priceToTP.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
