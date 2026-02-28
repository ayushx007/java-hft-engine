import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/api/axiosConfig';
import { websocketService } from '@/api/websocketService';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Star, 
  Plus, 
  Trash2, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Eye
} from 'lucide-react';

interface WatchlistItemData {
  id: number;
  ticker: string;
  currentPrice: number;
  addedAt: string;
  targetPriceHigh: number;
  targetPriceLow: number;
}

const POPULAR_TICKERS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'JPM'];

const Watchlist: React.FC = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItemData[]>([]);
  const [newTicker, setNewTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const fetchWatchlist = useCallback(async (silent = false) => {
    if (!user?.id) return;
    
    if (!silent) setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<WatchlistItemData[]>(`/api/watchlist/${user.id}`);
      setWatchlist(response.data);
    } catch (err) {
      console.error('Failed to fetch watchlist:', err);
      if (!silent) setError('Failed to load watchlist');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // Subscribe to trade updates to refresh prices
  useEffect(() => {
    const unsubscribe = websocketService.onTrade((trade) => {
      // Check if trade is for a ticker in our watchlist
      if (watchlist.some(item => item.ticker === trade.ticker)) {
        fetchWatchlist(true);
      }
    });

    return () => unsubscribe();
  }, [watchlist, fetchWatchlist]);

  const addToWatchlist = async (ticker: string) => {
    if (!user?.id || !ticker.trim()) return;
    
    setAdding(true);
    try {
      await apiClient.post(`/api/watchlist/${user.id}`, { ticker: ticker.toUpperCase() });
      setNewTicker('');
      fetchWatchlist(true);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to add';
      setError(errorMsg);
      setTimeout(() => setError(null), 3000);
    } finally {
      setAdding(false);
    }
  };

  const removeFromWatchlist = async (ticker: string) => {
    if (!user?.id) return;
    
    try {
      await apiClient.delete(`/api/watchlist/${user.id}/${ticker}`);
      setWatchlist(prev => prev.filter(item => item.ticker !== ticker));
    } catch (err) {
      console.error('Failed to remove:', err);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  // Quick add suggestions (tickers not yet in watchlist)
  const suggestions = POPULAR_TICKERS.filter(
    t => !watchlist.some(w => w.ticker === t)
  ).slice(0, 4);

  if (error && !watchlist.length) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-32">
          <p className="text-destructive mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchWatchlist()}>
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
            <Eye className="w-5 h-5" />
            Watchlist
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => fetchWatchlist()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
        {/* Add new ticker */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter ticker..."
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && addToWatchlist(newTicker)}
            className="h-8 text-sm font-mono"
            maxLength={5}
          />
          <Button
            size="sm"
            className="h-8 px-3"
            onClick={() => addToWatchlist(newTicker)}
            disabled={adding || !newTicker.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick suggestions */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestions.map(ticker => (
              <Button
                key={ticker}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs font-mono"
                onClick={() => addToWatchlist(ticker)}
                disabled={adding}
              >
                + {ticker}
              </Button>
            ))}
          </div>
        )}

        {/* Error toast */}
        {error && (
          <div className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
            {error}
          </div>
        )}

        {/* Watchlist items */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {watchlist.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Your watchlist is empty</p>
              <p className="text-xs mt-1">Add tickers to track prices</p>
            </div>
          ) : (
            watchlist.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-mono font-medium">{item.ticker}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-sm ${item.currentPrice > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {item.currentPrice > 0 ? formatPrice(item.currentPrice) : '---'}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => removeFromWatchlist(item.ticker)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {watchlist.length > 0 && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Tracking {watchlist.length} ticker{watchlist.length !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Watchlist;
