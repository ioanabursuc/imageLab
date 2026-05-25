package com.imagelab.user.service;

import com.imagelab.config.ResourceNotFoundException;
import com.imagelab.config.events.UserCreatedEvent;
import com.imagelab.config.events.UserDeletedEvent;
import com.imagelab.config.events.UserUpdatedEvent;
import com.imagelab.user.dto.UserResponseDto;
import com.imagelab.user.entity.Role;
import com.imagelab.user.entity.User;
import com.imagelab.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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

    private UserResponseDto toDto(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.getCreatedAt()
        );
    }
}