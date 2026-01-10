//This service will listen to the kafka queue and react whenever a new order arrives.
package com.trading.engine.kafka;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class OrderConsumer {

    @KafkaListener(topics = "stock-orders", groupId = "trading-group")
    public void consume(String message) {
        // This triggers automatically when a message arrives!
        System.out.println("✅ Received Order from Kafka: " + message);
        // TODO: In the future, we will match orders here.
    }
}