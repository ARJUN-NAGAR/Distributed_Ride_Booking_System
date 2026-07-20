package com.uber.rideservice.config;

import com.uber.rideservice.service.SseEmitterService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

@Configuration
public class RedisPubSubConfig {

    public static final String RIDE_UPDATES_TOPIC = "ride-updates-channel";

    @Bean
    public RedisMessageListenerContainer redisContainer(RedisConnectionFactory connectionFactory,
                                                        MessageListenerAdapter messageListenerAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(messageListenerAdapter, new ChannelTopic(RIDE_UPDATES_TOPIC));
        return container;
    }

    @Bean
    public MessageListenerAdapter messageListenerAdapter(SseEmitterService sseEmitterService) {
        // This will call the "handleRedisMessage" method on SseEmitterService
        return new MessageListenerAdapter(sseEmitterService, "handleRedisMessage");
    }
}
