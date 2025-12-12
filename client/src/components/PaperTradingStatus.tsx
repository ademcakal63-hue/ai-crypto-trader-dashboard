import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { DollarSign, TrendingUp, Target, Activity, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

export function PaperTradingStatus() {
  // Fetch paper trading status
  const { data: paperStatus, isLoading } = trpc.paperTrading.getStatus.useQuery(undefined, {
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading || !paperStatus) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400 animate-pulse" />
            Paper Trading Status
          </CardTitle>
          <CardDescription>Yükleniyor...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-slate-800/50 rounded animate-pulse" />
            <div className="h-4 bg-slate-800/50 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    currentBalance,
    initialBalance,
    totalPnl,
    totalPnlPercent,
    currentCycle,
    tradesInCycle,
    tradesPerCycle,
    totalTrades,
    winRate,
    mode,
  } = paperStatus;

  const progress = (tradesInCycle / tradesPerCycle) * 100;
  const isProfitable = totalPnl >= 0;

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            Paper Trading Status
          </CardTitle>
          <Badge variant={mode === "PAPER" ? "secondary" : "default"} className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            {mode} MODE
          </Badge>
        </div>
        <CardDescription>
          Sanal para ile test - Gerçek paraya dokunulmuyor
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Balance</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                ${currentBalance.toFixed(2)}
              </div>
              <div className={cn(
                "text-sm font-medium",
                isProfitable ? "text-green-400" : "text-red-400"
              )}>
                {isProfitable ? "+" : ""}${totalPnl.toFixed(2)} ({totalPnlPercent >= 0 ? "+" : ""}{totalPnlPercent.toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>

        {/* Cycle Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>Cycle {currentCycle}</span>
            </div>
            <span className="font-medium text-white">
              {tradesInCycle}/{tradesPerCycle} trades
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {(tradesPerCycle - tradesInCycle)} trades remaining
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Win Rate</span>
            </div>
            <div className={cn(
              "text-xl font-bold",
              winRate >= 60 ? "text-green-400" : winRate >= 50 ? "text-yellow-400" : "text-red-400"
            )}>
              {winRate.toFixed(1)}%
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              <span>Total Trades</span>
            </div>
            <div className="text-xl font-bold text-white">
              {totalTrades}
            </div>
          </div>
        </div>

        {/* Info */}
        {tradesInCycle === 0 && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-xs text-blue-300">
              💡 Bot başlatıldığında buradan ilerlemeyi takip edebilirsiniz
            </p>
          </div>
        )}

        {tradesInCycle >= tradesPerCycle - 10 && tradesInCycle < tradesPerCycle && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-xs text-yellow-300">
              ⚠️ Cycle {currentCycle} tamamlanmak üzere! Fine-tuning yakında başlayacak.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
