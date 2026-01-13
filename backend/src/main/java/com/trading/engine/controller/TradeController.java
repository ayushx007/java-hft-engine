package com.trading.engine.controller;

import com.trading.engine.kafka.OrderProducer;
import com.trading.engine.model.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*") // <--- THIS FIXES YOUR ERROR
public class TradeController {

    @Autowired
    private OrderProducer orderProducer;

    @PostMapping("/trade")
    public String placeOrder(@RequestBody Order order) {
        // 1. Send to Kafka (Engine will process it asynchronously)
        orderProducer.sendMessage(order);
        
        return "Order sent to engine!";
    }
}