package com.imagelab.user.service;

import com.imagelab.config.ResourceNotFoundException;
import com.imagelab.config.events.UserCreatedEvent;
import com.imagelab.user.dto.UpdateUserDto;
import com.imagelab.user.dto.UserResponseDto;
import com.imagelab.user.entity.Role;
import com.imagelab.user.entity.User;
import com.imagelab.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.imagelab.config.events.UserDeletedEvent;
import com.imagelab.config.events.UserUpdatedEvent;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public void createProfileFromEvent(UserCreatedEvent event) {
        if (userRepository.existsById(event.id()) || userRepository.existsByEmail(event.email())) {
            return;
        }

        User user = User.builder()
                .id(event.id())
                .name(event.name())
                .email(event.email())
                .role(Role.valueOf(event.role()))
                .build();

        userRepository.save(user);
    }

    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    public UserResponseDto getByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found: " + email));

        return toDto(user);
    }

    public UserResponseDto updateUserProfile(Long id, UpdateUserDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found: " + id));

        if (dto.name() != null && !dto.name().isBlank()) {
            user.setName(dto.name());
        }

        if (dto.email() != null && !dto.email().isBlank()) {
            if (!dto.email().equals(user.getEmail()) && userRepository.existsByEmail(dto.email())) {
                throw new IllegalArgumentException("Email already in use");
            }

            user.setEmail(dto.email());
        }

        return toDto(userRepository.save(user));
    }

    public void deleteUserProfile(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found: " + id));

        userRepository.delete(user);
    }

    private UserResponseDto toDto(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.getCreatedAt()
        );
    }

    public void updateProfileFromEvent(UserUpdatedEvent event) {
        User user = userRepository.findById(event.id())
                .orElseGet(() -> User.builder()
                        .id(event.id())
                        .build());

        user.setName(event.name());
        user.setEmail(event.email());
        user.setRole(Role.valueOf(event.role()));

        userRepository.save(user);
    }

    public void deleteProfileFromEvent(UserDeletedEvent event) {
        userRepository.findById(event.id()).ifPresent(userRepository::delete);
    }
}