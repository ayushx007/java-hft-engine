package com.trading.engine.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    @Bean
    public NewTopic orderTopic() {
        // Creates a topic named "stock-orders" with 1 partition
        return TopicBuilder.name("stock-orders")
                .partitions(1)
                .replicas(1)
                .build();
    }
}