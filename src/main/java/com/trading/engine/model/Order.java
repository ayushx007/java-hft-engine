package com.trading.engine.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId; // Who placed this order?

    private String ticker; // e.g., "GOOGL", "AMZN"

    @Enumerated(EnumType.STRING)
    private OrderType type; // BUY or SELL

    private BigDecimal price;

    private Integer quantity;
    
    @Enumerated(EnumType.STRING)
    private OrderStatus status; // PENDING, FILLED, CANCELLED
}

// We define these Enums inside the same file for simplicity, or separate if you prefer
enum OrderType { BUY, SELL }
enum OrderStatus { PENDING, FILLED, CANCELLED }