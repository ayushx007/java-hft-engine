import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/api/axiosConfig';
import { websocketService } from '@/api/websocketService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';

interface OrderLevel {
  price: number;
  quantity: number;
}

interface OrderBookData {
  ticker: string;
  bids: OrderLevel[];
  asks: OrderLevel[];
}

const STOCK_TICKERS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'JPM', 'V', 'WMT'];

const OrderBook: React.FC = () => {
  const [selectedTicker, setSelectedTicker] = useState<string>('AAPL');
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderBook = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<OrderBookData>(`/api/orderbook/${selectedTicker}`);
      setOrderBook(response.data);
    } catch (err) {
      console.error('Failed to fetch order book:', err);
      if (!silent) setError('Failed to load order book');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedTicker]);

  useEffect(() => {
    fetchOrderBook();
  }, [fetchOrderBook]);

  // Subscribe to trade updates to refresh order book
  useEffect(() => {
    const unsubscribe = websocketService.onTrade((trade) => {
      if (trade.ticker === selectedTicker) {
        // Refresh order book when a trade happens for this ticker
        fetchOrderBook(true);
      }
    });

    return () => unsubscribe();
  }, [selectedTicker, fetchOrderBook]);

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatQuantity = (qty: number) => qty.toLocaleString();

  const maxQuantity = orderBook 
    ? Math.max(
        ...orderBook.bids.map(b => b.quantity),
        ...orderBook.asks.map(a => a.quantity),
        1
      )
    : 1;

  const getBarWidth = (quantity: number) => `${(quantity / maxQuantity) * 100}%`;

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Order Book</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-32">
          <p className="text-destructive mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchOrderBook()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Order Book
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedTicker} onValueChange={setSelectedTicker}>
              <SelectTrigger className="w-24 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STOCK_TICKERS.map(ticker => (
                  <SelectItem key={ticker} value={ticker}>{ticker}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => fetchOrderBook()}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col gap-2">
        {/* Header */}
        <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground px-1">
          <span>Price</span>
          <span className="text-center">Qty</span>
          <span className="text-right">Total</span>
        </div>

        {/* Asks (Sell Orders) - sorted high to low, displayed top to bottom */}
        <div className="flex-1 overflow-y-auto space-y-0.5">
          <div className="flex items-center gap-1 text-xs text-red-500 mb-1">
            <TrendingUp className="w-3 h-3" />
            <span className="font-medium">Asks (Sell)</span>
          </div>
          
          {(!orderBook || orderBook.asks.length === 0) ? (
            <div className="text-xs text-muted-foreground text-center py-2">
              No sell orders
            </div>
          ) : (
            [...orderBook.asks].reverse().map((ask, idx) => {
              const runningTotal = orderBook.asks
                .slice(0, orderBook.asks.length - idx)
                .reduce((sum, a) => sum + a.quantity, 0);
              
              return (
                <div 
                  key={`ask-${idx}`}
                  className="relative grid grid-cols-3 text-xs py-0.5 px-1 hover:bg-muted/50 rounded"
                >
                  <div 
                    className="absolute inset-0 bg-red-500/10 rounded"
                    style={{ width: getBarWidth(ask.quantity) }}
                  />
                  <span className="relative text-red-500 font-medium">
                    {formatPrice(ask.price)}
                  </span>
                  <span className="relative text-center">
                    {formatQuantity(ask.quantity)}
                  </span>
                  <span className="relative text-right text-muted-foreground">
                    {formatQuantity(runningTotal)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Spread Indicator */}
        {orderBook && orderBook.asks.length > 0 && orderBook.bids.length > 0 && (
          <div className="text-center py-1 border-y border-border my-1">
            <span className="text-xs text-muted-foreground">
              Spread: {formatPrice(orderBook.asks[0].price - orderBook.bids[0].price)}
            </span>
          </div>
        )}

        {/* Bids (Buy Orders) - sorted high to low */}
        <div className="flex-1 overflow-y-auto space-y-0.5">
          <div className="flex items-center gap-1 text-xs text-green-500 mb-1">
            <TrendingDown className="w-3 h-3" />
            <span className="font-medium">Bids (Buy)</span>
          </div>
          
          {(!orderBook || orderBook.bids.length === 0) ? (
            <div className="text-xs text-muted-foreground text-center py-2">
              No buy orders
            </div>
          ) : (
            orderBook.bids.map((bid, idx) => {
              const runningTotal = orderBook.bids
                .slice(0, idx + 1)
                .reduce((sum, b) => sum + b.quantity, 0);
              
              return (
                <div 
                  key={`bid-${idx}`}
                  className="relative grid grid-cols-3 text-xs py-0.5 px-1 hover:bg-muted/50 rounded"
                >
                  <div 
                    className="absolute inset-0 bg-green-500/10 rounded"
                    style={{ width: getBarWidth(bid.quantity) }}
                  />
                  <span className="relative text-green-500 font-medium">
                    {formatPrice(bid.price)}
                  </span>
                  <span className="relative text-center">
                    {formatQuantity(bid.quantity)}
                  </span>
                  <span className="relative text-right text-muted-foreground">
                    {formatQuantity(runningTotal)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderBook;
