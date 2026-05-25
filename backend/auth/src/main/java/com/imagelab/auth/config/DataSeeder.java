package com.imagelab.auth.config;

import com.imagelab.auth.entity.Role;
import com.imagelab.auth.entity.User;
import com.imagelab.auth.repository.UserRepository;
import com.imagelab.config.events.UserCreatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RabbitTemplate rabbitTemplate;

    @Override
    public void run(String... args) {
        User admin = userRepository.findByEmail("admin@imagelab.com")
                .orElseGet(() -> {
                    User newAdmin = User.builder()
                            .name("Admin")
                            .email("admin@imagelab.com")
                            .password(passwordEncoder.encode("Admin123!"))
                            .role(Role.ADMIN)
                            .build();

                    return userRepository.save(newAdmin);
                });

        rabbitTemplate.convertAndSend(
                RabbitConfig.USER_EXCHANGE,
                "user.created",
                new UserCreatedEvent(
                        admin.getId(),
                        admin.getName(),
                        admin.getEmail(),
                        admin.getRole().name()
                )
        );
    }
}