import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Wallet, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/api/axiosConfig';
import { websocketService } from '@/api/websocketService'; 
import { useAuth } from '@/context/AuthContext'; // <--- Import Auth Context

interface Holding {
  ticker: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

interface PortfolioData {
  id: number;
  username: string;
  balance: number;
  holdings: Holding[];
}

const Portfolio: React.FC = () => {
  const { user } = useAuth(); // <--- Get logged-in user
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized load function to use user ID from context
  const loadPortfolio = useCallback(async (silent = false) => {
    if (!user?.id) return;
    
    if (!silent) setIsLoading(true);
    setError(null);
    
    try {
      // Use the dynamic ID from our Auth session
      const response = await apiClient.get<PortfolioData>(`/api/portfolio/${user.id}`);
      console.log("✅ Portfolio Updated for:", user.username);
      setPortfolio(response.data);
    } catch (err) {
      console.error('Portfolio fetch error:', err);
      if (!silent) setError('Failed to load portfolio');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // 1. Initial Load
    loadPortfolio(false);

    // 2. Connect to WebSocket for real-time updates
    const setupWebSocket = async () => {
      try {
        await websocketService.connect();
        
        // Subscribe to Trade Updates to trigger refresh
        const unsubscribe = websocketService.subscribe('/topic/trades', (tradeEvent) => {
          console.log("🔥 [Portfolio] Update triggered by trade event");
          loadPortfolio(true); // Silent refresh on trade
        });

        return unsubscribe;
      } catch (e) {
        console.error("WebSocket connection failed in Portfolio:", e);
      }
    };

    const cleanupPromise = setupWebSocket();

    // 3. Cleanup on Unmount or User change
    return () => {
      cleanupPromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [user, loadPortfolio]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (error) {
    return (
      <Card className="h-full bg-card border-border">
        <CardContent className="h-full flex flex-col items-center justify-center gap-4">
          <p className="text-destructive font-mono">{error}</p>
          <Button variant="outline" size="sm" onClick={() => loadPortfolio(false)}>
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-card border-border flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-mono text-foreground flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {/* Now uses actual username from state/context */}
            Portfolio ({user?.username || '---'})
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => loadPortfolio(false)}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Balance & Total P&L Section */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/50 rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide mb-1">
              Available Cash
            </p>
            <p className="text-xl font-bold font-mono text-success">
              {portfolio ? formatCurrency(portfolio.balance) : '---'}
            </p>
          </div>
          
          {/* Total P&L */}
          {portfolio?.holdings && portfolio.holdings.length > 0 && (() => {
            const totalPnl = portfolio.holdings.reduce((sum, h) => {
              return sum + (h.currentPrice - h.avgPrice) * h.quantity;
            }, 0);
            const totalValue = portfolio.holdings.reduce((sum, h) => {
              return sum + h.currentPrice * h.quantity;
            }, 0);
            const totalCost = portfolio.holdings.reduce((sum, h) => {
              return sum + h.avgPrice * h.quantity;
            }, 0);
            const pnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
            const isPositive = totalPnl >= 0;
            
            return (
              <div className="bg-background/50 rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide mb-1">
                  Total P&L
                </p>
                <p className={`text-xl font-bold font-mono flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {isPositive ? '+' : ''}{formatCurrency(totalPnl)}
                </p>
                <p className={`text-xs font-mono ${isPositive ? 'text-green-500/70' : 'text-red-500/70'}`}>
                  ({isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%) • Value: {formatCurrency(totalValue)}
                </p>
              </div>
            );
          })()}
        </div>

        {/* Holdings Table */}
        <div className="flex-1 overflow-hidden">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide mb-2">
            Asset Holdings
          </p>
          <div className="overflow-auto h-[calc(100%-1.5rem)] rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-mono text-xs text-muted-foreground">Ticker</TableHead>
                  <TableHead className="font-mono text-xs text-muted-foreground text-right">Qty</TableHead>
                  <TableHead className="font-mono text-xs text-muted-foreground text-right">Avg</TableHead>
                  <TableHead className="font-mono text-xs text-muted-foreground text-right">Current</TableHead>
                  <TableHead className="font-mono text-xs text-muted-foreground text-right">P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolio?.holdings && portfolio.holdings.length > 0 ? (
                  portfolio.holdings.map((h) => {
                    const pnl = (h.currentPrice - h.avgPrice) * h.quantity;
                    const pnlPercent = h.avgPrice > 0 ? ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100 : 0;
                    const isPositive = pnl >= 0;
                    
                    return (
                      <TableRow key={h.ticker} className="border-border hover:bg-muted/50">
                        <TableCell className="font-mono font-medium">{h.ticker}</TableCell>
                        <TableCell className="font-mono text-right">{h.quantity}</TableCell>
                        <TableCell className="font-mono text-right text-muted-foreground text-sm">
                          {formatCurrency(h.avgPrice)}
                        </TableCell>
                        <TableCell className="font-mono text-right text-sm">
                          {formatCurrency(h.currentPrice)}
                        </TableCell>
                        <TableCell className={`font-mono text-right text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          <div className="flex items-center justify-end gap-1">
                            {isPositive ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span>
                              {isPositive ? '+' : ''}{formatCurrency(pnl)}
                            </span>
                          </div>
                          <div className="text-xs opacity-70">
                            ({isPositive ? '+' : ''}{pnlPercent.toFixed(1)}%)
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground font-mono py-8">
                      {isLoading ? "Fetching assets..." : "No holdings found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Portfolio;