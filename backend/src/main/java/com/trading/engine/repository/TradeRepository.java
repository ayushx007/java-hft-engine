package com.trading.engine.repository;

import com.trading.engine.model.Trade;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; // <--- THIS WAS MISSING

public interface TradeRepository extends JpaRepository<Trade, Long> {
    // Finds all trades where the user was EITHER the buyer OR the seller
    List<Trade> findByBuyerIdOrSellerId(Long buyerId, Long sellerId);
}