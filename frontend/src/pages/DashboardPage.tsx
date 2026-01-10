import React, { useEffect, useState, useCallback } from 'react';
import { websocketService, TradeUpdate } from '@/api/websocketService';
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
      // Add new trade at the beginning, limit to 100 trades
      const newTrades = [trade, ...prevTrades];
      return newTrades.slice(0, 100);
    });
  }, []);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
  }, []);

  useEffect(() => {
    // Connect to WebSocket on mount
    websocketService.connect();

    // Subscribe to trade updates
    const unsubscribeTrades = websocketService.onTrade(handleNewTrade);
    const unsubscribeConnection = websocketService.onConnectionChange(handleConnectionChange);

    // Add some mock trades for demo purposes
    const mockTrades: TradeUpdate[] = [
      {
        id: '1',
        ticker: 'AAPL',
        price: 178.52,
        quantity: 150,
        type: 'BUY',
        timestamp: new Date(Date.now() - 30000).toISOString(),
      },
      {
        id: '2',
        ticker: 'GOOGL',
        price: 141.23,
        quantity: 75,
        type: 'SELL',
        timestamp: new Date(Date.now() - 60000).toISOString(),
      },
      {
        id: '3',
        ticker: 'TSLA',
        price: 248.91,
        quantity: 200,
        type: 'BUY',
        timestamp: new Date(Date.now() - 90000).toISOString(),
      },
      {
        id: '4',
        ticker: 'MSFT',
        price: 378.45,
        quantity: 50,
        type: 'BUY',
        timestamp: new Date(Date.now() - 120000).toISOString(),
      },
      {
        id: '5',
        ticker: 'NVDA',
        price: 495.22,
        quantity: 100,
        type: 'SELL',
        timestamp: new Date(Date.now() - 150000).toISOString(),
      },
    ];
    setTrades(mockTrades);

    // Cleanup on unmount
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
          {/* 3-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-[calc(100vh-6rem)]">
            {/* Left Column - Order Form */}
            <div className="lg:col-span-3">
              <OrderForm />
            </div>

            {/* Center Column - Chart (Top) + Trade List (Bottom) */}
            <div className="lg:col-span-6 flex flex-col gap-4 lg:gap-6">
              {/* Stock Chart - Top */}
              <div className="h-[300px] lg:h-[45%]">
                <StockChart trades={trades} />
              </div>

              {/* Trade List - Bottom */}
              <div className="flex-1 min-h-[300px]">
                <TradeList trades={trades} />
              </div>
            </div>

            {/* Right Column - Portfolio */}
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
