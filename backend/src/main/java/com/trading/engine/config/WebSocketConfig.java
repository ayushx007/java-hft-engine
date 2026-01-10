package com.trading.engine.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Topic prefix: The frontend will subscribe to "/topic/trades"
        config.enableSimpleBroker("/topic");
        // Application prefix: Messages sent from client with "/app" go to controllers
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // The endpoint the frontend connects to.
        // setAllowedOriginPatterns("*") fixes CORS issues for local development
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
    }
}