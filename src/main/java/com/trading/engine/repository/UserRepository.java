package com.trading.engine.repository;

import com.trading.engine.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    // You can add custom queries here if needed, e.g.:
    // Optional<User> findByUsername(String username);
}