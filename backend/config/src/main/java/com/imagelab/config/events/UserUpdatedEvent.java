package com.imagelab.config.events;

import java.io.Serializable;

public record UserUpdatedEvent(
        Long id,
        String name,
        String email,
        String role
) implements Serializable {
}