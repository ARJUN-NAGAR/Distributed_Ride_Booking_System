package com.uber.rideservice.scheduler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uber.rideservice.model.OutboxEvent;
import com.uber.rideservice.model.OutboxStatus;
import com.uber.rideservice.repository.OutboxEventRepository;
import com.uber.common.event.RideRequestedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxProcessor {

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;

    // Run every 2 seconds
    @Scheduled(fixedDelayString = "2000")
    public void processOutboxEvents() {
        List<OutboxEvent> pendingEvents = outboxEventRepository.findByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING);

        for (OutboxEvent event : pendingEvents) {
            try {
                // Parse specifically to RideRequestedEvent if it's the ride requested topic
                Object payloadObject;
                if ("ride.requested".equals(event.getTopic())) {
                    payloadObject = objectMapper.readValue(event.getPayload(), RideRequestedEvent.class);
                } else {
                    payloadObject = objectMapper.readValue(event.getPayload(), Object.class);
                }
                
                kafkaTemplate.send(event.getTopic(), event.getMessageKey(), payloadObject).get(); // synchronous wait for safety

                // Mark as processed
                event.setStatus(OutboxStatus.PROCESSED);
                event.setProcessedAt(LocalDateTime.now());
                outboxEventRepository.save(event);

                log.info("Successfully processed outbox event for topic: {}, key: {}", event.getTopic(), event.getMessageKey());
            } catch (Exception ex) {
                log.error("Failed to process outbox event ID: {}", event.getId(), ex);
                // Optionally add retry count logic, but for now just leave as PENDING or mark FAILED
                // Let's mark it as FAILED if we want to skip it, or keep PENDING to retry forever.
                // Keeping PENDING is risky without a max retry. Let's mark FAILED for simplicity in this demo.
                event.setStatus(OutboxStatus.FAILED);
                outboxEventRepository.save(event);
            }
        }
    }
}
