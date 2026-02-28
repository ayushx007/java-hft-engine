package com.trading.engine.config;

import com.trading.engine.model.Holding;
import com.trading.engine.model.Order;
import com.trading.engine.model.User;
import com.trading.engine.repository.HoldingRepository;
import com.trading.engine.repository.OrderRepository;
import com.trading.engine.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder; // <--- Import

import java.math.BigDecimal;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, 
                                   OrderRepository orderRepository,
                                   HoldingRepository holdingRepository,
                                   PasswordEncoder passwordEncoder) { // <--- Inject Encoder
        return args -> {
            // 1. Create User 1 (YOU)
            if (!userRepository.existsById(1L)) {
                User user1 = new User();
                user1.setUsername("trader_1");
                user1.setPassword(passwordEncoder.encode("password")); // <--- Set Password
                user1.setBalance(new BigDecimal("10000.00"));
                userRepository.save(user1);
            }

            // 2. Create User 2 (MARKET MAKER)
            if (!userRepository.existsById(2L)) {
                User user2 = new User();
                user2.setUsername("market_maker");
                user2.setPassword(passwordEncoder.encode("password")); // <--- Set Password
                user2.setBalance(new BigDecimal("1000000.00"));
                userRepository.save(user2);
                
                // Give the Market Maker some AAPL shares to sell
                Holding mmHolding = new Holding();
                mmHolding.setUserId(2L);
                mmHolding.setTicker("AAPL");
                mmHolding.setQuantity(1000); 
                mmHolding.setAveragePrice(new BigDecimal("100.00"));
                holdingRepository.save(mmHolding);

                // 3. Place a SELL Order for User 2
                Order sellOrder = new Order();
                sellOrder.setUserId(2L);
                sellOrder.setTicker("AAPL");
                sellOrder.setPrice(new BigDecimal("150.00"));
                sellOrder.setQuantity(100);
                sellOrder.setType(Order.Type.SELL);
                sellOrder.setStatus(Order.OrderStatus.PENDING);
                orderRepository.save(sellOrder);

                // 4. Place a BUY Order for User 2
                Order buyOrder = new Order();
                buyOrder.setUserId(2L);
                buyOrder.setTicker("AAPL");
                buyOrder.setPrice(new BigDecimal("100.00"));
                buyOrder.setQuantity(100);
                buyOrder.setType(Order.Type.BUY);
                buyOrder.setStatus(Order.OrderStatus.PENDING);
                orderRepository.save(buyOrder);

                System.out.println("✅ Market Maker created with password 'password'");
            }
        };
    }
}