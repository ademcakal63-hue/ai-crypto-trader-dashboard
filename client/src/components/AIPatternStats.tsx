import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, Target, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PatternStat {
  name: string;
  totalTrades: number;
  winRate: number;
  avgRRatio: number;
  totalPnl: number;
  confidence: number;
}

interface AIPatternStatsProps {
  patterns: PatternStat[];
  modelVersion: string;
  lastUpdate: Date;
}

export default function AIPatternStats({ patterns, modelVersion, lastUpdate }: AIPatternStatsProps) {
  // En başarılı pattern
  const bestPattern = patterns.reduce((best, current) => 
    current.totalPnl > best.totalPnl ? current : best
  , patterns[0]);

  // Toplam istatistikler
  const totalTrades = patterns.reduce((sum, p) => sum + p.totalTrades, 0);
  const avgWinRate = patterns.reduce((sum, p) => sum + p.winRate, 0) / patterns.length;

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          AI Pattern Analizi
        </CardTitle>
        <CardDescription className="text-slate-400">
          Model {modelVersion} • Son güncelleme: {new Date(lastUpdate).toLocaleDateString('tr-TR')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Özet Kartlar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-400" />
              <p className="text-xs text-purple-300">Toplam İşlem</p>
            </div>
            <p className="text-2xl font-bold text-white">{totalTrades}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <p className="text-xs text-green-300">Ort. Başarı</p>
            </div>
            <p className="text-2xl font-bold text-white">{avgWinRate.toFixed(1)}%</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-blue-300">En İyi</p>
            </div>
            <p className="text-sm font-bold text-white truncate">{bestPattern?.name || 'N/A'}</p>
          </div>
        </div>

        {/* Pattern Listesi */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-300">Pattern Performansı</h4>
          {patterns.map((pattern, index) => (
            <div 
              key={index}
              className="bg-slate-800/50 rounded-lg p-4 space-y-3 hover:bg-slate-800/70 transition-colors"
            >
              {/* Pattern Başlığı */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    pattern.winRate >= 70 ? 'bg-green-500' :
                    pattern.winRate >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <span className="font-semibold text-white">{pattern.name}</span>
                </div>
                <Badge 
                  variant="outline" 
                  className="bg-blue-500/10 text-blue-400 border-blue-500/30"
                >
                  Güven: {pattern.confidence}
                </Badge>
              </div>

              {/* Metrikler */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-slate-400">İşlem</p>
                  <p className="text-sm font-semibold text-white">{pattern.totalTrades}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Başarı</p>
                  <p className={`text-sm font-semibold ${
                    pattern.winRate >= 70 ? 'text-green-400' :
                    pattern.winRate >= 50 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {pattern.winRate.toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">R Oranı</p>
                  <p className="text-sm font-semibold text-blue-400">{pattern.avgRRatio}R</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Toplam P&L</p>
                  <p className={`text-sm font-semibold ${
                    pattern.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {pattern.totalPnl >= 0 ? '+' : ''}{pattern.totalPnl.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-700">
                <div 
                  className={`h-full transition-all ${
                    pattern.winRate >= 70 ? 'bg-green-500' :
                    pattern.winRate >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${pattern.winRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Öğrenme Notları */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-purple-300 mb-1">AI Öğrenme Durumu</p>
              <p className="text-xs text-slate-400">
                Sistem {patterns.length} farklı pattern öğrendi ve toplam {totalTrades} işlemde test etti. 
                En yüksek performans <span className="text-green-400 font-semibold">{bestPattern?.name}</span> pattern'inde 
                gözlemlendi (%{bestPattern?.winRate.toFixed(0)} başarı oranı).
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
