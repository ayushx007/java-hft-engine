package com.trading.engine.controller;

import com.trading.engine.model.WatchlistItem;
import com.trading.engine.repository.WatchlistRepository;
import com.trading.engine.service.RedisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/watchlist")
public class WatchlistController {

    @Autowired
    private WatchlistRepository watchlistRepository;

    @Autowired
    private RedisService redisService;

    // Get user's watchlist with current prices
    @GetMapping("/{userId}")
    public ResponseEntity<?> getWatchlist(@PathVariable Long userId) {
        List<WatchlistItem> items = watchlistRepository.findByUserIdOrderByAddedAtDesc(userId);
        
        List<Map<String, Object>> enrichedItems = items.stream().map(item -> {
            BigDecimal currentPrice = redisService.getPrice(item.getTicker());
            Map<String, Object> map = new HashMap<>();
            map.put("id", item.getId());
            map.put("ticker", item.getTicker());
            map.put("currentPrice", currentPrice != null ? currentPrice : BigDecimal.ZERO);
            map.put("addedAt", item.getAddedAt().toString());
            map.put("targetPriceHigh", item.getTargetPriceHigh() != null ? item.getTargetPriceHigh() : 0.0);
            map.put("targetPriceLow", item.getTargetPriceLow() != null ? item.getTargetPriceLow() : 0.0);
            return map;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(enrichedItems);
    }

    // Add ticker to watchlist
    @PostMapping("/{userId}")
    public ResponseEntity<?> addToWatchlist(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {
        
        String ticker = request.get("ticker");
        if (ticker == null || ticker.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ticker is required"));
        }
        
        ticker = ticker.toUpperCase().trim();
        
        // Check if already exists
        if (watchlistRepository.existsByUserIdAndTicker(userId, ticker)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Already in watchlist"));
        }
        
        WatchlistItem item = new WatchlistItem();
        item.setUserId(userId);
        item.setTicker(ticker);
        item.setAddedAt(LocalDateTime.now());
        
        watchlistRepository.save(item);
        
        BigDecimal currentPrice = redisService.getPrice(ticker);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", item.getId());
        response.put("ticker", item.getTicker());
        response.put("currentPrice", currentPrice != null ? currentPrice : BigDecimal.ZERO);
        response.put("addedAt", item.getAddedAt().toString());
        response.put("message", "Added to watchlist");
        
        return ResponseEntity.ok(response);
    }

    // Remove ticker from watchlist
    @DeleteMapping("/{userId}/{ticker}")
    @Transactional
    public ResponseEntity<?> removeFromWatchlist(
            @PathVariable Long userId,
            @PathVariable String ticker) {
        
        ticker = ticker.toUpperCase().trim();
        
        if (!watchlistRepository.existsByUserIdAndTicker(userId, ticker)) {
            return ResponseEntity.notFound().build();
        }
        
        watchlistRepository.deleteByUserIdAndTicker(userId, ticker);
        
        return ResponseEntity.ok(Map.of("message", "Removed from watchlist"));
    }

    // Update price alerts for a watchlist item
    @PutMapping("/{userId}/{ticker}/alerts")
    public ResponseEntity<?> updateAlerts(
            @PathVariable Long userId,
            @PathVariable String ticker,
            @RequestBody Map<String, Double> alerts) {
        
        ticker = ticker.toUpperCase().trim();
        
        return watchlistRepository.findByUserIdAndTicker(userId, ticker)
            .map(item -> {
                if (alerts.containsKey("targetPriceHigh")) {
                    item.setTargetPriceHigh(alerts.get("targetPriceHigh"));
                }
                if (alerts.containsKey("targetPriceLow")) {
                    item.setTargetPriceLow(alerts.get("targetPriceLow"));
                }
                watchlistRepository.save(item);
                return ResponseEntity.ok(Map.of("message", "Alerts updated"));
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
