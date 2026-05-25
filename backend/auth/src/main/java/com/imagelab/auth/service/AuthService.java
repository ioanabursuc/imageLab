package com.imagelab.auth.service;

import com.imagelab.auth.dto.AuthResponse;
import com.imagelab.auth.dto.LoginRequest;
import com.imagelab.auth.dto.RegisterRequest;
import com.imagelab.auth.entity.Role;
import com.imagelab.auth.entity.User;
import com.imagelab.auth.repository.UserRepository;
import com.imagelab.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.imagelab.auth.config.RabbitConfig;
import com.imagelab.config.events.UserCreatedEvent;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RabbitTemplate rabbitTemplate;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CLIENT)
                .build();

        User savedUser = userRepository.save(user);

        rabbitTemplate.convertAndSend(
                RabbitConfig.USER_EXCHANGE,
                "user.created",
                new UserCreatedEvent(
                        savedUser.getId(),
                        savedUser.getName(),
                        savedUser.getEmail(),
                        savedUser.getRole().name()
                )
        );

        return AuthResponse.builder()
                .id(savedUser.getId())
                .token(jwtUtil.generateToken(savedUser))
                .email(savedUser.getEmail())
                .name(savedUser.getName())
                .role(savedUser.getRole())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        return AuthResponse.builder()
                .id(user.getId())
                .token(jwtUtil.generateToken(user))
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .build();
    }
}
