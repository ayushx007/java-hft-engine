import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Filter, X, TrendingUp, TrendingDown, Loader2, Trash2 } from 'lucide-react';
import { tradeApi } from '@/api/axiosConfig';
import { websocketService } from '@/api/websocketService';
import { useToast } from '@/hooks/use-toast';

interface TradeRecord {
  id: string;
  ticker: string;
  price: number;
  quantity: number;
  type: 'BUY' | 'SELL';
  timestamp: string;
  status: 'EXECUTED' | 'PENDING';
  total: number;
}

const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [history, setHistory] = useState<TradeRecord[]>([]);
  const [pending, setPending] = useState<TradeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(websocketService.getConnectionStatus());

  // Filters
  const [tickerFilter, setTickerFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // --- 1. FETCH REAL DATA (Both Lists) ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [historyRes, pendingRes] = await Promise.all([
        tradeApi.getHistory(1),
        tradeApi.getPendingOrders(1)
      ]);
      
      // Transform History
      const formattedHistory: TradeRecord[] = historyRes.data.map((t: any) => ({
        id: t.id.toString(),
        ticker: t.ticker,
        price: t.price,
        quantity: t.quantity,
        type: t.buyerId === 1 ? 'BUY' : 'SELL',
        timestamp: t.timestamp,
        status: 'EXECUTED',
        total: t.price * t.quantity
      })).reverse();

      // Transform Pending
      const formattedPending: TradeRecord[] = pendingRes.data.map((o: any) => ({
        id: o.id.toString(),
        ticker: o.ticker,
        price: o.price,
        quantity: o.quantity,
        type: o.type,
        timestamp: new Date().toISOString(), 
        status: 'PENDING',
        total: o.price * o.quantity
      })).reverse();

      setHistory(formattedHistory);
      setPending(formattedPending);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const unsubscribe = websocketService.onConnectionChange(setIsConnected);
    return () => unsubscribe();
  }, []);

  // --- 2. CANCEL LOGIC ---
  const handleCancel = async (orderId: string) => {
    try {
      await tradeApi.cancelOrder(parseInt(orderId));
      toast({ title: "Order Cancelled", className: "text-destructive border-destructive" });
      fetchData(); 
    } catch (e) {
      toast({ title: "Failed to cancel", variant: "destructive" });
    }
  };

  // --- 3. FILTER LOGIC (Reused for both lists) ---
  const applyFilters = (list: TradeRecord[]) => {
    return list.filter((trade) => {
      if (tickerFilter !== 'ALL' && trade.ticker !== tickerFilter) return false;
      if (typeFilter !== 'ALL' && trade.type !== typeFilter) return false;

      const tradeDate = new Date(trade.timestamp);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (tradeDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (tradeDate > end) return false;
      }
      return true;
    });
  };

  const filteredHistory = useMemo(() => applyFilters(history), [history, tickerFilter, typeFilter, startDate, endDate]);
  const filteredPending = useMemo(() => applyFilters(pending), [pending, tickerFilter, typeFilter, startDate, endDate]);

  // Unique Tickers for Dropdown (from both lists)
  const uniqueTickers = useMemo(() => {
    const allTickers = [...history, ...pending].map(t => t.ticker);
    return [...new Set(allTickers)].sort();
  }, [history, pending]);

  // --- 4. SUMMARY STATS (Based on Executed History Only) ---
  const summary = useMemo(() => {
    const buys = filteredHistory.filter((t) => t.type === 'BUY');
    const sells = filteredHistory.filter((t) => t.type === 'SELL');
    return {
      totalTrades: filteredHistory.length,
      buyCount: buys.length,
      sellCount: sells.length,
      buyVolume: buys.reduce((acc, t) => acc + t.total, 0),
      sellVolume: sells.reduce((acc, t) => acc + t.total, 0),
    };
  }, [filteredHistory]);

  const clearFilters = () => {
    setTickerFilter('ALL');
    setTypeFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = tickerFilter !== 'ALL' || typeFilter !== 'ALL' || startDate || endDate;

  const formatDate = (dateString: string) => {
    if(!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    if(!dateString) return '--';
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isConnected={isConnected} />

      <main className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Order Management</h1>
              <p className="text-sm text-muted-foreground font-mono">
                {isLoading ? "Loading..." : `${filteredHistory.length} executed, ${filteredPending.length} pending`}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards (Your Original UI) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Trades</div>
              <div className="text-2xl font-bold font-mono">{summary.totalTrades}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-primary" /> Buy Orders
              </div>
              <div className="text-2xl font-bold font-mono text-primary">{summary.buyCount}</div>
              <div className="text-xs text-muted-foreground font-mono">${summary.buyVolume.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-destructive" /> Sell Orders
              </div>
              <div className="text-2xl font-bold font-mono text-destructive">{summary.sellCount}</div>
              <div className="text-xs text-muted-foreground font-mono">${summary.sellVolume.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Net Volume</div>
              <div className={`text-2xl font-bold font-mono ${summary.buyVolume > summary.sellVolume ? 'text-primary' : 'text-destructive'}`}>
                ${Math.abs(summary.buyVolume - summary.sellVolume).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground font-mono">{summary.buyVolume > summary.sellVolume ? 'Net Buying' : 'Net Selling'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters (Your Original UI) */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  <X className="w-4 h-4 mr-1" /> Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Ticker</Label>
                <Select value={tickerFilter} onValueChange={setTickerFilter}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="All Tickers" /></SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="ALL">All Tickers</SelectItem>
                    {uniqueTickers.map((ticker) => <SelectItem key={ticker} value={ticker}>{ticker}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Trade Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="All Types" /></SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="BUY">Buy Only</SelectItem>
                    <SelectItem value="SELL">Sell Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-background border-border font-mono" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-background border-border font-mono" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- TABS SECTION (New Wrapper) --- */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="pending" className="px-8">
               Open Orders 
               {pending.length > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1">{pending.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="history" className="px-8">Trade History</TabsTrigger>
          </TabsList>

          {/* TAB 1: OPEN ORDERS (With Cancel) */}
          <TabsContent value="pending" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-mono text-xs">TICKER</TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs">TYPE</TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs text-right">PRICE</TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs text-right">QTY</TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs text-right">TOTAL</TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs text-right">ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPending.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No open orders</TableCell></TableRow>
                    ) : (
                      filteredPending.map((o) => (
                        <TableRow key={o.id} className="border-border hover:bg-muted/50">
                          <TableCell className="font-mono text-sm font-semibold">{o.ticker}</TableCell>
                          <TableCell><Badge variant={o.type === 'BUY' ? 'default' : 'destructive'}>{o.type}</Badge></TableCell>
                          <TableCell className="font-mono text-sm text-right">${o.price}</TableCell>
                          <TableCell className="font-mono text-sm text-right">{o.quantity}</TableCell>
                          <TableCell className="font-mono text-sm text-right">${o.total.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="destructive" onClick={() => handleCancel(o.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Cancel
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: TRADE HISTORY (Your Original Table) */}
          <TabsContent value="history" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-mono text-xs">DATE</TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs">TIME</TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs">TICKER</TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs">TYPE</TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs text-right">PRICE</TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs text-right">QTY</TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs text-right">TOTAL</TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs text-center">STATUS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No history found</TableCell></TableRow>
                    ) : (
                      filteredHistory.map((trade) => (
                        <TableRow key={trade.id} className="border-border hover:bg-muted/50">
                          <TableCell className="font-mono text-sm">{formatDate(trade.timestamp)}</TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">{formatTime(trade.timestamp)}</TableCell>
                          <TableCell className="font-mono text-sm font-semibold">{trade.ticker}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold ${trade.type === 'BUY' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                              {trade.type === 'BUY' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {trade.type}
                            </span>
                          </TableCell>
                          <TableCell className={`font-mono text-sm text-right ${trade.type === 'BUY' ? 'text-primary' : 'text-destructive'}`}>${trade.price.toFixed(2)}</TableCell>
                          <TableCell className="font-mono text-sm text-right">{trade.quantity}</TableCell>
                          <TableCell className="font-mono text-sm text-right font-semibold">${trade.total.toLocaleString()}</TableCell>
                          <TableCell className="text-center"><span className="px-2 py-0.5 rounded text-xs font-mono bg-primary/10 text-primary">EXECUTED</span></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
};

export default OrderHistoryPage;