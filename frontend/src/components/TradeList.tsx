import React from 'react';
import { TradeUpdate } from '@/api/websocketService';
import { ArrowUpRight, ArrowDownRight, Clock, Activity } from 'lucide-react';

interface TradeListProps {
  trades: TradeUpdate[];
}

const TradeList: React.FC<TradeListProps> = ({ trades }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Live Market Feed</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>{trades.length} trades</span>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-muted/30 border-b border-border text-xs font-mono uppercase tracking-wider text-muted-foreground">
        <div>Type</div>
        <div>Ticker</div>
        <div className="text-right">Price</div>
        <div className="text-right">Qty</div>
        <div className="text-right">Time</div>
      </div>

      {/* Trade Rows */}
      <div className="flex-1 overflow-y-auto scrollbar-terminal">
        {trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
            <Activity className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm">Waiting for trades...</p>
            <p className="text-xs mt-1">Connect to see live market data</p>
          </div>
        ) : (
          trades.map((trade, index) => (
            <div
              key={trade.id || index}
              className={`grid grid-cols-5 gap-4 px-4 py-3 border-b border-border/50 hover:bg-muted/20 transition-colors trade-row-enter ${
                index === 0 ? 'bg-muted/10' : ''
              }`}
            >
              {/* Type Badge */}
              <div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-medium ${
                    trade.type === 'BUY'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {trade.type === 'BUY' ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {trade.type}
                </span>
              </div>

              {/* Ticker */}
              <div className="font-mono font-semibold">{trade.ticker}</div>

              {/* Price */}
              <div
                className={`text-right font-mono font-medium ${
                  trade.type === 'BUY' ? 'text-primary' : 'text-destructive'
                }`}
              >
                {formatPrice(trade.price)}
              </div>

              {/* Quantity */}
              <div className="text-right font-mono text-muted-foreground">
                {trade.quantity.toLocaleString()}
              </div>

              {/* Time */}
              <div className="text-right font-mono text-xs text-muted-foreground">
                {formatTime(trade.timestamp)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TradeList;
