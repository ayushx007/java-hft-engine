package com.trading.engine.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String ticker;

    @Enumerated(EnumType.STRING)
    private Type type; // Changed to use the inner enum

    private BigDecimal price;
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    private LocalDateTime timestamp = LocalDateTime.now();

    // Inner Enum Definition (Required by OrderMatchingService)
    public enum Type {
        BUY, SELL
    }

    public enum OrderStatus {
        PENDING, FILLED, CANCELLED
    }
}