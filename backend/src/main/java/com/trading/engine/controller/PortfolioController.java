package com.trading.engine.controller;

import com.trading.engine.model.Holding;
import com.trading.engine.model.User;
import com.trading.engine.repository.HoldingRepository;
import com.trading.engine.repository.UserRepository;
import com.trading.engine.service.RedisService; // <--- Import RedisService
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/portfolio")
@CrossOrigin(origins = "*")
public class PortfolioController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HoldingRepository holdingRepository;

    @Autowired
    private RedisService redisService; // <--- Inject Redis Service

    @GetMapping("/{userId}")
    public Map<String, Object> getPortfolio(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Holding> dbHoldings = holdingRepository.findByUserId(userId);

        List<Map<String, Object>> formattedHoldings = dbHoldings.stream().map(h -> {
            // 1. Try to get real-time price from Redis
            BigDecimal currentPrice = redisService.getPrice(h.getTicker());
            
            // 2. If Redis is empty (no trades yet), fallback to avg price
            if (currentPrice == null) {
                currentPrice = h.getAveragePrice();
            }

            return Map.<String, Object>of(
                "ticker", h.getTicker(),
                "quantity", h.getQuantity(),
                "avgPrice", h.getAveragePrice(),
                "currentPrice", currentPrice // <--- Now using REAL Redis data!
            );
        }).collect(Collectors.toList());

        return Map.of(
            "id", user.getId(),
            "username", user.getUsername(),
            "balance", user.getBalance(),
            "holdings", formattedHoldings
        );
    }
}