package com.uber.common.config;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;

@Component
@RequiredArgsConstructor
public class RateLimitingInterceptor implements HandlerInterceptor {

    private final StringRedisTemplate redisTemplate;

    private static final String RATE_LIMIT_PREFIX = "rate:limit:";
    private static final int MAX_REQUESTS_PER_MINUTE = 60;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String ip = request.getRemoteAddr();
        
        boolean isDdosTest = "true".equalsIgnoreCase(request.getHeader("X-DDoS-Test"));

        // Bypass rate limiting for localhost to allow our load testing scripts to function, unless it's a DDoS simulation
        if (!isDdosTest && ("127.0.0.1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip))) {
            return true;
        }

        String key = isDdosTest ? (RATE_LIMIT_PREFIX + "ddos:" + ip) : (RATE_LIMIT_PREFIX + ip);
        int limit = isDdosTest ? 30 : MAX_REQUESTS_PER_MINUTE;

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
