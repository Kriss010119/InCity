-- Тип для информации о маршруте на остановке
CREATE TYPE route_info AS (
    route_id INTEGER,
    route_number VARCHAR(50),
    sequence_num INTEGER
);

-- Тип для информации о линии метро на станции
CREATE TYPE metro_line_info AS (
    line_id INTEGER,
    route_number VARCHAR(50),
    color VARCHAR(20),
    sequence_num INTEGER
);

-- Тип для информации о пересадке метро
CREATE TYPE metro_transfer_info AS (
    station_name VARCHAR(500),
    line_id INTEGER,
    route_number VARCHAR(50),
    color VARCHAR(20),
    sequence_num INTEGER
);

CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE bus_routes (
    id SERIAL PRIMARY KEY,
    city_id INT REFERENCES cities(id) ON DELETE CASCADE,
    from_name VARCHAR(255),
    to_name VARCHAR(255),
    operator VARCHAR(255),
    network VARCHAR(255),
    route_number VARCHAR(50) NOT NULL,
    name VARCHAR(500),
    stop_ids BIGINT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE bus_stops (
    id BIGINT PRIMARY KEY,
    city_id INT REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    local_name VARCHAR(500),
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    route_info route_info[] DEFAULT '{}'
);

CREATE TABLE tram_routes (
    id SERIAL PRIMARY KEY,
    city_id INT REFERENCES cities(id) ON DELETE CASCADE,
    from_name VARCHAR(255),
    to_name VARCHAR(255),
    operator VARCHAR(255),
    network VARCHAR(255),
    route_number VARCHAR(50) NOT NULL,
    name VARCHAR(500),
    stop_ids BIGINT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE tram_stops (
    id BIGINT PRIMARY KEY,
    city_id INT REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    local_name VARCHAR(500),
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    route_info route_info[] DEFAULT '{}'
);

CREATE TABLE trolleybus_routes (
    id SERIAL PRIMARY KEY,
    city_id INT REFERENCES cities(id) ON DELETE CASCADE,
    from_name VARCHAR(255),
    to_name VARCHAR(255),
    operator VARCHAR(255),
    network VARCHAR(255),
    route_number VARCHAR(50) NOT NULL,
    name VARCHAR(500),
    stop_ids BIGINT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE trolleybus_stops (
    id BIGINT PRIMARY KEY,
    city_id INT REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    local_name VARCHAR(500),
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    route_info route_info[] DEFAULT '{}'
);

CREATE TABLE metro_lines (
    id SERIAL PRIMARY KEY,
    city_id INT REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    route_number VARCHAR(50) NOT NULL,
    operator VARCHAR(255),
    color_code VARCHAR(20),
    station_ids_forward BIGINT[] NOT NULL DEFAULT '{}',
    station_ids_backward BIGINT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE metro_stations (
    id BIGINT PRIMARY KEY,
    city_id INT REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    local_name VARCHAR(500),
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    is_transfer BOOLEAN DEFAULT FALSE,
    line_info metro_line_info[] DEFAULT '{}',
    transfers metro_transfer_info[] DEFAULT '{}'
);

CREATE TABLE attractions (
    id BIGINT PRIMARY KEY,
    city_id INT REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    category VARCHAR(255) NOT NULL,
    subcategory VARCHAR(255),
    square DECIMAL,
    estimated_visit_minutes INT,
    tags TEXT[]
);

CREATE TABLE arrival_points (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(500) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    point_type VARCHAR(50) NOT NULL
);

-- Индексы
CREATE INDEX ind_bus_stops_latitude ON bus_stops (latitude);
CREATE INDEX ind_bus_stops_longitude ON bus_stops (longitude);
CREATE INDEX ind_tram_stops_latitude ON tram_stops (latitude);
CREATE INDEX ind_tram_stops_longitude ON tram_stops (longitude);
CREATE INDEX ind_trolleybus_stops_latitude ON trolleybus_stops (latitude);
CREATE INDEX ind_trolleybus_stops_longitude ON trolleybus_stops (longitude);
CREATE INDEX ind_metro_stations_latitude ON metro_stations (latitude);
CREATE INDEX ind_metro_stations_longitude ON metro_stations (longitude);
CREATE INDEX ind_attractions_latitude ON attractions (latitude);
CREATE INDEX ind_attractions_longitude ON attractions (longitude);

CREATE INDEX ind_bus_routes_number ON bus_routes (route_number);
CREATE INDEX ind_tram_routes_number ON tram_routes (route_number);
CREATE INDEX ind_trolleybus_routes_number ON trolleybus_routes (route_number);
CREATE INDEX ind_metro_lines_name ON metro_lines (name);
CREATE INDEX ind_metro_lines_route_number ON metro_lines (route_number);

CREATE INDEX ind_bus_routes_stops ON bus_routes USING GIN (stop_ids);
CREATE INDEX ind_tram_routes_stops ON tram_routes USING GIN (stop_ids);
CREATE INDEX ind_trolleybus_routes_stops ON trolleybus_routes USING GIN (stop_ids);
CREATE INDEX ind_metro_lines_forward_stops ON metro_lines USING GIN (station_ids_forward);
CREATE INDEX ind_metro_lines_backward_stops ON metro_lines USING GIN (station_ids_backward);

CREATE INDEX ind_bus_stops_route_info ON bus_stops USING GIN (route_info);
CREATE INDEX ind_tram_stops_route_info ON tram_stops USING GIN (route_info);
CREATE INDEX ind_trolleybus_stops_route_info ON trolleybus_stops USING GIN (route_info);
CREATE INDEX ind_metro_stations_line_info ON metro_stations USING GIN (line_info);

CREATE INDEX ind_arrival_points_code ON arrival_points (code);

CREATE INDEX ind_bus_stops_city ON bus_stops (city_id);
CREATE INDEX ind_bus_routes_city ON bus_routes (city_id);
CREATE INDEX ind_tram_stops_city ON tram_stops (city_id);
CREATE INDEX ind_tram_routes_city ON tram_routes (city_id);
CREATE INDEX ind_trolleybus_stops_city ON trolleybus_stops (city_id);
CREATE INDEX ind_trolleybus_routes_city ON trolleybus_routes (city_id);
CREATE INDEX ind_metro_stations_city ON metro_stations (city_id);
CREATE INDEX ind_metro_lines_city ON metro_lines (city_id);
CREATE INDEX ind_attractions_city ON attractions (city_id);