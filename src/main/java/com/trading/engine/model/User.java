package com.trading.engine.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data // Lombok automatically generates Getters, Setters, and toString
@Entity // Tells Spring "This class maps to a Database Table"
@Table(name = "users") // Renames the table to 'users' (Postgres reserved word avoidance)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private BigDecimal balance; // Use BigDecimal for money!
}