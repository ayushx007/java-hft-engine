package com.trading.engine.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class TradeEvent {
    private String ticker;
    private BigDecimal price;
    private int quantity;
    private String type; // The Frontend needs this: "BUY" or "SELL"
    private LocalDateTime timestamp;
}