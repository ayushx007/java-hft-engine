package com.trading.engine.controller;

import com.trading.engine.model.Order;
import com.trading.engine.model.Trade;
import com.trading.engine.repository.OrderRepository;
import com.trading.engine.repository.TradeRepository;
import com.trading.engine.kafka.OrderProducer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import com.trading.engine.dto.TradeEvent;
import java.util.stream.Collectors;

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

    @PostMapping("/api/trade")
    public String placeOrder(@RequestBody Order order) {
        if (order.getUserId() == null) {
            order.setUserId(1L); // Default to User 1
        }
        System.out.println("✅ Received Order: " + order.getType() + " " + order.getTicker());
        orderProducer.sendMessage(order);
        return "Order sent to engine!";
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
        // Fix: Pass '0' as the minimum quantity filter
        return tradeRepository.findByBuyerIdOrSellerIdAndQuantityGreaterThan(userId, userId, 0);
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
}