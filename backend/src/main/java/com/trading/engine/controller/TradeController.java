package com.trading.engine.controller;

import com.trading.engine.model.Holding;
import com.trading.engine.model.Order;
import com.trading.engine.model.Trade;
import com.trading.engine.model.User;
import com.trading.engine.repository.HoldingRepository;
import com.trading.engine.repository.OrderRepository;
import com.trading.engine.repository.TradeRepository;
import com.trading.engine.repository.UserRepository;
import com.trading.engine.kafka.OrderProducer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import com.trading.engine.dto.TradeEvent;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.Optional;
import java.math.BigDecimal;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class TradeController {

    @Autowired
    private OrderProducer orderProducer;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private HoldingRepository holdingRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/api/trade")
    public ResponseEntity<?> placeOrder(@RequestBody Order order) {
        if (order.getUserId() == null) {
            order.setUserId(1L); // Default to User 1
        }

        // Default to LIMIT if not specified
        if (order.getOrderKind() == null) {
            order.setOrderKind(Order.OrderKind.LIMIT);
        }

        boolean isMarketOrder = order.getOrderKind() == Order.OrderKind.MARKET;

        // MARKET ORDER: Check if there are matching orders available
        if (isMarketOrder) {
            List<Order> availableOrders;
            if (order.getType() == Order.Type.BUY) {
                availableOrders = orderRepository.findByTickerAndTypeAndQuantityGreaterThanOrderByPriceAsc(
                    order.getTicker(), Order.Type.SELL, 0);
            } else {
                availableOrders = orderRepository.findByTickerAndTypeAndQuantityGreaterThanOrderByPriceDesc(
                    order.getTicker(), Order.Type.BUY, 0);
            }
            
            if (availableOrders.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", "No " + (order.getType() == Order.Type.BUY ? "sell" : "buy") + 
                               " orders available for " + order.getTicker() + ". Use a limit order instead."
                ));
            }

            // For market BUY, estimate cost using best available price
            if (order.getType() == Order.Type.BUY) {
                User user = userRepository.findById(order.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
                
                BigDecimal bestPrice = availableOrders.get(0).getPrice();
                BigDecimal estimatedCost = bestPrice.multiply(BigDecimal.valueOf(order.getQuantity()));
                
                if (user.getBalance().compareTo(estimatedCost) < 0) {
                    String errorMsg = String.format(
                        "Insufficient funds. Market order estimated at $%.2f (best price $%.2f × %d) but you only have $%.2f.",
                        estimatedCost.doubleValue(),
                        bestPrice.doubleValue(),
                        order.getQuantity(),
                        user.getBalance().doubleValue()
                    );
                    return ResponseEntity.badRequest().body(Map.of("message", errorMsg));
                }
            }
        } else {
            // LIMIT ORDER: Standard balance check
            if (order.getType() == Order.Type.BUY) {
                User user = userRepository.findById(order.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
                
                BigDecimal orderCost = order.getPrice().multiply(BigDecimal.valueOf(order.getQuantity()));
                
                if (user.getBalance().compareTo(orderCost) < 0) {
                    String errorMsg = String.format(
                        "Insufficient funds. Order costs $%.2f but you only have $%.2f available.",
                        orderCost.doubleValue(),
                        user.getBalance().doubleValue()
                    );
                    return ResponseEntity.badRequest().body(Map.of("message", errorMsg));
                }
            }
        }

        // SELL VALIDATION: Check if user has enough holdings (applies to both LIMIT and MARKET)
        if (order.getType() == Order.Type.SELL) {
            Optional<Holding> holding = holdingRepository.findByUserIdAndTicker(order.getUserId(), order.getTicker());
            
            int availableQuantity = holding.map(Holding::getQuantity).orElse(0);
            
            if (availableQuantity < order.getQuantity()) {
                String errorMsg = availableQuantity == 0 
                    ? "You don't own any " + order.getTicker() + " shares to sell."
                    : "Insufficient shares. You only have " + availableQuantity + " " + order.getTicker() + " shares.";
                
                return ResponseEntity.badRequest().body(Map.of("message", errorMsg));
            }
        }

        String orderKindLabel = isMarketOrder ? "MARKET" : "LIMIT";
        System.out.println("✅ Received " + orderKindLabel + " Order: " + order.getType() + " " + order.getTicker() + " for userId: " + order.getUserId());
        orderProducer.sendMessage(order);
        return ResponseEntity.ok(Map.of("message", orderKindLabel + " order sent to engine!"));
    }

    // --- NEW ENDPOINTS ---

    // 1. Get Pending Orders (Active in Order Book)
    @GetMapping("/api/orders/pending/{userId}")
    public List<Order> getPendingOrders(@PathVariable Long userId) {
        // In a real app, you might filter by status.
        // Here, any order in the 'orders' table is technically pending/partially
        // filled.
        return orderRepository.findByUserIdAndQuantityGreaterThan(userId, 0);
    }

    // 2. Get Order History (Executed Trades)
    @GetMapping("/api/orders/history/{userId}")
    public List<Trade> getTradeHistory(@PathVariable Long userId) {
        // FIX: Use the new properly-grouped query
        return tradeRepository.findUserTrades(userId, 0);
    }

    // 3. Cancel Order
    @DeleteMapping("/api/orders/{orderId}")
    @Transactional
    public String cancelOrder(@PathVariable Long orderId) {
        if (orderRepository.existsById(orderId)) {
            orderRepository.deleteById(orderId);
            return "Order Cancelled";
        }
        throw new RuntimeException("Order not found");
    }

    // 4. Get Recent Trades for Dashboard Feed
    @GetMapping("/api/trades/recent")
    public List<TradeEvent> getRecentTrades() {
        // Fix: Pass '0' to ensure we get 5 REAL trades, not ghosts
        return tradeRepository.findTop5ByQuantityGreaterThanOrderByTimestampDesc(0).stream()
                .map(t -> new TradeEvent(
                        t.getTicker(),
                        t.getPrice(),
                        t.getQuantity(),
                        "BUY",
                        t.getTimestamp()))
                .collect(Collectors.toList());
    }

    // 5. Get Order Book for a Ticker (Aggregated by Price Level)
    @GetMapping("/api/orderbook/{ticker}")
    public Map<String, Object> getOrderBook(@PathVariable String ticker) {
        // Get all BUY orders (bids) - sorted highest price first
        List<Order> buyOrders = orderRepository.findByTickerAndTypeAndQuantityGreaterThanOrderByPriceDesc(
            ticker.toUpperCase(), Order.Type.BUY, 0);
        
        // Get all SELL orders (asks) - sorted lowest price first  
        List<Order> sellOrders = orderRepository.findByTickerAndTypeAndQuantityGreaterThanOrderByPriceAsc(
            ticker.toUpperCase(), Order.Type.SELL, 0);
        
        // Aggregate by price level
        List<Map<String, Object>> bids = buyOrders.stream()
            .collect(Collectors.groupingBy(
                Order::getPrice,
                java.util.LinkedHashMap::new,
                Collectors.summingInt(Order::getQuantity)
            ))
            .entrySet().stream()
            .map(e -> Map.<String, Object>of("price", e.getKey(), "quantity", e.getValue()))
            .limit(10) // Top 10 price levels
            .collect(Collectors.toList());
        
        List<Map<String, Object>> asks = sellOrders.stream()
            .collect(Collectors.groupingBy(
                Order::getPrice,
                java.util.LinkedHashMap::new,
                Collectors.summingInt(Order::getQuantity)
            ))
            .entrySet().stream()
            .map(e -> Map.<String, Object>of("price", e.getKey(), "quantity", e.getValue()))
            .limit(10) // Top 10 price levels
            .collect(Collectors.toList());
        
        return Map.of(
            "ticker", ticker.toUpperCase(),
            "bids", bids,
            "asks", asks
        );
    }
}