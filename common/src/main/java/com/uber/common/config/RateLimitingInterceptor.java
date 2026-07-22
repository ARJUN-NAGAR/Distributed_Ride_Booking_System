package com.uber.common.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitingInterceptor implements HandlerInterceptor {

    private final StringRedisTemplate redisTemplate;
    private final LoadTestConfig loadTestConfig;

    private static final String RATE_LIMIT_PREFIX = "rate:limit:";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String ip = request.getRemoteAddr();
        
        boolean isDdosTest = "true".equalsIgnoreCase(request.getHeader("X-DDoS-Test"));

        // Bypass rate limiting for localhost to allow our load testing scripts to function, unless it's a DDoS simulation
        if (!isDdosTest && ("127.0.0.1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip) || "localhost".equalsIgnoreCase(ip))) {
            return true;
        }

        String driverId = request.getHeader("X-Driver-ID");
        String sessionId = request.getHeader("X-Session-ID");
        String authHeader = request.getHeader("Authorization");

        String key;
        if (isDdosTest) {
            key = RATE_LIMIT_PREFIX + "ddos:" + ip;
        } else if (driverId != null && !driverId.isBlank()) {
            key = RATE_LIMIT_PREFIX + "driver:" + driverId;
        } else if (sessionId != null && !sessionId.isBlank()) {
            key = RATE_LIMIT_PREFIX + "session:" + sessionId;
        } else if (authHeader != null && authHeader.startsWith("Bearer ")) {
            key = RATE_LIMIT_PREFIX + "token:" + authHeader.substring(7).hashCode();
        } else {
            key = RATE_LIMIT_PREFIX + "ip:" + ip;
        }

        int limit;
        if (loadTestConfig.isEnabled()) {
            log.info("⚡ Load test mode ACTIVE — rate limit relaxed to {}/min per identity key", loadTestConfig.getMaxRequestsPerMinute());
            limit = isDdosTest ? loadTestConfig.getDdosThresholdPerMinute() : loadTestConfig.getMaxRequestsPerMinute();
        } else {
            limit = isDdosTest ? 30 : 120;
        }

        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redisTemplate.expire(key, Duration.ofMinutes(1));
        }

        if (count != null && count > limit) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Too many requests. Please try again later.");
            return false;
        }

        return true;
    }
}
