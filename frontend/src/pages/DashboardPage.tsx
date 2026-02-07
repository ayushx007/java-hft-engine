import React, { useEffect, useState, useCallback } from 'react';
import { websocketService, TradeUpdate } from '@/api/websocketService';
import { tradeApi } from '@/api/axiosConfig'; // <--- Import this
import Navbar from '@/components/Navbar';
import OrderForm from '@/components/OrderForm';
import TradeList from '@/components/TradeList';
import StockChart from '@/components/StockChart';
import Portfolio from '@/components/Portfolio';

const DashboardPage: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [trades, setTrades] = useState<TradeUpdate[]>([]);

  const handleNewTrade = useCallback((trade: TradeUpdate) => {
    setTrades((prevTrades) => {
      const newTrades = [trade, ...prevTrades];
      return newTrades.slice(0, 5); // Keep last 5 trades only
    });
  }, []);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
  }, []);

  useEffect(() => {
    // 1. Connect WebSocket
    websocketService.connect();
    const unsubscribeTrades = websocketService.onTrade(handleNewTrade);
    const unsubscribeConnection = websocketService.onConnectionChange(handleConnectionChange);

    // 2. Fetch Recent History (The "Option B" Fix)
    const loadHistory = async () => {
        try {
            const response = await tradeApi.getRecentTrades();
            // The API returns newest first, which matches our list format
            setTrades(response.data);
        } catch (error) {
            console.error("Failed to load recent trades:", error);
        }
    };
    loadHistory();

    // 3. Cleanup
    return () => {
      unsubscribeTrades();
      unsubscribeConnection();
      websocketService.disconnect();
    };
  }, [handleNewTrade, handleConnectionChange]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar isConnected={isConnected} />

      <main className="flex-1 p-4 lg:p-6">
        <div className="max-w-[1800px] mx-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-[calc(100vh-6rem)]">
            
            {/* Left: Order Form */}
            <div className="lg:col-span-3">
              <OrderForm />
            </div>

            {/* Center: Chart + Feed */}
            <div className="lg:col-span-6 flex flex-col gap-4 lg:gap-6">
              <div className="h-[300px] lg:h-[45%]">
                <StockChart trades={trades} />
              </div>
              <div className="flex-1 min-h-[300px]">
                <TradeList trades={trades} />
              </div>
            </div>

            {/* Right: Portfolio */}
            <div className="lg:col-span-3">
              <Portfolio />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;