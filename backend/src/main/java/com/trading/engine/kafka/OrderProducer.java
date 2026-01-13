package com.trading.engine.kafka;

import com.trading.engine.model.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class OrderProducer {

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    private static final String TOPIC = "stock-orders";

    public void sendMessage(Order order) {
        System.out.println(String.format("Producing order: %s %s @ %s", order.getType(), order.getTicker(), order.getPrice()));
        kafkaTemplate.send(TOPIC, order);
    }
}