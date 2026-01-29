-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS workstations CASCADE;

-- Create workers table
CREATE TABLE workers (
  id SERIAL PRIMARY KEY,
  worker_id VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workstations table
CREATE TABLE workstations (
  id SERIAL PRIMARY KEY,
  station_id VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  worker_id VARCHAR(10) NOT NULL REFERENCES workers(worker_id),
  workstation_id VARCHAR(10) NOT NULL REFERENCES workstations(station_id),
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('working', 'idle', 'absent', 'product_count')),
  confidence DECIMAL(4, 3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Unique constraint to prevent duplicate events
  CONSTRAINT unique_event UNIQUE (timestamp, worker_id, workstation_id, event_type)
);

-- Create indexes for faster queries
CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_events_worker_id ON events(worker_id);
CREATE INDEX idx_events_workstation_id ON events(workstation_id);
CREATE INDEX idx_events_event_type ON events(event_type);

-- Seed workers data
INSERT INTO workers (worker_id, name) VALUES
  ('W1', 'John Smith'),
  ('W2', 'Maria Garcia'),
  ('W3', 'David Chen'),
  ('W4', 'Sarah Johnson'),
  ('W5', 'Ahmed Hassan'),
  ('W6', 'Lisa Wong');

-- Seed workstations data
INSERT INTO workstations (station_id, name, type) VALUES
  ('S1', 'Assembly Line A', 'assembly'),
  ('S2', 'Assembly Line B', 'assembly'),
  ('S3', 'Quality Control', 'inspection'),
  ('S4', 'Packaging Station', 'packaging'),
  ('S5', 'CNC Machine 1', 'machining'),
  ('S6', 'Welding Station', 'welding');

-- Seed events data (simulating 8-hour shift with events every 15 minutes)
-- Date: January 15, 2026 (8:00 AM to 4:00 PM shift)

-- Worker W1 at Station S1 (Assembly)
INSERT INTO events (timestamp, worker_id, workstation_id, event_type, confidence, count) VALUES
  ('2026-01-15T08:00:00Z', 'W1', 'S1', 'working', 0.95, 0),
  ('2026-01-15T08:15:00Z', 'W1', 'S1', 'working', 0.92, 0),
  ('2026-01-15T08:30:00Z', 'W1', 'S1', 'product_count', 0.98, 5),
  ('2026-01-15T08:45:00Z', 'W1', 'S1', 'working', 0.91, 0),
  ('2026-01-15T09:00:00Z', 'W1', 'S1', 'product_count', 0.96, 4),
  ('2026-01-15T09:15:00Z', 'W1', 'S1', 'idle', 0.88, 0),
  ('2026-01-15T09:30:00Z', 'W1', 'S1', 'working', 0.94, 0),
  ('2026-01-15T09:45:00Z', 'W1', 'S1', 'product_count', 0.97, 6),
  ('2026-01-15T10:00:00Z', 'W1', 'S1', 'working', 0.93, 0),
  ('2026-01-15T10:15:00Z', 'W1', 'S1', 'product_count', 0.95, 5),
  ('2026-01-15T10:30:00Z', 'W1', 'S1', 'working', 0.90, 0),
  ('2026-01-15T10:45:00Z', 'W1', 'S1', 'idle', 0.87, 0),
  ('2026-01-15T11:00:00Z', 'W1', 'S1', 'working', 0.92, 0),
  ('2026-01-15T11:15:00Z', 'W1', 'S1', 'product_count', 0.94, 4),
  ('2026-01-15T11:30:00Z', 'W1', 'S1', 'working', 0.91, 0),
  ('2026-01-15T11:45:00Z', 'W1', 'S1', 'product_count', 0.96, 5),
  ('2026-01-15T12:00:00Z', 'W1', 'S1', 'absent', 0.99, 0),
  ('2026-01-15T12:15:00Z', 'W1', 'S1', 'absent', 0.99, 0),
  ('2026-01-15T12:30:00Z', 'W1', 'S1', 'absent', 0.99, 0),
  ('2026-01-15T12:45:00Z', 'W1', 'S1', 'absent', 0.99, 0),
  ('2026-01-15T13:00:00Z', 'W1', 'S1', 'working', 0.93, 0),
  ('2026-01-15T13:15:00Z', 'W1', 'S1', 'product_count', 0.95, 5),
  ('2026-01-15T13:30:00Z', 'W1', 'S1', 'working', 0.94, 0),
  ('2026-01-15T13:45:00Z', 'W1', 'S1', 'product_count', 0.97, 6),
  ('2026-01-15T14:00:00Z', 'W1', 'S1', 'working', 0.92, 0),
  ('2026-01-15T14:15:00Z', 'W1', 'S1', 'idle', 0.85, 0),
  ('2026-01-15T14:30:00Z', 'W1', 'S1', 'working', 0.91, 0),
  ('2026-01-15T14:45:00Z', 'W1', 'S1', 'product_count', 0.94, 4),
  ('2026-01-15T15:00:00Z', 'W1', 'S1', 'working', 0.93, 0),
  ('2026-01-15T15:15:00Z', 'W1', 'S1', 'product_count', 0.96, 5),
  ('2026-01-15T15:30:00Z', 'W1', 'S1', 'working', 0.90, 0),
  ('2026-01-15T15:45:00Z', 'W1', 'S1', 'product_count', 0.95, 4);

-- Worker W2 at Station S2 (Assembly)
INSERT INTO events (timestamp, worker_id, workstation_id, event_type, confidence, count) VALUES
  ('2026-01-15T08:00:00Z', 'W2', 'S2', 'working', 0.94, 0),
  ('2026-01-15T08:15:00Z', 'W2', 'S2', 'working', 0.93, 0),
  ('2026-01-15T08:30:00Z', 'W2', 'S2', 'product_count', 0.97, 6),
  ('2026-01-15T08:45:00Z', 'W2', 'S2', 'working', 0.92, 0),
  ('2026-01-15T09:00:00Z', 'W2', 'S2', 'product_count', 0.95, 5),
  ('2026-01-15T09:15:00Z', 'W2', 'S2', 'working', 0.91, 0),
  ('2026-01-15T09:30:00Z', 'W2', 'S2', 'product_count', 0.96, 7),
  ('2026-01-15T09:45:00Z', 'W2', 'S2', 'working', 0.93, 0),
  ('2026-01-15T10:00:00Z', 'W2', 'S2', 'idle', 0.86, 0),
  ('2026-01-15T10:15:00Z', 'W2', 'S2', 'idle', 0.84, 0),
  ('2026-01-15T10:30:00Z', 'W2', 'S2', 'working', 0.90, 0),
  ('2026-01-15T10:45:00Z', 'W2', 'S2', 'product_count', 0.94, 5),
  ('2026-01-15T11:00:00Z', 'W2', 'S2', 'working', 0.92, 0),
  ('2026-01-15T11:15:00Z', 'W2', 'S2', 'product_count', 0.95, 6),
  ('2026-01-15T11:30:00Z', 'W2', 'S2', 'working', 0.91, 0),
  ('2026-01-15T11:45:00Z', 'W2', 'S2', 'product_count', 0.97, 5),
  ('2026-01-15T12:00:00Z', 'W2', 'S2', 'absent', 0.98, 0),
  ('2026-01-15T12:15:00Z', 'W2', 'S2', 'absent', 0.98, 0),
  ('2026-01-15T12:30:00Z', 'W2', 'S2', 'absent', 0.98, 0),
  ('2026-01-15T12:45:00Z', 'W2', 'S2', 'absent', 0.98, 0),
  ('2026-01-15T13:00:00Z', 'W2', 'S2', 'working', 0.94, 0),
  ('2026-01-15T13:15:00Z', 'W2', 'S2', 'product_count', 0.96, 6),
  ('2026-01-15T13:30:00Z', 'W2', 'S2', 'working', 0.93, 0),
  ('2026-01-15T13:45:00Z', 'W2', 'S2', 'product_count', 0.95, 5),
  ('2026-01-15T14:00:00Z', 'W2', 'S2', 'working', 0.92, 0),
  ('2026-01-15T14:15:00Z', 'W2', 'S2', 'product_count', 0.94, 6),
  ('2026-01-15T14:30:00Z', 'W2', 'S2', 'idle', 0.87, 0),
  ('2026-01-15T14:45:00Z', 'W2', 'S2', 'working', 0.91, 0),
  ('2026-01-15T15:00:00Z', 'W2', 'S2', 'product_count', 0.96, 5),
  ('2026-01-15T15:15:00Z', 'W2', 'S2', 'working', 0.93, 0),
  ('2026-01-15T15:30:00Z', 'W2', 'S2', 'product_count', 0.95, 6),
  ('2026-01-15T15:45:00Z', 'W2', 'S2', 'working', 0.92, 0);

-- Worker W3 at Station S3 (Quality Control)
INSERT INTO events (timestamp, worker_id, workstation_id, event_type, confidence, count) VALUES
  ('2026-01-15T08:00:00Z', 'W3', 'S3', 'working', 0.93, 0),
  ('2026-01-15T08:15:00Z', 'W3', 'S3', 'working', 0.91, 0),
  ('2026-01-15T08:30:00Z', 'W3', 'S3', 'product_count', 0.96, 12),
  ('2026-01-15T08:45:00Z', 'W3', 'S3', 'working', 0.94, 0),
  ('2026-01-15T09:00:00Z', 'W3', 'S3', 'product_count', 0.95, 10),
  ('2026-01-15T09:15:00Z', 'W3', 'S3', 'working', 0.92, 0),
  ('2026-01-15T09:30:00Z', 'W3', 'S3', 'product_count', 0.97, 11),
  ('2026-01-15T09:45:00Z', 'W3', 'S3', 'idle', 0.88, 0),
  ('2026-01-15T10:00:00Z', 'W3', 'S3', 'working', 0.90, 0),
  ('2026-01-15T10:15:00Z', 'W3', 'S3', 'product_count', 0.94, 9),
  ('2026-01-15T10:30:00Z', 'W3', 'S3', 'working', 0.93, 0),
  ('2026-01-15T10:45:00Z', 'W3', 'S3', 'product_count', 0.96, 10),
  ('2026-01-15T11:00:00Z', 'W3', 'S3', 'working', 0.91, 0),
  ('2026-01-15T11:15:00Z', 'W3', 'S3', 'product_count', 0.95, 11),
  ('2026-01-15T11:30:00Z', 'W3', 'S3', 'idle', 0.85, 0),
  ('2026-01-15T11:45:00Z', 'W3', 'S3', 'working', 0.92, 0),
  ('2026-01-15T12:00:00Z', 'W3', 'S3', 'absent', 0.99, 0),
  ('2026-01-15T12:15:00Z', 'W3', 'S3', 'absent', 0.99, 0),
  ('2026-01-15T12:30:00Z', 'W3', 'S3', 'absent', 0.99, 0),
  ('2026-01-15T12:45:00Z', 'W3', 'S3', 'absent', 0.99, 0),
  ('2026-01-15T13:00:00Z', 'W3', 'S3', 'working', 0.94, 0),
  ('2026-01-15T13:15:00Z', 'W3', 'S3', 'product_count', 0.97, 10),
  ('2026-01-15T13:30:00Z', 'W3', 'S3', 'working', 0.93, 0),
  ('2026-01-15T13:45:00Z', 'W3', 'S3', 'product_count', 0.96, 12),
  ('2026-01-15T14:00:00Z', 'W3', 'S3', 'idle', 0.86, 0),
  ('2026-01-15T14:15:00Z', 'W3', 'S3', 'working', 0.91, 0),
  ('2026-01-15T14:30:00Z', 'W3', 'S3', 'product_count', 0.95, 9),
  ('2026-01-15T14:45:00Z', 'W3', 'S3', 'working', 0.92, 0),
  ('2026-01-15T15:00:00Z', 'W3', 'S3', 'product_count', 0.94, 11),
  ('2026-01-15T15:15:00Z', 'W3', 'S3', 'working', 0.93, 0),
  ('2026-01-15T15:30:00Z', 'W3', 'S3', 'product_count', 0.96, 10),
  ('2026-01-15T15:45:00Z', 'W3', 'S3', 'working', 0.91, 0);

-- Worker W4 at Station S4 (Packaging)
INSERT INTO events (timestamp, worker_id, workstation_id, event_type, confidence, count) VALUES
  ('2026-01-15T08:00:00Z', 'W4', 'S4', 'working', 0.94, 0),
  ('2026-01-15T08:15:00Z', 'W4', 'S4', 'product_count', 0.96, 8),
  ('2026-01-15T08:30:00Z', 'W4', 'S4', 'working', 0.92, 0),
  ('2026-01-15T08:45:00Z', 'W4', 'S4', 'product_count', 0.95, 9),
  ('2026-01-15T09:00:00Z', 'W4', 'S4', 'working', 0.93, 0),
  ('2026-01-15T09:15:00Z', 'W4', 'S4', 'product_count', 0.97, 7),
  ('2026-01-15T09:30:00Z', 'W4', 'S4', 'idle', 0.87, 0),
  ('2026-01-15T09:45:00Z', 'W4', 'S4', 'working', 0.91, 0),
  ('2026-01-15T10:00:00Z', 'W4', 'S4', 'product_count', 0.94, 8),
  ('2026-01-15T10:15:00Z', 'W4', 'S4', 'working', 0.92, 0),
  ('2026-01-15T10:30:00Z', 'W4', 'S4', 'product_count', 0.96, 9),
  ('2026-01-15T10:45:00Z', 'W4', 'S4', 'working', 0.93, 0),
  ('2026-01-15T11:00:00Z', 'W4', 'S4', 'product_count', 0.95, 8),
  ('2026-01-15T11:15:00Z', 'W4', 'S4', 'idle', 0.85, 0),
  ('2026-01-15T11:30:00Z', 'W4', 'S4', 'working', 0.91, 0),
  ('2026-01-15T11:45:00Z', 'W4', 'S4', 'product_count', 0.97, 7),
  ('2026-01-15T12:00:00Z', 'W4', 'S4', 'absent', 0.98, 0),
  ('2026-01-15T12:15:00Z', 'W4', 'S4', 'absent', 0.98, 0),
  ('2026-01-15T12:30:00Z', 'W4', 'S4', 'absent', 0.98, 0),
  ('2026-01-15T12:45:00Z', 'W4', 'S4', 'absent', 0.98, 0),
  ('2026-01-15T13:00:00Z', 'W4', 'S4', 'working', 0.94, 0),
  ('2026-01-15T13:15:00Z', 'W4', 'S4', 'product_count', 0.96, 9),
  ('2026-01-15T13:30:00Z', 'W4', 'S4', 'working', 0.92, 0),
  ('2026-01-15T13:45:00Z', 'W4', 'S4', 'product_count', 0.95, 8),
  ('2026-01-15T14:00:00Z', 'W4', 'S4', 'working', 0.93, 0),
  ('2026-01-15T14:15:00Z', 'W4', 'S4', 'product_count', 0.97, 7),
  ('2026-01-15T14:30:00Z', 'W4', 'S4', 'working', 0.91, 0),
  ('2026-01-15T14:45:00Z', 'W4', 'S4', 'idle', 0.86, 0),
  ('2026-01-15T15:00:00Z', 'W4', 'S4', 'working', 0.92, 0),
  ('2026-01-15T15:15:00Z', 'W4', 'S4', 'product_count', 0.95, 8),
  ('2026-01-15T15:30:00Z', 'W4', 'S4', 'working', 0.93, 0),
  ('2026-01-15T15:45:00Z', 'W4', 'S4', 'product_count', 0.96, 9);

-- Worker W5 at Station S5 (CNC Machine)
INSERT INTO events (timestamp, worker_id, workstation_id, event_type, confidence, count) VALUES
  ('2026-01-15T08:00:00Z', 'W5', 'S5', 'working', 0.95, 0),
  ('2026-01-15T08:15:00Z', 'W5', 'S5', 'working', 0.94, 0),
  ('2026-01-15T08:30:00Z', 'W5', 'S5', 'product_count', 0.97, 3),
  ('2026-01-15T08:45:00Z', 'W5', 'S5', 'working', 0.93, 0),
  ('2026-01-15T09:00:00Z', 'W5', 'S5', 'working', 0.92, 0),
  ('2026-01-15T09:15:00Z', 'W5', 'S5', 'product_count', 0.96, 4),
  ('2026-01-15T09:30:00Z', 'W5', 'S5', 'working', 0.94, 0),
  ('2026-01-15T09:45:00Z', 'W5', 'S5', 'working', 0.91, 0),
  ('2026-01-15T10:00:00Z', 'W5', 'S5', 'product_count', 0.95, 3),
  ('2026-01-15T10:15:00Z', 'W5', 'S5', 'idle', 0.88, 0),
  ('2026-01-15T10:30:00Z', 'W5', 'S5', 'working', 0.90, 0),
  ('2026-01-15T10:45:00Z', 'W5', 'S5', 'product_count', 0.94, 4),
  ('2026-01-15T11:00:00Z', 'W5', 'S5', 'working', 0.93, 0),
  ('2026-01-15T11:15:00Z', 'W5', 'S5', 'working', 0.92, 0),
  ('2026-01-15T11:30:00Z', 'W5', 'S5', 'product_count', 0.96, 3),
  ('2026-01-15T11:45:00Z', 'W5', 'S5', 'working', 0.91, 0),
  ('2026-01-15T12:00:00Z', 'W5', 'S5', 'absent', 0.99, 0),
  ('2026-01-15T12:15:00Z', 'W5', 'S5', 'absent', 0.99, 0),
  ('2026-01-15T12:30:00Z', 'W5', 'S5', 'absent', 0.99, 0),
  ('2026-01-15T12:45:00Z', 'W5', 'S5', 'absent', 0.99, 0),
  ('2026-01-15T13:00:00Z', 'W5', 'S5', 'working', 0.94, 0),
  ('2026-01-15T13:15:00Z', 'W5', 'S5', 'product_count', 0.97, 4),
  ('2026-01-15T13:30:00Z', 'W5', 'S5', 'working', 0.93, 0),
  ('2026-01-15T13:45:00Z', 'W5', 'S5', 'working', 0.92, 0),
  ('2026-01-15T14:00:00Z', 'W5', 'S5', 'product_count', 0.95, 3),
  ('2026-01-15T14:15:00Z', 'W5', 'S5', 'working', 0.91, 0),
  ('2026-01-15T14:30:00Z', 'W5', 'S5', 'idle', 0.87, 0),
  ('2026-01-15T14:45:00Z', 'W5', 'S5', 'working', 0.90, 0),
  ('2026-01-15T15:00:00Z', 'W5', 'S5', 'product_count', 0.96, 4),
  ('2026-01-15T15:15:00Z', 'W5', 'S5', 'working', 0.94, 0),
  ('2026-01-15T15:30:00Z', 'W5', 'S5', 'working', 0.93, 0),
  ('2026-01-15T15:45:00Z', 'W5', 'S5', 'product_count', 0.95, 3);

-- Worker W6 at Station S6 (Welding)
INSERT INTO events (timestamp, worker_id, workstation_id, event_type, confidence, count) VALUES
  ('2026-01-15T08:00:00Z', 'W6', 'S6', 'working', 0.93, 0),
  ('2026-01-15T08:15:00Z', 'W6', 'S6', 'working', 0.92, 0),
  ('2026-01-15T08:30:00Z', 'W6', 'S6', 'working', 0.94, 0),
  ('2026-01-15T08:45:00Z', 'W6', 'S6', 'product_count', 0.96, 2),
  ('2026-01-15T09:00:00Z', 'W6', 'S6', 'working', 0.91, 0),
  ('2026-01-15T09:15:00Z', 'W6', 'S6', 'working', 0.93, 0),
  ('2026-01-15T09:30:00Z', 'W6', 'S6', 'product_count', 0.95, 3),
  ('2026-01-15T09:45:00Z', 'W6', 'S6', 'idle', 0.88, 0),
  ('2026-01-15T10:00:00Z', 'W6', 'S6', 'working', 0.90, 0),
  ('2026-01-15T10:15:00Z', 'W6', 'S6', 'working', 0.92, 0),
  ('2026-01-15T10:30:00Z', 'W6', 'S6', 'product_count', 0.97, 2),
  ('2026-01-15T10:45:00Z', 'W6', 'S6', 'working', 0.91, 0),
  ('2026-01-15T11:00:00Z', 'W6', 'S6', 'working', 0.93, 0),
  ('2026-01-15T11:15:00Z', 'W6', 'S6', 'product_count', 0.94, 3),
  ('2026-01-15T11:30:00Z', 'W6', 'S6', 'idle', 0.85, 0),
  ('2026-01-15T11:45:00Z', 'W6', 'S6', 'working', 0.92, 0),
  ('2026-01-15T12:00:00Z', 'W6', 'S6', 'absent', 0.98, 0),
  ('2026-01-15T12:15:00Z', 'W6', 'S6', 'absent', 0.98, 0),
  ('2026-01-15T12:30:00Z', 'W6', 'S6', 'absent', 0.98, 0),
  ('2026-01-15T12:45:00Z', 'W6', 'S6', 'absent', 0.98, 0),
  ('2026-01-15T13:00:00Z', 'W6', 'S6', 'working', 0.94, 0),
  ('2026-01-15T13:15:00Z', 'W6', 'S6', 'working', 0.93, 0),
  ('2026-01-15T13:30:00Z', 'W6', 'S6', 'product_count', 0.96, 2),
  ('2026-01-15T13:45:00Z', 'W6', 'S6', 'working', 0.91, 0),
  ('2026-01-15T14:00:00Z', 'W6', 'S6', 'working', 0.92, 0),
  ('2026-01-15T14:15:00Z', 'W6', 'S6', 'product_count', 0.95, 3),
  ('2026-01-15T14:30:00Z', 'W6', 'S6', 'working', 0.93, 0),
  ('2026-01-15T14:45:00Z', 'W6', 'S6', 'idle', 0.86, 0),
  ('2026-01-15T15:00:00Z', 'W6', 'S6', 'working', 0.91, 0),
  ('2026-01-15T15:15:00Z', 'W6', 'S6', 'product_count', 0.97, 2),
  ('2026-01-15T15:30:00Z', 'W6', 'S6', 'working', 0.94, 0),
  ('2026-01-15T15:45:00Z', 'W6', 'S6', 'product_count', 0.96, 3);
