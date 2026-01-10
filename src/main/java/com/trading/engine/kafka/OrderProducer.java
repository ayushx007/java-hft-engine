//this service will take an order and push it into a kafka pipeline
package com.trading.engine.kafka;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class OrderProducer {

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    public void sendOrder(String message) {
        // Logic: Send message to "stock-orders" topic
        System.out.println("➡️ Sending Order to Kafka: " + message);
        kafkaTemplate.send("stock-orders", message);
    }
}