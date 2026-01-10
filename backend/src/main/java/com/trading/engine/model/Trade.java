package com.trading.engine.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "trades")
public class Trade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ticker;
    private BigDecimal price;
    private Integer quantity;
    
    // Who was involved?
    private Long buyerOrderId;
    private Long sellerOrderId;

    private LocalDateTime timestamp;
}