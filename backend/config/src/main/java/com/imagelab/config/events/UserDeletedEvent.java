
package com.imagelab.config.events;

import java.io.Serializable;

public record UserDeletedEvent(
        Long id
) implements Serializable {
}