package com.uber.rideservice.controller;

import com.uber.rideservice.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rides")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class RideSseController {

    private final SseEmitterService sseEmitterService;

    @GetMapping(value = "/{rideId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamRideUpdates(@PathVariable UUID rideId) {
        log.info("Incoming SSE subscription request for ride: {}", rideId);
        return sseEmitterService.subscribe(rideId);
    }
}
