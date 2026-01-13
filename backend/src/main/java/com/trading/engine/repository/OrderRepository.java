package com.trading.engine.repository;

import com.trading.engine.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.math.BigDecimal;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // Find SELL orders that are CHEAPER than or equal to my BUY price (Best Price First)
    List<Order> findByTickerAndTypeAndPriceLessThanEqualOrderByPriceAsc(
        String ticker, 
        Order.Type type, 
        BigDecimal price
    );

    // Find BUY orders that are HIGHER than or equal to my SELL price (Best Price First)
    List<Order> findByTickerAndTypeAndPriceGreaterThanEqualOrderByPriceDesc(
        String ticker, 
        Order.Type type, 
        BigDecimal price
    );
}