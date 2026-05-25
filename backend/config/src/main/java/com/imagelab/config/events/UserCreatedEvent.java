package com.imagelab.config.events;

import java.io.Serializable;

public record UserCreatedEvent(
        Long id,
        String name,
        String email,
        String role
) implements Serializable {
}