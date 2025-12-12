import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Play, Square, RefreshCw, Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useCallback } from "react";

const SUPPORTED_COINS = [
  { symbol: "BTCUSDT", name: "Bitcoin", icon: "₿" },
  { symbol: "ETHUSDT", name: "Ethereum", icon: "Ξ" },
  { symbol: "SOLUSDT", name: "Solana", icon: "◎" },
];

export function BotControlPanel() {
  const { data: botStatus, refetch } = trpc.bot.status.useQuery(undefined, {
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const startBot = trpc.bot.start.useMutation({
    onSuccess: () => refetch(),
  });

  const stopBot = trpc.bot.stop.useMutation({
    onSuccess: () => refetch(),
  });

  const handleToggle = (symbol: string, currentlyRunning: boolean) => {
    if (currentlyRunning) {
      stopBot.mutate({ symbol });
    } else {
      startBot.mutate({ symbol });
    }
  };

  const handleStartAll = useCallback(() => {
    console.log('[BotControlPanel] handleStartAll clicked');
    console.log('[BotControlPanel] botStatus:', botStatus);
    console.log('[BotControlPanel] SUPPORTED_COINS:', SUPPORTED_COINS);
    
    SUPPORTED_COINS.forEach(coin => {
      const isRunning = botStatus?.bots?.find((b: any) => b.symbol === coin.symbol)?.status === 'running';
      console.log(`[BotControlPanel] ${coin.symbol} - isRunning:`, isRunning);
      
      if (!isRunning) {
        console.log(`[BotControlPanel] Starting ${coin.symbol}...`);
        startBot.mutate({ symbol: coin.symbol });
      } else {
        console.log(`[BotControlPanel] ${coin.symbol} already running, skipping`);
      }
    });
  }, [botStatus, startBot]);

  const handleStopAll = () => {
    SUPPORTED_COINS.forEach(coin => {
      const isRunning = botStatus?.bots?.find((b: any) => b.symbol === coin.symbol)?.status === 'running';
      if (isRunning) {
        stopBot.mutate({ symbol: coin.symbol });
      }
    });
  };

  const runningCount = botStatus?.bots?.filter((b: any) => b.status === 'running').length || 0;
  const allRunning = runningCount === SUPPORTED_COINS.length;
  const noneRunning = runningCount === 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Bot Kontrol Paneli
            </CardTitle>
            <CardDescription>
              Trading bot'larını başlatın, durdurun ve izleyin
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleStartAll}
              disabled={allRunning || startBot.isPending}
            >
              <Play className="h-4 w-4 mr-1" />
              Tümünü Başlat
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleStopAll}
              disabled={noneRunning || stopBot.isPending}
            >
              <Square className="h-4 w-4 mr-1" />
              Tümünü Durdur
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {SUPPORTED_COINS.map((coin) => {
            const bot = botStatus?.bots?.find((b: any) => b.symbol === coin.symbol);
            const isRunning = bot?.status === 'running';
            const isError = bot?.status === 'error';
            const isStopped = bot?.status === 'stopped' || !bot;

            return (
              <div
                key={coin.symbol}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{coin.icon}</span>
                  <div>
                    <div className="font-medium">{coin.name}</div>
                    <div className="text-sm text-muted-foreground">{coin.symbol}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Status Badge */}
                  {isRunning && (
                    <Badge variant="default" className="bg-green-500">
                      <Activity className="h-3 w-3 mr-1 animate-pulse" />
                      Çalışıyor
                    </Badge>
                  )}
                  {isStopped && (
                    <Badge variant="secondary">
                      Durduruldu
                    </Badge>
                  )}
                  {isError && (
                    <Badge variant="destructive">
                      Hata
                    </Badge>
                  )}

                  {/* Process Info */}
                  {bot?.pid && (
                    <div className="text-xs text-muted-foreground">
                      PID: {bot.pid}
                    </div>
                  )}

                  {/* Uptime */}
                  {bot?.startedAt && isRunning && (
                    <div className="text-xs text-muted-foreground">
                      {formatUptime(bot.startedAt)}
                    </div>
                  )}

                  {/* Toggle Switch */}
                  <Switch
                    checked={isRunning}
                    onCheckedChange={() => handleToggle(coin.symbol, isRunning)}
                    disabled={startBot.isPending || stopBot.isPending}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Aktif Bot Sayısı:</span>
            <span className="font-medium text-foreground">{runningCount} / {SUPPORTED_COINS.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatUptime(startedAt: string): string {
  const start = new Date(startedAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}g ${diffHours % 24}s`;
  if (diffHours > 0) return `${diffHours}s ${diffMins % 60}d`;
  return `${diffMins}d`;
}
