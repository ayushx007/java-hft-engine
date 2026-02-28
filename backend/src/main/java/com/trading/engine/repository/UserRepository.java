package com.trading.engine.repository;

import com.trading.engine.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional; // <--- ADD THIS

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username); // <--- NEW METHOD
}