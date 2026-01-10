import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { tradeApi, TradeOrder } from '@/api/axiosConfig';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, Loader2, DollarSign, Hash, BarChart3 } from 'lucide-react';

const OrderForm: React.FC = () => {
  const { toast } = useToast();
  const [ticker, setTicker] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (isNaN(priceNum) || priceNum <= 0) {
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

    const order: TradeOrder = {
      ticker: ticker.toUpperCase(),
      price: priceNum,
      quantity: quantityNum,
      type,
    };

    setIsSubmitting(true);

    try {
      const response = await tradeApi.placeTrade(order);
      
      toast({
        title: `${type} Order Executed`,
        description: `${order.ticker} × ${order.quantity} @ $${order.price.toFixed(2)}`,
        className: type === 'BUY' ? 'border-primary' : 'border-destructive',
      });

      // Clear form on success
      setTicker('');
      setPrice('');
      setQuantity('');
      
      console.log('Trade response:', response);
    } catch (error: any) {
      toast({
        title: 'Order Failed',
        description: error.response?.data?.message || 'Failed to execute order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalValue = (parseFloat(price) || 0) * (parseInt(quantity, 10) || 0);

  return (
    <div className="bg-card border border-border rounded-xl p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Place Order</h2>
      </div>

      <div className="space-y-5">
        {/* Ticker Input */}
        <div className="space-y-2">
          <Label htmlFor="ticker" className="text-muted-foreground text-xs uppercase tracking-wider">
            Ticker Symbol
          </Label>
          <Input
            id="ticker"
            placeholder="AAPL, GOOGL, TSLA..."
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className="bg-muted border-border font-mono text-lg h-12 uppercase"
            disabled={isSubmitting}
          />
        </div>

        {/* Price Input */}
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

        {/* Total Value Display */}
        {totalValue > 0 && (
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
