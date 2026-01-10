import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TradeUpdate } from '@/api/websocketService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StockChartProps {
  trades: TradeUpdate[];
}

const StockChart: React.FC<StockChartProps> = ({ trades }) => {
  const [selectedTicker, setSelectedTicker] = useState<string>('ALL');

  // Get unique tickers from trades
  const availableTickers = useMemo(() => {
    const tickers = new Set(trades.map((t) => t.ticker));
    return ['ALL', ...Array.from(tickers).sort()];
  }, [trades]);

  // Filter and format data for the chart
  const chartData = useMemo(() => {
    const filtered =
      selectedTicker === 'ALL'
        ? trades
        : trades.filter((t) => t.ticker === selectedTicker);

    return filtered
      .slice()
      .reverse()
      .map((trade) => ({
        time: new Date(trade.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        price: trade.price,
        ticker: trade.ticker,
        type: trade.type,
      }));
  }, [trades, selectedTicker]);

  // Determine trend color based on first and last price
  const trendInfo = useMemo(() => {
    if (chartData.length < 2) {
      return { color: 'hsl(var(--muted-foreground))', isUp: null };
    }
    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    const isUp = lastPrice >= firstPrice;
    return {
      color: isUp ? 'hsl(var(--success))' : 'hsl(var(--destructive))',
      isUp,
    };
  }, [chartData]);

  // Calculate price change percentage
  const priceChange = useMemo(() => {
    if (chartData.length < 2) return null;
    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;
    return change.toFixed(2);
  }, [chartData]);

  return (
    <Card className="h-full bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-mono text-foreground">
              Price Chart
            </CardTitle>
            {priceChange !== null && (
              <div
                className={`flex items-center gap-1 text-sm font-mono ${
                  trendInfo.isUp ? 'text-success' : 'text-destructive'
                }`}
              >
                {trendInfo.isUp ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{trendInfo.isUp ? '+' : ''}{priceChange}%</span>
              </div>
            )}
          </div>
          <Select value={selectedTicker} onValueChange={setSelectedTicker}>
            <SelectTrigger className="w-[140px] bg-background border-border font-mono">
              <SelectValue placeholder="Select ticker" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {availableTickers.map((ticker) => (
                <SelectItem
                  key={ticker}
                  value={ticker}
                  className="font-mono cursor-pointer"
                >
                  {ticker}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-4rem)]">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground font-mono">
            No trade data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => [
                  `$${value.toFixed(2)}`,
                  'Price',
                ]}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={trendInfo.color}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: trendInfo.color,
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2,
                }}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default StockChart;
