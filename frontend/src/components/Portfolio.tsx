import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Wallet, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/api/axiosConfig';
import { websocketService } from '@/api/websocketService'; 

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
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modified to support "Silent Refresh" (no spinner)
  const loadPortfolio = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    
    try {
      // Hardcoded to User 1 for MVP
      const response = await apiClient.get<PortfolioData>('/api/portfolio/1');
      console.log("✅ Portfolio Updated:", response.data);
      setPortfolio(response.data);
    } catch (err) {
      console.error('Portfolio fetch error:', err);
      if (!silent) setError('Failed to load portfolio');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Initial Load (Show Spinner)
    loadPortfolio(false);

    // 2. Connect to WebSocket
    const setupWebSocket = async () => {
      try {
        await websocketService.connect();
        
        // 3. Subscribe to Trade Updates
        // The service returns a cleanup function (unsubscribe)
        const unsubscribe = websocketService.subscribe('/topic/trades', (tradeEvent) => {
          console.log("🔥 [Portfolio] WebSocket Event Received:", tradeEvent);
          
          // 4. Trigger Silent Refresh
          loadPortfolio(true);
        });

        // Store cleanup for unmount
        return unsubscribe;
      } catch (e) {
        console.error("WebSocket connection failed in Portfolio:", e);
      }
    };

    const cleanupPromise = setupWebSocket();

    // 5. Cleanup on Unmount
    return () => {
      cleanupPromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, []);

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
            Portfolio ({portfolio?.username || '---'})
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
        {/* Balance Section */}
        <div className="bg-background/50 rounded-lg p-4 border border-border">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide mb-1">
            Cash Balance
          </p>
          <p className="text-2xl font-bold font-mono text-success">
            {portfolio ? formatCurrency(portfolio.balance) : '---'}
          </p>
        </div>

        {/* Holdings Table */}
        <div className="flex-1 overflow-hidden">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide mb-2">
            Holdings
          </p>
          <div className="overflow-auto h-[calc(100%-1.5rem)] rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-mono text-xs text-muted-foreground">Ticker</TableHead>
                  <TableHead className="font-mono text-xs text-muted-foreground text-right">Qty</TableHead>
                  <TableHead className="font-mono text-xs text-muted-foreground text-right">Avg Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolio?.holdings && portfolio.holdings.length > 0 ? (
                  portfolio.holdings.map((h) => (
                    <TableRow key={h.ticker} className="border-border hover:bg-muted/50">
                      <TableCell className="font-mono font-medium">{h.ticker}</TableCell>
                      <TableCell className="font-mono text-right">{h.quantity}</TableCell>
                      <TableCell className="font-mono text-right">{formatCurrency(h.avgPrice)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground font-mono py-8">
                      {isLoading ? "Loading..." : "No holdings"}
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