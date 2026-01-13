package com.trading.engine.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class RedisService {

    @Autowired
    private StringRedisTemplate redisTemplate;

    // Save the latest price of a stock (e.g., "AAPL" -> "150.00")
    public void savePrice(String ticker, BigDecimal price) {
        if (price == null) return;
        redisTemplate.opsForValue().set("PRICE_" + ticker, price.toString());
        System.out.println("💾 Redis: Saved " + ticker + " @ $" + price);
    }

    // Get the latest price (return null if not found)
    public BigDecimal getPrice(String ticker) {
        String priceStr = redisTemplate.opsForValue().get("PRICE_" + ticker);
        return priceStr != null ? new BigDecimal(priceStr) : null;
    }
}