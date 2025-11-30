import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PerformanceData {
  date: string;
  dailyPnl: string;
  winRate: string;
  totalTrades: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  // Prepare chart data
  const chartData = {
    labels: data.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Günlük P&L ($)',
        data: data.map(d => parseFloat(d.dailyPnl)),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: data.map(d => parseFloat(d.dailyPnl) >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'),
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            return data[index].date;
          },
          label: (context: any) => {
            const index = context.dataIndex;
            const item = data[index];
            return [
              `P&L: $${parseFloat(item.dailyPnl).toFixed(2)}`,
              `Win Rate: ${parseFloat(item.winRate).toFixed(1)}%`,
              `İşlem: ${item.totalTrades}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          callback: (value: any) => `$${value}`,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  // Calculate summary stats
  const totalPnL = data.reduce((sum, d) => sum + parseFloat(d.dailyPnl), 0);
  const avgWinRate = data.reduce((sum, d) => sum + parseFloat(d.winRate), 0) / data.length;
  const totalTrades = data.reduce((sum, d) => sum + d.totalTrades, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              7 Günlük Performans
            </CardTitle>
            <CardDescription>
              Son 7 günün günlük P&L grafiği
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-500">
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              Toplam P&L
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Line data={chartData} options={options} />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Ortalama Win Rate</div>
            <div className="text-lg font-semibold">{avgWinRate.toFixed(1)}%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Toplam İşlem</div>
            <div className="text-lg font-semibold">{totalTrades}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Günlük Ortalama</div>
            <div className="text-lg font-semibold">
              ${(totalPnL / data.length).toFixed(2)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
