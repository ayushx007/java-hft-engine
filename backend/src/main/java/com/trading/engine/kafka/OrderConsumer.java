package com.trading.engine.kafka;

import com.trading.engine.model.Order;
import com.trading.engine.service.OrderMatchingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class OrderConsumer {

    @Autowired
    private OrderMatchingService orderMatchingService;

    @KafkaListener(topics = "stock-orders", groupId = "trading-group")
    public void consume(Order order) {
        System.out.println(String.format("Consumed order: %s %s @ %s", order.getType(), order.getTicker(), order.getPrice()));
        
        // Pass the order directly to the matching engine
        orderMatchingService.processOrder(order);
    }
}