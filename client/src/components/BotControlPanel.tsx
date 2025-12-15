import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Play, Square, RefreshCw, Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useCallback } from "react";

const SUPPORTED_COINS = [
  { symbol: "BTCUSDT", name: "Bitcoin", icon: "₿" },
  // { symbol: "ETHUSDT", name: "Ethereum", icon: "Ξ" },  // Disabled for cost optimization
  // { symbol: "SOLUSDT", name: "Solana", icon: "◎" },  // Disabled for cost optimization
];

export function BotControlPanel() {
  const { data: botStatus, refetch } = trpc.botControl.status.useQuery(undefined, {
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const startBot = trpc.botControl.start.useMutation({
    onSuccess: () => refetch(),
  });

  const stopBot = trpc.botControl.stop.useMutation({
    onSuccess: () => refetch(),
  });

  const handleToggle = () => {
    if (botStatus?.totalRunning && botStatus.totalRunning > 0) {
      stopBot.mutate();
    } else {
      startBot.mutate();
    }
  };

  const handleStartAll = useCallback(() => {
    if (!botStatus?.totalRunning || botStatus.totalRunning === 0) {
      startBot.mutate();
    }
  }, [botStatus, startBot]);

  const handleStopAll = () => {
    if (botStatus?.totalRunning && botStatus.totalRunning > 0) {
      stopBot.mutate();
    }
  };

  const isRunning = (botStatus?.totalRunning || 0) > 0;
  const allRunning = isRunning;
  const noneRunning = !isRunning;

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
            const coinBot = botStatus?.bots?.find(b => b.symbol === coin.symbol);
            const coinIsRunning = coinBot?.status === 'running';

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
                  {coinIsRunning && (
                    <Badge variant="default" className="bg-green-500">
                      <Activity className="h-3 w-3 mr-1 animate-pulse" />
                      Çalışıyor
                    </Badge>
                  )}
                  {!coinIsRunning && (
                    <Badge variant="secondary">
                      Durduruldu
                    </Badge>
                  )}

                  {/* Process Info */}
                  {coinIsRunning && coinBot?.pid && (
                    <div className="text-xs text-muted-foreground">
                      PID: {coinBot.pid}
                    </div>
                  )}

                  {/* Toggle Switch */}
                  <Switch
                    checked={coinIsRunning}
                    onCheckedChange={handleToggle}
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
            <span className="font-medium text-foreground">{isRunning ? 1 : 0} / {SUPPORTED_COINS.length}</span>
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
