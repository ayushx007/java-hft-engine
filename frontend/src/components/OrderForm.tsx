import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { tradeApi, TradeOrder } from '@/api/axiosConfig';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, Loader2, DollarSign, Hash, BarChart3, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type OrderKind = 'LIMIT' | 'MARKET';

// Available tickers for trading
const AVAILABLE_TICKERS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.' },
  { symbol: 'JPM', name: 'JPMorgan Chase' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
];

const OrderForm: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [ticker, setTicker] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [orderKind, setOrderKind] = useState<OrderKind>('LIMIT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMarketOrder = orderKind === 'MARKET';

  const handleSubmit = async (type: 'BUY' | 'SELL') => {
    // Validation
    if (!ticker.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a ticker symbol',
        variant: 'destructive',
      });
      return;
    }

    const priceNum = parseFloat(price);
    const quantityNum = parseInt(quantity, 10);

    // Only validate price for LIMIT orders
    if (!isMarketOrder && (isNaN(priceNum) || priceNum <= 0)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid price',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid quantity',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to trade.',
        variant: 'destructive',
      });
      return;
    }

    const order: TradeOrder = {
      ticker: ticker.toUpperCase(),
      price: isMarketOrder ? undefined : priceNum,
      quantity: quantityNum,
      type,
      orderKind,
      userId: Number(user.id)
    };

    setIsSubmitting(true);

    try {
      const response = await tradeApi.placeTrade(order);
      
      const priceDisplay = isMarketOrder ? 'Market Price' : `$${priceNum.toFixed(2)}`;
      toast({
        title: `${orderKind} ${type} Order Sent`,
        description: `${order.ticker} × ${order.quantity} @ ${priceDisplay}`,
        className: type === 'BUY' ? 'border-primary' : 'border-destructive',
      });

      // Clear form on success
      setTicker('');
      setPrice('');
      setQuantity('');
      
    } catch (error: any) {
      console.error("Trade failed:", error);
      toast({
        title: 'Order Failed',
        description: error.response?.data?.message || 'Failed to execute order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalValue = isMarketOrder ? 0 : (parseFloat(price) || 0) * (parseInt(quantity, 10) || 0);

  return (
    <div className="bg-card border border-border rounded-xl p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Place Order</h2>
      </div>

      <div className="space-y-5">
        {/* Order Kind Toggle */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">
            Order Type
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={orderKind === 'LIMIT' ? 'default' : 'outline'}
              onClick={() => setOrderKind('LIMIT')}
              className={`h-10 ${orderKind === 'LIMIT' ? 'bg-primary' : ''}`}
              disabled={isSubmitting}
            >
              <DollarSign className="w-4 h-4 mr-1" />
              Limit
            </Button>
            <Button
              type="button"
              variant={orderKind === 'MARKET' ? 'default' : 'outline'}
              onClick={() => setOrderKind('MARKET')}
              className={`h-10 ${orderKind === 'MARKET' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
              disabled={isSubmitting}
            >
              <Zap className="w-4 h-4 mr-1" />
              Market
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {isMarketOrder 
              ? 'Executes immediately at best available price' 
              : 'Executes only at your specified price or better'}
          </p>
        </div>

        {/* Ticker Select */}
        <div className="space-y-2">
          <Label htmlFor="ticker" className="text-muted-foreground text-xs uppercase tracking-wider">
            Ticker Symbol
          </Label>
          <Select
            value={ticker}
            onValueChange={setTicker}
            disabled={isSubmitting}
          >
            <SelectTrigger className="bg-muted border-border font-mono text-lg h-12">
              <SelectValue placeholder="Select a ticker..." />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {AVAILABLE_TICKERS.map((t) => (
                <SelectItem 
                  key={t.symbol} 
                  value={t.symbol}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold">{t.symbol}</span>
                    <span className="text-muted-foreground text-sm">{t.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Input - Hidden for Market Orders */}
        {!isMarketOrder && (
          <div className="space-y-2">
            <Label htmlFor="price" className="text-muted-foreground text-xs uppercase tracking-wider">
              Price (USD)
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-muted border-border font-mono text-lg h-12 pl-9"
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {/* Market Order Info */}
        {isMarketOrder && (
          <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <p className="text-sm text-orange-400">
              <Zap className="w-4 h-4 inline mr-1" />
              Price determined by best available order in the market
            </p>
          </div>
        )}

        {/* Quantity Input */}
        <div className="space-y-2">
          <Label htmlFor="quantity" className="text-muted-foreground text-xs uppercase tracking-wider">
            Quantity
          </Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-muted border-border font-mono text-lg h-12 pl-9"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Total Value Display - Only for Limit Orders */}
        {!isMarketOrder && totalValue > 0 && (
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Value</p>
            <p className="text-2xl font-mono font-semibold">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            size="lg"
            onClick={() => handleSubmit('BUY')}
            disabled={isSubmitting}
            className="h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground glow-buy transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <TrendingUp className="w-5 h-5 mr-2" />
                BUY
              </>
            )}
          </Button>
          <Button
            size="lg"
            onClick={() => handleSubmit('SELL')}
            disabled={isSubmitting}
            className="h-14 text-lg font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground glow-sell transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <TrendingDown className="w-5 h-5 mr-2" />
                SELL
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;