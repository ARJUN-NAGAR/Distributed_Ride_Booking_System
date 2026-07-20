package com.uber.rideservice.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic rideRequestedTopic() {
        return TopicBuilder.name("ride.requested")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic rideRequestedRetry1000Topic() {
        return TopicBuilder.name("ride.requested-retry-1000")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic rideRequestedRetry2000Topic() {
        return TopicBuilder.name("ride.requested-retry-2000")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic rideRequestedDltTopic() {
        return TopicBuilder.name("ride.requested-dlt")
                .partitions(3)
                .replicas(1)
                .build();
    }

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
