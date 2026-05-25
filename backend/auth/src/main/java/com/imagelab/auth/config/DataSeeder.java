package com.imagelab.auth.config;

import com.imagelab.auth.entity.Role;
import com.imagelab.auth.entity.User;
import com.imagelab.auth.repository.UserRepository;
import com.imagelab.config.events.UserCreatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RabbitTemplate rabbitTemplate;

    @Value("${admin.email}")
    private String adminEmail;

    @Value("${admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseGet(() -> {
                    User newAdmin = User.builder()
                            .name("Admin")
                            .email(adminEmail)
                            .password(passwordEncoder.encode(adminPassword))
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