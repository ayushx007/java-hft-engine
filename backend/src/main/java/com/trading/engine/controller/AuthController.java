package com.trading.engine.controller;

import com.trading.engine.model.User;
import com.trading.engine.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public User register(@RequestBody User user) {
        // Encode password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // Give default balance if not provided
        if (user.getBalance() == null) {
            user.setBalance(new BigDecimal("10000.00"));
        }
        
        return userRepository.save(user);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> payload) {
        String username = payload.get("username");
        String password = payload.get("password");

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (passwordEncoder.matches(password, user.getPassword())) {
            return Map.of(
                "message", "Login successful",
                "userId", user.getId(),
                "username", user.getUsername(),
                // In Phase 2, we will return a real JWT here
                "token", "dummy-token-" + user.getId() 
            );
        } else {
            throw new RuntimeException("Invalid credentials");
        }
    }
}