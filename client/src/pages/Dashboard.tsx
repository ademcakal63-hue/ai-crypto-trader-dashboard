import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Activity, Brain, Target, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = trpc.dashboard.summary.useQuery();
  const { data: tradeHistory, isLoading: historyLoading } = trpc.dashboard.tradeHistory.useQuery();
  const { data: performance, isLoading: perfLoading } = trpc.dashboard.performance.useQuery();

  if (summaryLoading) {
    return <DashboardSkeleton />;
  }

  const todayPerf = summary?.todayPerformance;
  const aiLearning = summary?.aiLearning;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Brain className="w-7 h-7 text-blue-500" />
                AI Crypto Trader
              </h1>
              <p className="text-sm text-slate-400 mt-1">Otonom Trading Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-400">Model Version</p>
                <p className="text-sm font-semibold text-blue-400">{aiLearning?.modelVersion || 'v1.0'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Testnet Mode</p>
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                  ACTIVE
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Ana Metrikler */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Bakiye */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Mevcut Bakiye</CardDescription>
              <CardTitle className="text-3xl text-white">
                ${todayPerf?.endingBalance || '1,500.00'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">Başlangıç:</span>
                <span className="text-slate-300">${todayPerf?.startingBalance || '1,500.00'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Günlük P&L */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Bugünkü Kâr/Zarar</CardDescription>
              <CardTitle className={`text-3xl ${
                parseFloat(todayPerf?.dailyPnl || '0') >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {todayPerf?.dailyPnl || '+0.00'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {parseFloat(todayPerf?.dailyPnlPercentage || '0') >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm font-semibold ${
                  parseFloat(todayPerf?.dailyPnlPercentage || '0') >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {todayPerf?.dailyPnlPercentage || '+0.00'}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Açık Pozisyonlar */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Açık Pozisyonlar</CardDescription>
              <CardTitle className="text-3xl text-white">
                {summary?.openPositionsCount || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-300">
                  Toplam P&L: {summary?.totalOpenPnl || '0.00'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Başarı Oranı */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Başarı Oranı (Bugün)</CardDescription>
              <CardTitle className="text-3xl text-white">
                {todayPerf?.winRate || '0.00'}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-green-400">{todayPerf?.winningTrades || 0} Kazanan</span>
                <span className="text-slate-400">/</span>
                <span className="text-red-400">{todayPerf?.losingTrades || 0} Kaybeden</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Açık Pozisyonlar Tablosu */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Açık Pozisyonlar
            </CardTitle>
            <CardDescription className="text-slate-400">
              Şu anda aktif olan işlemler
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary?.openPositions && summary.openPositions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Sembol</TableHead>
                      <TableHead className="text-slate-400">Yön</TableHead>
                      <TableHead className="text-slate-400">Giriş</TableHead>
                      <TableHead className="text-slate-400">Mevcut</TableHead>
                      <TableHead className="text-slate-400">SL</TableHead>
                      <TableHead className="text-slate-400">TP</TableHead>
                      <TableHead className="text-slate-400">P&L</TableHead>
                      <TableHead className="text-slate-400">Pattern</TableHead>
                      <TableHead className="text-slate-400">Süre</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.openPositions.map((pos) => (
                      <TableRow key={pos.id} className="border-slate-800">
                        <TableCell className="font-semibold text-white">{pos.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={pos.direction === 'LONG' ? 'default' : 'destructive'} className={
                            pos.direction === 'LONG' 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }>
                            {pos.direction}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">${pos.entryPrice}</TableCell>
                        <TableCell className="text-slate-300">${pos.currentPrice}</TableCell>
                        <TableCell className="text-red-400">${pos.stopLoss}</TableCell>
                        <TableCell className="text-green-400">${pos.takeProfit}</TableCell>
                        <TableCell className={parseFloat(pos.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}>
                          <div className="flex flex-col">
                            <span className="font-semibold">{pos.pnl}</span>
                            <span className="text-xs">{pos.pnlPercentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-300">{pos.pattern}</span>
                            <Badge variant="outline" className="w-fit text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
                              {pos.confidence}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {getTimeDiff(pos.openedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Şu anda açık pozisyon yok</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* İşlem Geçmişi */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">İşlem Geçmişi</CardTitle>
            <CardDescription className="text-slate-400">
              Son 50 kapatılmış işlem
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full bg-slate-800" />
                ))}
              </div>
            ) : tradeHistory && tradeHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Sembol</TableHead>
                      <TableHead className="text-slate-400">Yön</TableHead>
                      <TableHead className="text-slate-400">Giriş</TableHead>
                      <TableHead className="text-slate-400">Çıkış</TableHead>
                      <TableHead className="text-slate-400">P&L</TableHead>
                      <TableHead className="text-slate-400">R Oranı</TableHead>
                      <TableHead className="text-slate-400">Sonuç</TableHead>
                      <TableHead className="text-slate-400">Pattern</TableHead>
                      <TableHead className="text-slate-400">Tarih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tradeHistory.slice(0, 10).map((trade) => (
                      <TableRow key={trade.id} className="border-slate-800">
                        <TableCell className="font-semibold text-white">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={trade.direction === 'LONG' ? 'default' : 'destructive'} className={
                            trade.direction === 'LONG' 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }>
                            {trade.direction}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">${trade.entryPrice}</TableCell>
                        <TableCell className="text-slate-300 text-sm">${trade.exitPrice}</TableCell>
                        <TableCell className={parseFloat(trade.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}>
                          <div className="flex flex-col">
                            <span className="font-semibold">{trade.pnl}</span>
                            <span className="text-xs">{trade.pnlPercentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell className={parseFloat(trade.rRatio) >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {trade.rRatio}R
                        </TableCell>
                        <TableCell>
                          <Badge variant={trade.result === 'WIN' ? 'default' : 'destructive'} className={
                            trade.result === 'WIN'
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }>
                            {trade.result}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs">{trade.pattern}</TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {new Date(trade.closedAt).toLocaleDateString('tr-TR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Henüz işlem geçmişi yok</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 bg-slate-800" />
          ))}
        </div>
        <Skeleton className="h-96 bg-slate-800" />
      </div>
    </div>
  );
}

function getTimeDiff(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffHours > 0) {
    return `${diffHours} saat önce`;
  }
  return `${diffMins} dk önce`;
}
