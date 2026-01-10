package com.trading.engine.service;

import com.trading.engine.model.Order;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderMatchingService {

    private final List<Order> buyOrders = new ArrayList<>();
    private final List<Order> sellOrders = new ArrayList<>();

    public void processOrder(Order newOrder) {
        if (newOrder.getType().toString().equals("BUY")) {
            matchBuyOrder(newOrder);
        } else {
            matchSellOrder(newOrder);
        }
    }

    private void matchBuyOrder(Order buyOrder) {
        // Look through existing SELL orders
        for (Order sellOrder : sellOrders) {
            // Logic: Is Sell Price <= Buy Price?
            if (sellOrder.getTicker().equals(buyOrder.getTicker()) &&
                sellOrder.getPrice().compareTo(buyOrder.getPrice()) <= 0) {
                
                System.out.println("🔥 MATCH FOUND! " + buyOrder.getTicker() + " @ $" + sellOrder.getPrice());
                // In a real system, we would decrement quantity and update DB here
                return; // Assume full fill for simplicity
            }
        }
        // No match found? Add to book.
        System.out.println("📌 No Match. Adding BUY to Order Book.");
        buyOrders.add(buyOrder);
    }

    private void matchSellOrder(Order sellOrder) {
        // Look through existing BUY orders
        for (Order buyOrder : buyOrders) {
            // Logic: Is Buy Price >= Sell Price?
            if (buyOrder.getTicker().equals(sellOrder.getTicker()) &&
                buyOrder.getPrice().compareTo(sellOrder.getPrice()) >= 0) {
                
                System.out.println("🔥 MATCH FOUND! " + sellOrder.getTicker() + " @ $" + buyOrder.getPrice());
                return;
            }
        }
        System.out.println("📌 No Match. Adding SELL to Order Book.");
        sellOrders.add(sellOrder);
    }
}