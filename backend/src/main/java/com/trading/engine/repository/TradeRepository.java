package com.trading.engine.repository;

import com.trading.engine.model.Trade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TradeRepository extends JpaRepository<Trade, Long> {
    // FIX: Use @Query to correctly group OR/AND conditions
    // This finds trades where user is buyer OR seller, AND quantity > 0
    @Query("SELECT t FROM Trade t WHERE (t.buyerId = :userId OR t.sellerId = :userId) AND t.quantity > :minQuantity ORDER BY t.timestamp DESC")
    List<Trade> findUserTrades(@Param("userId") Long userId, @Param("minQuantity") int minQuantity);

    List<Trade> findTop5ByQuantityGreaterThanOrderByTimestampDesc(int quantity);
}