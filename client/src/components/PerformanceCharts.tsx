import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, PieChartIcon } from "lucide-react";

interface PerformanceData {
  date: string;
  balance: number;
  dailyPnl: number;
  drawdown: number;
}

interface RRatioData {
  range: string;
  count: number;
}

interface WinLossData {
  name: string;
  value: number;
  color: string;
}

interface PerformanceChartsProps {
  performanceHistory: any[];
  tradeHistory: any[];
}

export default function PerformanceCharts({ performanceHistory, tradeHistory }: PerformanceChartsProps) {
  // Equity Curve Data
  const equityData: PerformanceData[] = performanceHistory.map(p => ({
    date: new Date(p.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
    balance: parseFloat(p.endingBalance),
    dailyPnl: parseFloat(p.dailyPnl),
    drawdown: 0, // Hesaplanacak
  }));

  // Drawdown hesapla
  let peak = equityData[0]?.balance || 1500;
  equityData.forEach(d => {
    if (d.balance > peak) peak = d.balance;
    d.drawdown = ((d.balance - peak) / peak) * 100;
  });

  // Günlük P&L Bar Chart Data
  const dailyPnlData = performanceHistory.map(p => ({
    date: new Date(p.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
    pnl: parseFloat(p.dailyPnl),
  }));

  // R Oranı Dağılımı
  const rRatioRanges = [
    { range: '<-2R', min: -Infinity, max: -2 },
    { range: '-2R to -1R', min: -2, max: -1 },
    { range: '-1R to 0R', min: -1, max: 0 },
    { range: '0R to 1R', min: 0, max: 1 },
    { range: '1R to 2R', min: 1, max: 2 },
    { range: '2R to 3R', min: 2, max: 3 },
    { range: '>3R', min: 3, max: Infinity },
  ];

  const rRatioData: RRatioData[] = rRatioRanges.map(range => ({
    range: range.range,
    count: tradeHistory.filter(t => {
      const rRatio = parseFloat(t.rRatio);
      return rRatio >= range.min && rRatio < range.max;
    }).length,
  }));

  // Win/Loss Pie Chart
  const totalWins = tradeHistory.filter(t => t.result === 'WIN').length;
  const totalLosses = tradeHistory.filter(t => t.result === 'LOSS').length;
  
  const winLossData: WinLossData[] = [
    { name: 'Kazanan', value: totalWins, color: '#22c55e' },
    { name: 'Kaybeden', value: totalLosses, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Equity Curve */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Equity Curve
          </CardTitle>
          <CardDescription className="text-slate-400">
            Bakiye değişimi (zaman serisi)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorBalance)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Günlük P&L */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Günlük Kâr/Zarar
            </CardTitle>
            <CardDescription className="text-slate-400">
              Günlük performans dağılımı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyPnlData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar 
                  dataKey="pnl" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                >
                  {dailyPnlData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win/Loss Oranı */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-purple-500" />
              Kazanma/Kaybetme Oranı
            </CardTitle>
            <CardDescription className="text-slate-400">
              Toplam işlem dağılımı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-slate-300">Kazanan: {totalWins}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-slate-300">Kaybeden: {totalLosses}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* R Oranı Dağılımı */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-yellow-500" />
            R Oranı Dağılımı
          </CardTitle>
          <CardDescription className="text-slate-400">
            İşlemlerin risk/ödül dağılımı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rRatioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="range" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar 
                dataKey="count" 
                fill="#eab308"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Drawdown Grafiği */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Drawdown
          </CardTitle>
          <CardDescription className="text-slate-400">
            Maksimum düşüş (peak'ten düşüş yüzdesi)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
                formatter={(value: number) => `${value.toFixed(2)}%`}
              />
              <Area 
                type="monotone" 
                dataKey="drawdown" 
                stroke="#ef4444" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorDrawdown)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
