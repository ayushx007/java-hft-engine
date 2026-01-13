package com.trading.engine.service;

import com.trading.engine.model.Holding;
import com.trading.engine.model.Order;
import com.trading.engine.model.Trade;
import com.trading.engine.model.User;
import com.trading.engine.repository.HoldingRepository;
import com.trading.engine.repository.OrderRepository;
import com.trading.engine.repository.TradeRepository;
import com.trading.engine.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class OrderMatchingService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TradeRepository tradeRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private HoldingRepository holdingRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private RedisService redisService; // <--- NEW: Redis Injection

    @Transactional
    public void processOrder(Order newOrder) {
        // 1. Save the new order to DB
        orderRepository.save(newOrder);

        // 2. Find matching orders (Simple Price Priority)
        // BUY looks for cheap SELLS. SELL looks for expensive BUYS.
        List<Order> matchingOrders;
        if (newOrder.getType() == Order.Type.BUY) {
            matchingOrders = orderRepository.findByTickerAndTypeAndPriceLessThanEqualOrderByPriceAsc(
                    newOrder.getTicker(), Order.Type.SELL, newOrder.getPrice());
        } else {
            matchingOrders = orderRepository.findByTickerAndTypeAndPriceGreaterThanEqualOrderByPriceDesc(
                    newOrder.getTicker(), Order.Type.BUY, newOrder.getPrice());
        }

        // 3. Match Logic
        for (Order match : matchingOrders) {
            if (newOrder.getQuantity() <= 0) break;

            int quantityToTrade = Math.min(newOrder.getQuantity(), match.getQuantity());
            BigDecimal tradePrice = match.getPrice(); // Maker's price determines execution price

            // Create and Save Trade
            Trade trade = new Trade();
            trade.setTicker(newOrder.getTicker());
            trade.setPrice(tradePrice);
            trade.setQuantity(quantityToTrade);
            trade.setBuyerId(newOrder.getType() == Order.Type.BUY ? newOrder.getUserId() : match.getUserId());
            trade.setSellerId(newOrder.getType() == Order.Type.SELL ? newOrder.getUserId() : match.getUserId());
            trade.setTimestamp(LocalDateTime.now());
            tradeRepository.save(trade);

            // 4. Update Balances and Holdings (SETTLEMENT)
            settleTrade(trade);

            // 5. Update Order Quantities
            newOrder.setQuantity(newOrder.getQuantity() - quantityToTrade);
            match.setQuantity(match.getQuantity() - quantityToTrade);
            orderRepository.save(match);
            
            // 6. Broadcast to Frontend
            messagingTemplate.convertAndSend("/topic/trades", trade);
        }

        // Save remaining quantity of new order
        orderRepository.save(newOrder);
    }

    /**
     * Handles the movement of Cash and Stock between Buyer and Seller.
     */
    private void settleTrade(Trade trade) {
        // --- 1. Update BUYER (Lose Cash, Gain Stock) ---
        User buyer = userRepository.findById(trade.getBuyerId()).orElseThrow();
        BigDecimal cost = trade.getPrice().multiply(BigDecimal.valueOf(trade.getQuantity()));
        
        buyer.setBalance(buyer.getBalance().subtract(cost));
        userRepository.save(buyer);
        
        updateHolding(trade.getBuyerId(), trade.getTicker(), trade.getQuantity(), trade.getPrice());

        // --- 2. Update SELLER (Gain Cash, Lose Stock) ---
        User seller = userRepository.findById(trade.getSellerId()).orElseThrow();
        
        seller.setBalance(seller.getBalance().add(cost));
        userRepository.save(seller);
        
        // Negative quantity for seller (reducing holdings)
        updateHolding(trade.getSellerId(), trade.getTicker(), -trade.getQuantity(), trade.getPrice());

        // --- 3. NEW: SAVE PRICE TO REDIS ---
        // This makes the price instantly available to the frontend without querying the DB
        redisService.savePrice(trade.getTicker(), trade.getPrice());
    }

    private void updateHolding(Long userId, String ticker, int quantityChange, BigDecimal tradePrice) {
        Optional<Holding> existingHolding = holdingRepository.findByUserIdAndTicker(userId, ticker);

        if (existingHolding.isPresent()) {
            Holding h = existingHolding.get();
            // Calculate new Weighted Average Price only if buying (positive quantity)
            if (quantityChange > 0) {
                BigDecimal totalValue = h.getAveragePrice().multiply(BigDecimal.valueOf(h.getQuantity()));
                BigDecimal newValue = tradePrice.multiply(BigDecimal.valueOf(quantityChange));
                BigDecimal newTotalValue = totalValue.add(newValue);
                int newTotalQty = h.getQuantity() + quantityChange;
                
                // Avoid division by zero
                if (newTotalQty != 0) {
                     h.setAveragePrice(newTotalValue.divide(BigDecimal.valueOf(newTotalQty), java.math.MathContext.DECIMAL32));
                }
            }
            h.setQuantity(h.getQuantity() + quantityChange);
            holdingRepository.save(h);
        } else if (quantityChange > 0) {
            // New Holding
            Holding h = new Holding();
            h.setUserId(userId);
            h.setTicker(ticker);
            h.setQuantity(quantityChange);
            h.setAveragePrice(tradePrice);
            holdingRepository.save(h);
        }
    }
}