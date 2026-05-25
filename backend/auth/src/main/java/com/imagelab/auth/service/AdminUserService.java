package com.imagelab.auth.service;

import com.imagelab.auth.config.RabbitConfig;
import com.imagelab.auth.dto.AdminCreateUserRequest;
import com.imagelab.auth.dto.AdminUpdateUserRequest;
import com.imagelab.auth.dto.AdminUserResponse;
import com.imagelab.auth.entity.Role;
import com.imagelab.auth.entity.User;
import com.imagelab.auth.repository.UserRepository;
import com.imagelab.config.ResourceNotFoundException;
import com.imagelab.config.events.UserCreatedEvent;
import com.imagelab.config.events.UserDeletedEvent;
import com.imagelab.config.events.UserUpdatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RabbitTemplate rabbitTemplate;

    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    public AdminUserResponse createUser(AdminCreateUserRequest request) {
        validateCreateRequest(request);

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        Role role = parseRole(request.getRole());

        User user = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        User saved = userRepository.save(user);

        rabbitTemplate.convertAndSend(
                RabbitConfig.USER_EXCHANGE,
                "user.created",
                new UserCreatedEvent(
                        saved.getId(),
                        saved.getName(),
                        saved.getEmail(),
                        saved.getRole().name()
                )
        );

        return toDto(saved);
    }

    public AdminUserResponse updateUser(Long id, AdminUpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim();

            if (!newEmail.equals(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new IllegalArgumentException("Email already in use");
            }

            user.setEmail(newEmail);
        }

        if (request.getRole() != null && !request.getRole().isBlank()) {
            user.setRole(parseRole(request.getRole()));
        }

        User saved = userRepository.save(user);

        rabbitTemplate.convertAndSend(
                RabbitConfig.USER_EXCHANGE,
                "user.updated",
                new UserUpdatedEvent(
                        saved.getId(),
                        saved.getName(),
                        saved.getEmail(),
                        saved.getRole().name()
                )
        );

        return toDto(saved);
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        userRepository.delete(user);

        rabbitTemplate.convertAndSend(
                RabbitConfig.USER_EXCHANGE,
                "user.deleted",
                new UserDeletedEvent(id)
        );
    }

    private void validateCreateRequest(AdminCreateUserRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
    }

    private Role parseRole(String role) {
        if (role == null || role.isBlank()) {
            return Role.CLIENT;
        }

        return Role.valueOf(role.trim().toUpperCase());
    }

    private AdminUserResponse toDto(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}