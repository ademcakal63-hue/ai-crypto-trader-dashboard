import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Square, 
  RefreshCw, 
  Activity, 
  Cpu, 
  Zap,
  TrendingUp,
  Clock,
  Settings2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

const SUPPORTED_COINS = [
  { symbol: "BTCUSDT", name: "Bitcoin", icon: "₿", color: "from-amber-500 to-orange-600" },
];

export function BotControlPanel() {
  const [uptime, setUptime] = useState<string>("");
  
  const { data: botStatus, refetch } = trpc.botControl.status.useQuery(undefined, {
    refetchInterval: 5000,
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

  // Update uptime every second
  useEffect(() => {
    if (!isRunning) {
      setUptime("");
      return;
    }

    const coinBot = botStatus?.bots?.find(b => b.status === 'running');
    if (!coinBot?.startedAt) return;

    const updateUptime = () => {
      const start = new Date(coinBot.startedAt);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        setUptime(`${diffDays}g ${diffHours % 24}s ${diffMins % 60}d`);
      } else if (diffHours > 0) {
        setUptime(`${diffHours}s ${diffMins % 60}d ${diffSecs % 60}sn`);
      } else if (diffMins > 0) {
        setUptime(`${diffMins}d ${diffSecs % 60}sn`);
      } else {
        setUptime(`${diffSecs}sn`);
      }
    };

    updateUptime();
    const interval = setInterval(updateUptime, 1000);
    return () => clearInterval(interval);
  }, [isRunning, botStatus]);

  return (
    <Card className="border-amber-900/20 bg-gradient-to-br from-neutral-950/80 to-black/40 backdrop-blur overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-xl border",
              isRunning 
                ? "bg-emerald-500/10 border-emerald-500/20" 
                : "bg-neutral-800/50 border-neutral-700/30"
            )}>
              <Cpu className={cn(
                "h-5 w-5",
                isRunning ? "text-emerald-400" : "text-neutral-400"
              )} />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Bot Kontrol Paneli
                {isRunning && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </CardTitle>
              <CardDescription>Trading bot'larını başlatın, durdurun ve izleyin</CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleStartAll}
              disabled={allRunning || startBot.isPending}
              className={cn(
                "border-neutral-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all",
                startBot.isPending && "opacity-50"
              )}
            >
              <Play className="h-4 w-4 mr-1.5" />
              Tümünü Başlat
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleStopAll}
              disabled={noneRunning || stopBot.isPending}
              className={cn(
                "border-neutral-800 hover:border-red-500/50 hover:bg-red-500/10 transition-all",
                stopBot.isPending && "opacity-50"
              )}
            >
              <Square className="h-4 w-4 mr-1.5" />
              Tümünü Durdur
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetch()}
              className="hover:bg-neutral-800"
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                (startBot.isPending || stopBot.isPending) && "animate-spin"
              )} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {SUPPORTED_COINS.map((coin) => {
          const coinBot = botStatus?.bots?.find(b => b.symbol === coin.symbol);
          const coinIsRunning = coinBot?.status === 'running';

          return (
            <div
              key={coin.symbol}
              className={cn(
                "relative overflow-hidden rounded-xl border transition-all duration-300",
                coinIsRunning 
                  ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-transparent" 
                  : "border-neutral-800/50 bg-neutral-800/30 hover:border-neutral-700/50"
              )}
            >
              {/* Animated gradient border for running state */}
              {coinIsRunning && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 animate-pulse" />
              )}
              
              <div className="relative p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Coin Icon with gradient background */}
                    <div className={cn(
                      "relative w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold",
                      `bg-gradient-to-br ${coin.color}`,
                      "shadow-lg"
                    )}>
                      <span className="text-white drop-shadow">{coin.icon}</span>
                      {coinIsRunning && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                          <Activity className="w-2.5 h-2.5 text-white animate-pulse" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-lg">{coin.name}</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs font-mono",
                            coinIsRunning 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                              : "bg-neutral-800/50 text-neutral-400 border-neutral-700/50"
                          )}
                        >
                          {coin.symbol}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1">
                        {coinIsRunning ? (
                          <>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-0 gap-1">
                              <Zap className="h-3 w-3" />
                              Çalışıyor
                            </Badge>
                            {coinBot?.pid && (
                              <span className="text-xs text-neutral-500 font-mono">
                                PID: {coinBot.pid}
                              </span>
                            )}
                          </>
                        ) : (
                          <Badge variant="secondary" className="bg-neutral-800/50 text-neutral-400 border-0">
                            Durduruldu
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Uptime display */}
                    {coinIsRunning && uptime && (
                      <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                          <Clock className="h-3 w-3" />
                          Çalışma Süresi
                        </div>
                        <div className="text-sm font-mono text-neutral-300">{uptime}</div>
                      </div>
                    )}
                    
                    {/* Toggle Switch */}
                    <div className="flex flex-col items-center gap-1">
                      <Switch
                        checked={coinIsRunning}
                        onCheckedChange={handleToggle}
                        disabled={startBot.isPending || stopBot.isPending}
                        className={cn(
                          "data-[state=checked]:bg-emerald-500",
                          (startBot.isPending || stopBot.isPending) && "opacity-50"
                        )}
                      />
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                        {coinIsRunning ? "ON" : "OFF"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Summary Footer */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/50 border border-neutral-800/50">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Settings2 className="h-4 w-4" />
            <span>Aktif Bot Sayısı:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-lg font-bold",
              isRunning ? "text-emerald-400" : "text-neutral-400"
            )}>
              {isRunning ? 1 : 0}
            </span>
            <span className="text-neutral-500">/ {SUPPORTED_COINS.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
