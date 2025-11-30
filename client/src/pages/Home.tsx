import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  Brain,
  Zap,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BotControlPanel } from "@/components/BotControlPanel";

const SUPPORTED_COINS = [
  { value: "BTCUSDT", label: "Bitcoin (BTC)", icon: "₿" },
  { value: "ETHUSDT", label: "Ethereum (ETH)", icon: "Ξ" },
  { value: "SOLUSDT", label: "Solana (SOL)", icon: "◎" },
];

export default function Home() {
  const [selectedCoin, setSelectedCoin] = useState("BTCUSDT");
  
  // Fetch real dashboard data
  const { data: overview, isLoading: overviewLoading } = trpc.dashboard.overview.useQuery();
  const { data: openPositions, isLoading: positionsLoading } = trpc.dashboard.openPositions.useQuery();
  const { data: aiLearning, isLoading: aiLoading } = trpc.dashboard.aiLearning.useQuery();
  const { data: performance, isLoading: perfLoading } = trpc.dashboard.performance.useQuery();

  const isLoading = overviewLoading || positionsLoading || aiLoading || perfLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-8 w-8 animate-pulse text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  const totalPnL = parseFloat(overview?.totalOpenPnl || "0");
  const winRate = parseFloat(overview?.todayPerformance?.winRate || "0");
  const totalTrades = overview?.todayPerformance?.totalTrades || 0;
  const activePositions = overview?.openPositionsCount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trading Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Otonom AI kripto trading bot'unuzun gerçek zamanlı performansı
          </p>
        </div>
        <Select value={selectedCoin} onValueChange={setSelectedCoin}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_COINS.map((coin) => (
              <SelectItem key={coin.value} value={coin.value}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{coin.icon}</span>
                  <span>{coin.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bot Control Panel */}
      <BotControlPanel />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total P&L */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              totalPnL >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tüm zamanlar
            </p>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarı Oranı</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(winRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalTrades} işlem
            </p>
          </CardContent>
        </Card>

        {/* Active Positions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Açık Pozisyonlar</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePositions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activePositions > 0 ? "Aktif işlemler" : "Pozisyon yok"}
            </p>
          </CardContent>
        </Card>

        {/* AI Learning Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Öğrenme</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="default">
                Aktif
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {aiLearning?.modelVersion || "Model v1.0"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Open Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Açık Pozisyonlar
          </CardTitle>
          <CardDescription>
            Şu anda aktif olan işlemler
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activePositions === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Şu anda açık pozisyon yok</p>
              <p className="text-sm text-muted-foreground mt-1">
                Bot uygun pattern tespit ettiğinde otomatik pozisyon açacak
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {overview?.openPositions?.map((position: any) => (
                <div
                  key={position.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      position.direction === "LONG" ? "bg-green-500/10" : "bg-red-500/10"
                    )}>
                      {position.direction === "LONG" ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{position.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {position.pattern} • ${position.entryPrice}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "font-medium",
                      position.currentPnL >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {position.currentPnL >= 0 ? "+" : ""}${position.currentPnL.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {position.currentPnL >= 0 ? "+" : ""}{(position.currentPnL / position.entryPrice * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>7 Günlük Performans</CardTitle>
          <CardDescription>
            Son 7 günün günlük P&L grafiği
          </CardDescription>
        </CardHeader>
        <CardContent>
          {performance && performance.length > 0 ? (
            <div className="space-y-2">
              {performance.map((day: any) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{day.date}</span>
                  <span className={cn(
                    "text-sm font-medium",
                    day.pnl >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {day.pnl >= 0 ? "+" : ""}${day.pnl.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Henüz performans verisi yok</p>
              <p className="text-sm text-muted-foreground mt-1">
                Bot işlem yaptıkça veriler burada görünecek
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
