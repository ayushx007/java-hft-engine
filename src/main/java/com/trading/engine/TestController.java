package com.trading.engine;

import com.trading.engine.kafka.OrderProducer;
import com.trading.engine.model.User;
import com.trading.engine.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderProducer orderProducer;

    @PostMapping("/seed")
    public User seedData() {
        return orderService.createDummyUser();
    }

    @PostMapping("/trade")
    public String placeOrder(@RequestParam String ticker, 
                             @RequestParam int quantity,
                             @RequestParam double price,
                             @RequestParam String side) { // BUY or SELL
        
        // Format: SIDE PRICE QUANTITY TICKER
        String orderMessage = side + " " + price + " " + quantity + " " + ticker;
        orderProducer.sendOrder(orderMessage);
        return "Order sent!";
    }
}