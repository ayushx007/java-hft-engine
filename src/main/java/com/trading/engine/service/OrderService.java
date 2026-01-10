package com.trading.engine.service;

import com.trading.engine.model.User;
import com.trading.engine.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class OrderService {

    @Autowired
    private UserRepository userRepository;

    // A simple method to seed a dummy user for testing
    public User createDummyUser() {
        User user = new User();
        user.setUsername("trader_1");
        user.setBalance(new BigDecimal("10000.00")); // Give them $10,000
        return userRepository.save(user);
    }
}