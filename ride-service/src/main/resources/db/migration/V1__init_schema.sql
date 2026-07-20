CREATE TABLE IF NOT EXISTS rides (
    id BINARY(16) NOT NULL,
    passenger_id VARCHAR(255) NOT NULL,
    driver_id VARCHAR(255) NULL,
    pickup_latitude DOUBLE NOT NULL,
    pickup_longitude DOUBLE NOT NULL,
    drop_latitude DOUBLE NOT NULL,
    drop_longitude DOUBLE NOT NULL,
    fare DOUBLE NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NULL DEFAULT NULL,
    PRIMARY KEY (id)
);
