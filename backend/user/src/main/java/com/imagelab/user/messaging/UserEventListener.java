package com.imagelab.user.messaging;

import com.imagelab.config.events.UserCreatedEvent;
import com.imagelab.config.events.UserDeletedEvent;
import com.imagelab.config.events.UserUpdatedEvent;
import com.imagelab.user.config.RabbitConfig;
import com.imagelab.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserEventListener {

    private final UserService userService;

    @RabbitListener(queues = RabbitConfig.USER_CREATED_QUEUE)
    public void handleUserCreated(UserCreatedEvent event) {
        userService.createProfileFromEvent(event);
        log.info("Processed user.created event for id={}, email={}", event.id(), event.email());
    }

    @RabbitListener(queues = RabbitConfig.USER_UPDATED_QUEUE)
    public void handleUserUpdated(UserUpdatedEvent event) {
        userService.updateProfileFromEvent(event);
        log.info("Processed user.updated event for id={}, email={}", event.id(), event.email());
    }

    @RabbitListener(queues = RabbitConfig.USER_DELETED_QUEUE)
    public void handleUserDeleted(UserDeletedEvent event) {
        userService.deleteProfileFromEvent(event);
        log.info("Processed user.deleted event for id={}", event.id());
    }
}