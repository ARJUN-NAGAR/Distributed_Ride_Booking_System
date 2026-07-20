package com.uber.matchingservice.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic rideMatchedTopic() {
        return TopicBuilder.name("ride.matched")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic rideMatchingFailedTopic() {
        return TopicBuilder.name("ride.matching-failed")
                .partitions(3)
                .replicas(1)
                .build();
    }
}
