package com.trading.engine.service;

import com.trading.engine.model.Order;
import com.trading.engine.model.Trade;
import com.trading.engine.repository.OrderRepository;
import com.trading.engine.repository.TradeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderMatchingService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final List<Order> buyOrders = new ArrayList<>();
    private final List<Order> sellOrders = new ArrayList<>();

    @Transactional // Ensures Database integrity (All or Nothing)
    public void processOrder(Order newOrder) {
        // Save the incoming order first (so it has an ID)
        orderRepository.save(newOrder);

        if (newOrder.getType().toString().equals("BUY")) {
            matchBuyOrder(newOrder);
        } else {
            matchSellOrder(newOrder);
        }
    }

    private void matchBuyOrder(Order buyOrder) {
        // Simple logic: Find first matching Sell Order
        // In real life, you'd iterate through list to fill quantity fully
        for (Order sellOrder : sellOrders) {
            if (sellOrder.getTicker().equals(buyOrder.getTicker()) &&
                sellOrder.getPrice().compareTo(buyOrder.getPrice()) <= 0) {
                
                executeTrade(buyOrder, sellOrder);
                return; // Assume full fill for simplicity
            }
        }
        buyOrders.add(buyOrder);
    }

    private void matchSellOrder(Order sellOrder) {
        for (Order buyOrder : buyOrders) {
            if (buyOrder.getTicker().equals(sellOrder.getTicker()) &&
                buyOrder.getPrice().compareTo(sellOrder.getPrice()) >= 0) {
                
                executeTrade(buyOrder, sellOrder);
                return;
            }
        }
        sellOrders.add(sellOrder);
    }

    private void executeTrade(Order buyOrder, Order sellOrder) {
        System.out.println("🔥 EXECUTING TRADE: " + buyOrder.getTicker() + " @ $" + sellOrder.getPrice());

        // Create Trade Record
        Trade trade = new Trade();
        trade.setTicker(buyOrder.getTicker());
        trade.setPrice(sellOrder.getPrice()); // Trade happens at Maker price
        trade.setQuantity(Math.min(buyOrder.getQuantity(), sellOrder.getQuantity()));
        trade.setBuyerOrderId(buyOrder.getId());
        trade.setSellerOrderId(sellOrder.getId());
        trade.setTimestamp(LocalDateTime.now());

        tradeRepository.save(trade);

        // Pushes the trade object to anyone listening on "/topic/trades"
        messagingTemplate.convertAndSend("/topic/trades", trade);
        
        // Remove filled orders from memory (Basic Cleanup)
        buyOrders.remove(buyOrder);
        sellOrders.remove(sellOrder);
    }
}