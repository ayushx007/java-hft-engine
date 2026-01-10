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
import { Wallet, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/api/axiosConfig'; // Use your configured axios

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

  const loadPortfolio = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch User ID 1 (Hardcoded for MVP)
      const response = await apiClient.get<PortfolioData>('/api/portfolio/1');
      
      // Transform backend response if needed (Backend User object might lack 'holdings' initially)
      // For now, we assume the backend sends basic user data.
      // We will mock 'holdings' on the frontend until Phase 8 (Backend Holdings Table)
      const data = {
          ...response.data,
          holdings: [] // Backend doesn't support holdings yet, so empty list
      };
      
      setPortfolio(data);
    } catch (err) {
      setError('Failed to load portfolio');
      console.error('Portfolio fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
    
    // Optional: Refresh balance every 5 seconds to see updates after trades
    const interval = setInterval(loadPortfolio, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate total portfolio value
  const totalValue = portfolio
    ? portfolio.balance +
      (portfolio.holdings?.reduce(
        (sum, h) => sum + h.quantity * h.currentPrice,
        0
      ) || 0)
    : 0;

  // Calculate total P&L
  const totalPnL = portfolio
    ? (portfolio.holdings?.reduce(
        (sum, h) => sum + h.quantity * (h.currentPrice - h.avgPrice),
        0
      ) || 0)
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-success';
    if (pnl < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  if (error) {
    return (
      <Card className="h-full bg-card border-border">
        <CardContent className="h-full flex flex-col items-center justify-center gap-4">
          <p className="text-destructive font-mono">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPortfolio}
            className="font-mono"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
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
            onClick={loadPortfolio}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
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
            {isLoading ? '---' : formatCurrency(portfolio?.balance || 0)}
          </p>
        </div>

        {/* Holdings Table (Placeholder until Phase 8) */}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                 <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground font-mono py-8">
                      No holdings (Coming Soon)
                    </TableCell>
                 </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Portfolio;