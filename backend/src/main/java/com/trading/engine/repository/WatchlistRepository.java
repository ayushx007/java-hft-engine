package com.trading.engine.repository;

import com.trading.engine.model.WatchlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WatchlistRepository extends JpaRepository<WatchlistItem, Long> {
    List<WatchlistItem> findByUserIdOrderByAddedAtDesc(Long userId);
    Optional<WatchlistItem> findByUserIdAndTicker(Long userId, String ticker);
    void deleteByUserIdAndTicker(Long userId, String ticker);
    boolean existsByUserIdAndTicker(Long userId, String ticker);
}
