-- Sample Users for CMMS System
-- Password for all users: Test@123 (hashed with bcrypt)

INSERT INTO users (id, username, employee_id, password_hash, role, device_token, created_at, updated_at) VALUES 
-- Admin Users
(uuid_generate_v4(), 'admin', 'ADMIN001', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'admin', 'admin_device_token_001', NOW(), NOW()),
(uuid_generate_v4(), 'system_admin', 'ADMIN002', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'admin', 'admin_device_token_002', NOW(), NOW()),

-- Technician Leaders
(uuid_generate_v4(), 'john_leader', 'TL001', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'technician_leader', 'tech_leader_token_001', NOW(), NOW()),
(uuid_generate_v4(), 'sarah_leader', 'TL002', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'technician_leader', 'tech_leader_token_002', NOW(), NOW()),
(uuid_generate_v4(), 'mike_leader', 'TL003', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'technician_leader', 'tech_leader_token_003', NOW(), NOW()),

-- Workers Leaders
(uuid_generate_v4(), 'lisa_supervisor', 'WL001', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'workers_leader', 'worker_leader_token_001', NOW(), NOW()),
(uuid_generate_v4(), 'david_supervisor', 'WL002', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'workers_leader', 'worker_leader_token_002', NOW(), NOW()),

-- Technicians
(uuid_generate_v4(), 'alex_tech', 'TECH001', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'technician', 'tech_device_token_001', NOW(), NOW()),
(uuid_generate_v4(), 'maria_tech', 'TECH002', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'technician', 'tech_device_token_002', NOW(), NOW()),
(uuid_generate_v4(), 'james_tech', 'TECH003', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'technician', 'tech_device_token_003', NOW(), NOW()),
(uuid_generate_v4(), 'emma_tech', 'TECH004', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'technician', 'tech_device_token_004', NOW(), NOW()),
(uuid_generate_v4(), 'robert_tech', 'TECH005', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'technician', 'tech_device_token_005', NOW(), NOW()),
(uuid_generate_v4(), 'sophia_tech', 'TECH006', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'technician', 'tech_device_token_006', NOW(), NOW()),
(uuid_generate_v4(), 'william_tech', 'TECH007', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'technician', 'tech_device_token_007', NOW(), NOW()),
(uuid_generate_v4(), 'olivia_tech', 'TECH008', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'technician', 'tech_device_token_008', NOW(), NOW()),

-- Workers
(uuid_generate_v4(), 'carlos_worker', 'WORK001', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'worker', 'worker_device_token_001', NOW(), NOW()),
(uuid_generate_v4(), 'anna_worker', 'WORK002', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'worker', 'worker_device_token_002', NOW(), NOW()),
(uuid_generate_v4(), 'daniel_worker', 'WORK003', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'worker', 'worker_device_token_003', NOW(), NOW()),
(uuid_generate_v4(), 'jessica_worker', 'WORK004', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'worker', 'worker_device_token_004', NOW(), NOW()),
(uuid_generate_v4(), 'kevin_worker', 'WORK005', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'worker', 'worker_device_token_005', NOW(), NOW()),
(uuid_generate_v4(), 'michelle_worker', 'WORK006', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'worker', 'worker_device_token_006', NOW(), NOW()),
(uuid_generate_v4(), 'ryan_worker', 'WORK007', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'worker', 'worker_device_token_007', NOW(), NOW()),
(uuid_generate_v4(), 'amanda_worker', 'WORK008', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'worker', 'worker_device_token_008', NOW(), NOW()),
(uuid_generate_v4(), 'brandon_worker', 'WORK009', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'worker', 'worker_device_token_009', NOW(), NOW()),
(uuid_generate_v4(), 'stephanie_worker', 'WORK010', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'worker', 'worker_device_token_010', NOW(), NOW());

-- Display inserted users count
SELECT 'Users inserted: ' || COUNT(*) as result FROM users;

