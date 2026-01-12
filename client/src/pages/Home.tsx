import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  Brain,
  Zap,
  AlertCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Wallet,
  LineChart,
  PieChart,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Shield,
  Timer,
  Flame
} from "lucide-react";

import { cn } from "@/lib/utils";
import { BotControlPanel } from "@/components/BotControlPanel";
import { BotLogViewer } from "@/components/BotLogViewer";
import { PerformanceChart } from "@/components/PerformanceChart";
import { PaperTradingStatus } from "@/components/PaperTradingStatus";
import { useState, useEffect } from "react";

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Fetch real dashboard data
  const { data: overview, isLoading: overviewLoading } = trpc.dashboard.overview.useQuery(undefined, {
    refetchInterval: 10000,
  });
  const { data: openPositions, isLoading: positionsLoading } = trpc.dashboard.openPositions.useQuery(undefined, {
    refetchInterval: 10000,
  });
  const { data: aiLearning, isLoading: aiLoading } = trpc.dashboard.aiLearning.useQuery();
  const { data: performance, isLoading: perfLoading } = trpc.dashboard.performance.useQuery();
  const { data: botStatus } = trpc.bot.status.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const { data: paperTradingStatus } = trpc.paperTrading.getStatus.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const isLoading = overviewLoading || positionsLoading || aiLoading || perfLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium">Dashboard Yükleniyor</p>
            <p className="text-sm text-muted-foreground mt-1">Veriler hazırlanıyor...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPnL = parseFloat(overview?.totalOpenPnl || "0");
  const winRate = parseFloat(overview?.todayPerformance?.winRate || "0");
  const totalTrades = overview?.todayPerformance?.totalTrades || 0;
  const activePositions = overview?.openPositionsCount || 0;
  
  // Paper trading data - API'den gelen alan adları
  const paperBalance = paperTradingStatus?.currentBalance || 10000;
  const paperPnL = paperTradingStatus?.totalPnl || 0;
  const paperPnLPercent = paperTradingStatus?.totalPnlPercent || 0;
  // Haftalık öğrenme sistemi - cycle yerine toplam trade sayısı takip ediliyor
  const paperTotalTrades = paperTradingStatus?.totalTrades || 0;
  const paperWinRate = paperTradingStatus?.winRate || 0;

  // Bot running status
  const isBotRunning = botStatus?.bots?.some((b: any) => b.status === 'running') || false;

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-black via-neutral-950 to-black border border-amber-900/30 p-8">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Powered
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Trading Dashboard
              </h1>
              <p className="text-neutral-400 mt-2 max-w-lg">
                Otonom AI kripto trading bot'unuzun gerçek zamanlı performansını izleyin ve yönetin
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Şu anki zaman</p>
                <p className="text-2xl font-mono text-white">
                  {currentTime.toLocaleTimeString('tr-TR')}
                </p>
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-sm px-3 py-1",
                  isBotRunning 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                    : "bg-neutral-800/50 text-neutral-400 border-neutral-700/30"
                )}
              >
                <span className={cn(
                  "w-2 h-2 rounded-full mr-2",
                  isBotRunning ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                )} />
                {isBotRunning ? "Bot Aktif" : "Bot Pasif"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Bot Control Panel - Redesigned */}
      <BotControlPanel />

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Paper Trading Balance */}
        <Card className="relative overflow-hidden border-amber-900/20 bg-gradient-to-br from-neutral-950/80 to-black/40 backdrop-blur">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Paper Balance</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Wallet className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              ${paperBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {paperPnL >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-400" />
              )}
              <span className={cn(
                "text-sm font-medium",
                paperPnL >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {paperPnL >= 0 ? "+" : ""}{paperPnLPercent.toFixed(2)}%
              </span>
              <span className="text-xs text-neutral-500">tüm zamanlar</span>
            </div>
          </CardContent>
        </Card>

        {/* Total P&L */}
        <Card className="relative overflow-hidden border-amber-900/20 bg-gradient-to-br from-neutral-950/80 to-black/40 backdrop-blur">
          <div className={cn(
            "absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2",
            totalPnL >= 0 ? "bg-emerald-500/5" : "bg-red-500/5"
          )} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Toplam P&L</CardTitle>
            <div className={cn(
              "p-2 rounded-lg",
              totalPnL >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
            )}>
              <DollarSign className={cn(
                "h-4 w-4",
                totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
              )} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-bold",
              totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {totalPnL >= 0 ? "+" : ""}${Math.abs(totalPnL).toFixed(2)}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Gerçekleşen kar/zarar
            </p>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card className="relative overflow-hidden border-amber-900/20 bg-gradient-to-br from-neutral-950/80 to-black/40 backdrop-blur">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Başarı Oranı</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Target className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {(winRate * 100).toFixed(1)}%
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-neutral-500">{totalTrades} işlem</span>
              <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
                  style={{ width: `${winRate * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Positions */}
        <Card className="relative overflow-hidden border-amber-900/20 bg-gradient-to-br from-neutral-950/80 to-black/40 backdrop-blur">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Açık Pozisyonlar</CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Activity className="h-4 w-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{activePositions}</div>
            <p className="text-xs text-neutral-500 mt-2">
              {activePositions > 0 ? "Aktif işlemler mevcut" : "Pozisyon bekleniyor"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Paper Trading Status - Enhanced */}
      <Card className="border-amber-900/20 bg-gradient-to-br from-neutral-950/80 to-black/40 backdrop-blur overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-emerald-500" />
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <LineChart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Paper Trading Status</CardTitle>
                <CardDescription>Sanal para ile test - Gerçek paraya dokunulmuyor</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 px-3 py-1">
              PAPER MODE
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Balance Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <DollarSign className="h-4 w-4" />
                Balance
              </div>
              <div className="text-3xl font-bold text-white">
                ${paperBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className={cn(
                "text-sm font-medium",
                paperPnL >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {paperPnL >= 0 ? "+" : ""}${paperPnL.toFixed(2)} ({paperPnL >= 0 ? "+" : ""}{paperPnLPercent.toFixed(2)}%)
              </div>
            </div>

            {/* Weekly Learning */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Brain className="h-4 w-4" />
                Haftalık Öğrenme
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{paperTotalTrades}</span>
                <span className="text-neutral-500">toplam işlem</span>
              </div>
              <p className="text-xs text-neutral-500">Her Pazar 23:00 analiz</p>
            </div>

            {/* Win Rate */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Target className="h-4 w-4" />
                Başarı Oranı
              </div>
              <div className="text-3xl font-bold text-white">{paperWinRate.toFixed(1)}%</div>
              <p className="text-xs text-neutral-500">Kazanan işlemler</p>
            </div>
          </div>

          {/* Stats Row */}
          <Separator className="bg-neutral-800" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-neutral-800/50">
              <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Win Rate</span>
              </div>
              <div className="text-xl font-bold text-white">{paperWinRate.toFixed(1)}%</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-neutral-800/50">
              <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm">Total Trades</span>
              </div>
              <div className="text-xl font-bold text-white">{paperTotalTrades}</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-neutral-800/50">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                <Flame className="h-4 w-4" />
                <span className="text-sm">Streak</span>
              </div>
              <div className="text-xl font-bold text-white">0</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-neutral-800/50">
              <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                <Shield className="h-4 w-4" />
                <span className="text-sm">Risk Level</span>
              </div>
              <div className="text-xl font-bold text-white">Low</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bot Log Viewer */}
      <BotLogViewer 
        symbol="BTCUSDT" 
        isRunning={isBotRunning} 
      />

      {/* Open Positions - Enhanced */}
      <Card className="border-amber-900/20 bg-gradient-to-br from-neutral-950/80 to-black/40 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Zap className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Açık Pozisyonlar</CardTitle>
                <CardDescription>Şu anda aktif olan işlemler</CardDescription>
              </div>
            </div>
            {activePositions > 0 && (
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                {activePositions} Aktif
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activePositions === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-2xl bg-neutral-800/50 mb-4">
                <AlertCircle className="h-12 w-12 text-neutral-500" />
              </div>
              <p className="text-lg font-medium text-neutral-300">Şu anda açık pozisyon yok</p>
              <p className="text-sm text-neutral-500 mt-2 max-w-md">
                Bot uygun market koşulları ve pattern tespit ettiğinde otomatik olarak pozisyon açacak
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {overview?.openPositions?.map((position: any) => (
                <div
                  key={position.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all hover:bg-neutral-800/50",
                    position.direction === "LONG" 
                      ? "border-emerald-500/20 bg-emerald-500/5" 
                      : "border-red-500/20 bg-red-500/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      position.direction === "LONG" ? "bg-emerald-500/10" : "bg-red-500/10"
                    )}>
                      {position.direction === "LONG" ? (
                        <TrendingUp className="h-6 w-6 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-6 w-6 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{position.symbol}</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            position.direction === "LONG" 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                              : "bg-red-500/10 text-red-400 border-red-500/30"
                          )}
                        >
                          {position.direction}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-neutral-400 mt-1">
                        <span>Entry: ${position.entryPrice}</span>
                        <span>•</span>
                        <span>{position.pattern}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "text-xl font-bold",
                      parseFloat(position.pnl || "0") >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      {parseFloat(position.pnl || "0") >= 0 ? "+" : ""}${parseFloat(position.pnl || "0").toFixed(2)}
                    </div>
                    <div className={cn(
                      "text-sm",
                      parseFloat(position.pnlPercentage || "0") >= 0 ? "text-emerald-400/70" : "text-red-400/70"
                    )}>
                      {parseFloat(position.pnlPercentage || "0") >= 0 ? "+" : ""}{parseFloat(position.pnlPercentage || "0").toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Chart */}
      {performance && performance.length > 0 ? (
        <PerformanceChart data={performance} />
      ) : (
        <Card className="border-amber-900/20 bg-gradient-to-br from-neutral-950/80 to-black/40 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <BarChart3 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">7 Günlük Performans</CardTitle>
                <CardDescription>Son 7 günün günlük P&L grafiği</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-2xl bg-neutral-800/50 mb-4">
                <LineChart className="h-12 w-12 text-neutral-500" />
              </div>
              <p className="text-lg font-medium text-neutral-300">Henüz performans verisi yok</p>
              <p className="text-sm text-neutral-500 mt-2 max-w-md">
                Bot işlem yaptıkça performans verileri burada görselleştirilecek
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Learning Status */}
      <Card className="border-amber-900/20 bg-gradient-to-br from-neutral-950/80 to-black/40 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Brain className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Öğrenme Durumu</CardTitle>
              <CardDescription>Yapay zeka modelinin öğrenme istatistikleri</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-neutral-800/50 text-center">
              <div className="text-2xl font-bold text-white">{aiLearning?.modelVersion || "v1.0"}</div>
              <p className="text-xs text-neutral-500 mt-1">Model Versiyonu</p>
            </div>
            <div className="p-4 rounded-xl bg-neutral-800/50 text-center">
              <div className="text-2xl font-bold text-emerald-400">Aktif</div>
              <p className="text-xs text-neutral-500 mt-1">Öğrenme Durumu</p>
            </div>
            <div className="p-4 rounded-xl bg-neutral-800/50 text-center">
              <div className="text-2xl font-bold text-white">{aiLearning?.patternsLearned || 0}</div>
              <p className="text-xs text-neutral-500 mt-1">Öğrenilen Pattern</p>
            </div>
            <div className="p-4 rounded-xl bg-neutral-800/50 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {aiLearning?.performanceAfterTuning 
                  ? `${(parseFloat(aiLearning.performanceAfterTuning) * 100).toFixed(0)}%` 
                  : paperWinRate > 0 ? `${(paperWinRate).toFixed(0)}%` : 'N/A'}
              </div>
              <p className="text-xs text-neutral-500 mt-1">Tahmin Doğruluğu</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
