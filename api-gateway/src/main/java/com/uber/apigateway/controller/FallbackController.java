package com.uber.apigateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/fallback")
@CrossOrigin("*")
public class FallbackController {

    @RequestMapping("/location")
    public ResponseEntity<String> locationFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("Location Service is currently unavailable. Please try again later.");
    }

    @RequestMapping("/ride")
    public ResponseEntity<String> rideFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("Ride Service is currently unavailable. Please try again later.");
    }
}
