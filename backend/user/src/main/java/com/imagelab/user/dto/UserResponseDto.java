package com.imagelab.user.dto;

import java.time.LocalDateTime;

public record UserResponseDto(Long id, String name, String email, String role, LocalDateTime createdAt) {}
