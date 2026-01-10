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

    private Long userId;
    private String ticker;

    @Enumerated(EnumType.STRING)
    private OrderType type; // Now refers to the public Enum file

    private BigDecimal price;
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;
}