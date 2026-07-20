CREATE TABLE IF NOT EXISTS outbox_events (
    id BINARY(16) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    message_key VARCHAR(255) NULL,
    payload TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    processed_at TIMESTAMP(6) NULL DEFAULT NULL,
    PRIMARY KEY (id)
);

CREATE INDEX idx_ride_passenger ON rides (passenger_id);
CREATE INDEX idx_ride_driver ON rides (driver_id);
CREATE INDEX idx_ride_status ON rides (status);
