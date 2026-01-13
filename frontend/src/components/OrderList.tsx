import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { tradeApi } from '@/api/axiosConfig';
import { useToast } from '@/hooks/use-toast';
import { Loader2, XCircle, History, ListFilter } from 'lucide-react';
import { websocketService } from '@/api/websocketService';

// Types
interface Order {
  id: number;
  ticker: string;
  price: number;
  quantity: number;
  type: 'BUY' | 'SELL';
  timestamp?: string;
}

interface Trade {
  id: number;
  ticker: string;
  price: number;
  quantity: number;
  buyerId: number;
  sellerId: number;
  timestamp: string;
}

const OrderList: React.FC = () => {
  const { toast } = useToast();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [history, setHistory] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Get Pending
      const pendingRes = await tradeApi.getPendingOrders(1); // User 1
      setPendingOrders(pendingRes.data);

      // 2. Get History
      const historyRes = await tradeApi.getHistory(1);
      setHistory(historyRes.data);
    } catch (e) {
      console.error("Failed to fetch orders", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Load & WebSocket listener
  useEffect(() => {
    fetchData();

    // Refresh list when a trade happens
    const unsubscribe = websocketService.onTrade(() => {
       fetchData(); // Reload to remove filled orders from "Pending" and add to "History"
    });

    return () => unsubscribe();
  }, []);

  const handleCancel = async (orderId: number) => {
    try {
      await tradeApi.cancelOrder(orderId);
      toast({ title: "Order Cancelled", className: "text-destructive border-destructive" });
      fetchData(); // Refresh list
    } catch (e) {
      toast({ title: "Failed to cancel", variant: "destructive" });
    }
  };

  const formatDate = (dateStr: string) => {
    if(!dateStr) return '--';
    return new Date(dateStr).toLocaleTimeString();
  };

  return (
    <Card className="h-full bg-card border-border flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
            <ListFilter className="w-5 h-5" /> Order Management
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs defaultValue="pending" className="h-full flex flex-col">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </div>

          {/* PENDING ORDERS TAB */}
          <TabsContent value="pending" className="flex-1 overflow-hidden mt-2">
            <ScrollArea className="h-[300px] px-4">
              <div className="space-y-2">
                {pendingOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No open orders</p>
                ) : (
                  pendingOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-background/50">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={order.type === 'BUY' ? 'default' : 'destructive'} className="text-[10px] h-5 px-1.5">
                            {order.type}
                          </Badge>
                          <span className="font-bold font-mono">{order.ticker}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {order.quantity} units @ ${order.price}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                        onClick={() => handleCancel(order.id)}
                      >
                        <XCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="flex-1 overflow-hidden mt-2">
             <ScrollArea className="h-[300px] px-4">
              <div className="space-y-2">
                {history.length === 0 ? (
                   <p className="text-center text-muted-foreground py-8 text-sm">No trade history</p>
                ) : (
                  history.slice().reverse().map((trade) => { // Reverse to show newest first
                    const isBuyer = trade.buyerId === 1; // Assuming User 1
                    return (
                      <div key={trade.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-background/50 opacity-80">
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${isBuyer ? 'text-green-400' : 'text-red-400'}`}>
                                {isBuyer ? 'BOUGHT' : 'SOLD'}
                              </span>
                              <span className="font-bold font-mono text-sm">{trade.ticker}</span>
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                                {formatDate(trade.timestamp)}
                            </span>
                         </div>
                         <div className="text-right">
                            <div className="font-mono text-sm font-medium">${trade.price}</div>
                            <div className="text-xs text-muted-foreground">{trade.quantity} shares</div>
                         </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OrderList;