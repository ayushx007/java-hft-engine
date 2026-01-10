package com.trading.engine.kafka;

import com.trading.engine.model.Order;
import com.trading.engine.model.OrderType; // Ensure this matches your package
import com.trading.engine.service.OrderMatchingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class OrderConsumer {

    @Autowired
    private OrderMatchingService matchingService;

    @KafkaListener(topics = "stock-orders", groupId = "trading-group")
    public void consume(String message) {
        try {
            String[] parts = message.split(" ");
            
            Order order = new Order();
            order.setType(OrderType.valueOf(parts[0])); // BUY or SELL
            order.setPrice(new BigDecimal(parts[1]));
            order.setQuantity(Integer.parseInt(parts[2]));
            order.setTicker(parts[3]);

            matchingService.processOrder(order);
        } catch (Exception e) {
            System.err.println("❌ Error parsing order: " + e.getMessage());
        }
    }
}