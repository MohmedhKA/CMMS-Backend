-- CMMS Database Initialization Script
-- This script creates all necessary tables for the CMMS system
-- Run this script on a fresh PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('worker', 'technician', 'workers_leader', 'technician_leader', 'admin');
CREATE TYPE breakdown_type AS ENUM ('mechanical', 'electrical', 'other');
CREATE TYPE location_method AS ENUM ('grid', 'qr');
CREATE TYPE report_status AS ENUM ('noticed', 'working', 'completed', 'archived');
CREATE TYPE part_request_status AS ENUM ('requested', 'approved', 'rejected', 'delivered');
CREATE TYPE team_role AS ENUM ('main', 'support', 'leader');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    device_token TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Machine map table for QR codes and machine information
CREATE TABLE machine_map (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_code_value VARCHAR(255) UNIQUE NOT NULL,
    machine_label VARCHAR(255) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    grid_location VARCHAR(100) NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id) NOT NULL,
    breakdown_type breakdown_type NOT NULL,
    description TEXT NOT NULL,
    safety_required BOOLEAN DEFAULT FALSE,
    assistance_required BOOLEAN DEFAULT FALSE,
    location_method location_method NOT NULL,
    sector VARCHAR(100) NOT NULL,
    grid_location VARCHAR(100),
    machine_id UUID REFERENCES machine_map(id),
    image_url TEXT,
    status report_status DEFAULT 'noticed',
    assigned_to UUID REFERENCES users(id),
    sla_timer TIMESTAMP,
    escalated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Technician statistics table
CREATE TABLE technician_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES users(id) NOT NULL,
    sector VARCHAR(100),
    total_assigned INTEGER DEFAULT 0,
    total_completed INTEGER DEFAULT 0,
    high_severity_handled INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    time_window_start TIMESTAMP NOT NULL,
    time_window_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Parts catalog table
CREATE TABLE parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_number VARCHAR(100) UNIQUE NOT NULL,
    part_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(255),
    unit_price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 0,
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Part requests table
CREATE TABLE part_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES users(id) NOT NULL,
    part_id UUID REFERENCES parts(id) NOT NULL,
    quantity_requested INTEGER NOT NULL,
    quantity_approved INTEGER,
    reason TEXT NOT NULL,
    status part_request_status DEFAULT 'requested',
    requested_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    delivered_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Report technicians table (for team assignments)
CREATE TABLE report_technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) NOT NULL,
    technician_id UUID REFERENCES users(id) NOT NULL,
    role team_role DEFAULT 'support',
    joined_at TIMESTAMP DEFAULT NOW(),
    left_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_machine_map_qr_code ON machine_map(qr_code_value);
CREATE INDEX idx_machine_map_sector ON machine_map(sector);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_assigned_to ON reports(assigned_to);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_sector ON reports(sector);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reports_sla_timer ON reports(sla_timer);
CREATE INDEX idx_reports_escalated ON reports(escalated);
CREATE INDEX idx_technician_stats_technician_id ON technician_stats(technician_id);
CREATE INDEX idx_technician_stats_time_window ON technician_stats(time_window_start, time_window_end);
CREATE INDEX idx_parts_part_number ON parts(part_number);
CREATE INDEX idx_parts_category ON parts(category);
CREATE INDEX idx_parts_is_active ON parts(is_active);
CREATE INDEX idx_part_requests_technician_id ON part_requests(technician_id);
CREATE INDEX idx_part_requests_status ON part_requests(status);
CREATE INDEX idx_report_technicians_report_id ON report_technicians(report_id);
CREATE INDEX idx_report_technicians_technician_id ON report_technicians(technician_id);
CREATE INDEX idx_report_technicians_is_active ON report_technicians(is_active);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_machine_map_updated_at BEFORE UPDATE ON machine_map FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_technician_stats_updated_at BEFORE UPDATE ON technician_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_part_requests_updated_at BEFORE UPDATE ON part_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_technicians_updated_at BEFORE UPDATE ON report_technicians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: Admin@123)
INSERT INTO users (id, username, employee_id, password_hash, role) VALUES 
(uuid_generate_v4(), 'admin', 'ADMIN001', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'admin');

-- Insert sample data for testing (optional)
-- Sample sectors and machines
INSERT INTO machine_map (qr_code_value, machine_label, sector, grid_location, created_by) VALUES 
('QR001', 'Conveyor Belt A1', 'Production Line A', 'A1-01', (SELECT id FROM users WHERE employee_id = 'ADMIN001')),
('QR002', 'Hydraulic Press B2', 'Production Line B', 'B2-03', (SELECT id FROM users WHERE employee_id = 'ADMIN001')),
('QR003', 'Packaging Machine C1', 'Packaging', 'C1-02', (SELECT id FROM users WHERE employee_id = 'ADMIN001')),
('QR004', 'Quality Control Station', 'Quality Control', 'QC-01', (SELECT id FROM users WHERE employee_id = 'ADMIN001')),
('QR005', 'Maintenance Workshop', 'Maintenance', 'MW-01', (SELECT id FROM users WHERE employee_id = 'ADMIN001'));

-- Sample parts
INSERT INTO parts (part_number, part_name, description, category, manufacturer, unit_price, stock_quantity, minimum_stock, location) VALUES 
('BLT001', 'Conveyor Belt', 'Heavy duty conveyor belt 10m', 'Belts', 'BeltCorp', 150.00, 5, 2, 'Warehouse A-1'),
('HYD002', 'Hydraulic Seal Kit', 'Complete seal kit for hydraulic press', 'Hydraulics', 'HydroTech', 75.50, 10, 3, 'Warehouse B-2'),
('MTR003', 'Electric Motor 5HP', '5 horsepower electric motor', 'Motors', 'MotorMax', 450.00, 3, 1, 'Warehouse C-1'),
('BRG004', 'Ball Bearing Set', 'High precision ball bearing set', 'Bearings', 'BearingPro', 25.75, 20, 5, 'Warehouse A-2'),
('FLT005', 'Oil Filter', 'Industrial oil filter cartridge', 'Filters', 'FilterTech', 12.50, 50, 10, 'Warehouse B-1');

-- Create views for common queries
CREATE VIEW active_reports AS
SELECT 
    r.*,
    u1.username as reporter_name,
    u2.username as assigned_to_name,
    m.machine_label,
    m.qr_code_value
FROM reports r
LEFT JOIN users u1 ON r.reporter_id = u1.id
LEFT JOIN users u2 ON r.assigned_to = u2.id
LEFT JOIN machine_map m ON r.machine_id = m.id
WHERE r.status IN ('noticed', 'working');

CREATE VIEW overdue_reports AS
SELECT 
    r.*,
    u1.username as reporter_name,
    u2.username as assigned_to_name,
    m.machine_label
FROM reports r
LEFT JOIN users u1 ON r.reporter_id = u1.id
LEFT JOIN users u2 ON r.assigned_to = u2.id
LEFT JOIN machine_map m ON r.machine_id = m.id
WHERE r.sla_timer < NOW() 
AND r.status IN ('noticed', 'working')
AND r.escalated = false;

CREATE VIEW low_stock_parts AS
SELECT *
FROM parts
WHERE stock_quantity <= minimum_stock
AND is_active = true
ORDER BY (stock_quantity - minimum_stock), part_name;

-- Grant permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cmms_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cmms_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cmms_user;

-- Database initialization completed
SELECT 'CMMS Database initialized successfully!' as message;

