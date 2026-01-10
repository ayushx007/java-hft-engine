package com.trading.engine.controller;

import com.trading.engine.model.User;
import com.trading.engine.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/portfolio")
@CrossOrigin(origins = "*") // Allows React (localhost:8081)
public class PortfolioController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{userId}")
    public PortfolioResponse getPortfolio(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Create response object
        PortfolioResponse response = new PortfolioResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername()); // <--- FIX: Setting the Username
        response.setBalance(user.getBalance());
        
        // Mock Holdings (Preserved so frontend table doesn't crash)
        List<Map<String, Object>> holdings = new ArrayList<>();
        holdings.add(Map.of("ticker", "GOOGL", "quantity", 10, "avgPrice", 150.00, "currentPrice", 155.00));
        holdings.add(Map.of("ticker", "MSFT", "quantity", 5, "avgPrice", 200.00, "currentPrice", 202.00));
        
        response.setHoldings(holdings);
        
        return response;
    }

    // Inner class defining the JSON structure
    static class PortfolioResponse {
        private Long id;
        private String username; // <--- New Field
        private BigDecimal balance;
        private List<Map<String, Object>> holdings;

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        
        public BigDecimal getBalance() { return balance; }
        public void setBalance(BigDecimal balance) { this.balance = balance; }
        
        public List<Map<String, Object>> getHoldings() { return holdings; }
        public void setHoldings(List<Map<String, Object>> holdings) { this.holdings = holdings; }
    }
}