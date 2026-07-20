package com.uber.rideservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
public class SseEmitterService {

    private final Map<UUID, List<SseEmitter>> emitters = new ConcurrentHashMap<>();
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String RIDE_UPDATES_TOPIC = "ride-updates-channel";

    public SseEmitter subscribe(UUID rideId) {
        // Emitters timeout after 10 minutes (600,000 ms)
        SseEmitter emitter = new SseEmitter(600000L);
        
        emitters.computeIfAbsent(rideId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(rideId, emitter));
        emitter.onTimeout(() -> removeEmitter(rideId, emitter));
        emitter.onError((ex) -> removeEmitter(rideId, emitter));

        log.info("Client subscribed to SSE updates for Ride ID: {}", rideId);
        
        // Send initial connection verification event
        try {
            emitter.send(SseEmitter.event()
                    .name("INIT")
                    .data("Connected to ride stream"));
        } catch (IOException e) {
            removeEmitter(rideId, emitter);
        }

        return emitter;
    }

    /**
     * Publishes the update to the Redis Backplane instead of directly to local clients.
     */
    public void publish(UUID rideId, Object data) {
        try {
            // We wrap the data with the rideId so the listener knows who to route it to
            RideUpdateMessage message = new RideUpdateMessage(rideId, data);
            String payload = objectMapper.writeValueAsString(message);
            redisTemplate.convertAndSend(RIDE_UPDATES_TOPIC, payload);
            log.info("Published ride update to Redis Backplane for Ride ID: {}", rideId);
        } catch (Exception e) {
            log.error("Failed to publish ride update to Redis", e);
        }
    }

    /**
     * Called by the RedisMessageListenerAdapter when a message arrives on the channel.
     * Pushes the update to locally connected SSE clients.
     */
    public void handleRedisMessage(String message) {
        try {
            RideUpdateMessage update = objectMapper.readValue(message, RideUpdateMessage.class);
            UUID rideId = update.getRideId();
            
            List<SseEmitter> rideEmitters = emitters.get(rideId);
            if (rideEmitters == null || rideEmitters.isEmpty()) {
                return; // No local clients care about this ride
            }

            log.info("Routing Redis broadcast to {} local SSE clients for Ride ID: {}", rideEmitters.size(), rideId);
            List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

            for (SseEmitter emitter : rideEmitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("STATUS_UPDATE")
                            .data(update.getData()));
                } catch (Exception e) {
                    deadEmitters.add(emitter);
                }
            }

            if (!deadEmitters.isEmpty()) {
                rideEmitters.removeAll(deadEmitters);
                if (rideEmitters.isEmpty()) {
                    emitters.remove(rideId);
                }
            }
        } catch (Exception e) {
            log.error("Failed to handle Redis SSE broadcast message", e);
        }
    }

    private void removeEmitter(UUID rideId, SseEmitter emitter) {
        List<SseEmitter> rideEmitters = emitters.get(rideId);
        if (rideEmitters != null) {
            rideEmitters.remove(emitter);
            if (rideEmitters.isEmpty()) {
                emitters.remove(rideId);
            }
        }
        log.info("Disconnected client emitter for Ride ID: {}", rideId);
    }

    // Helper wrapper class for Redis pub/sub serialization
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RideUpdateMessage {
        private UUID rideId;
        private Object data;
    }
}
