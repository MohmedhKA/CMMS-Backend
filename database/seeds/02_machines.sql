-- Sample Machines for CMMS System

INSERT INTO machine_map (id, qr_code_value, machine_label, sector, grid_location, created_by, created_at, updated_at) VALUES 
-- Production Line A Machines
(uuid_generate_v4(), 'QR_PROD_A_001', 'Conveyor Belt A1', 'Production Line A', 'A1-01', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_A_002', 'Assembly Station A1', 'Production Line A', 'A1-02', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_A_003', 'Quality Check A1', 'Production Line A', 'A1-03', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_A_004', 'Packaging Unit A1', 'Production Line A', 'A1-04', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_A_005', 'Conveyor Belt A2', 'Production Line A', 'A2-01', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_A_006', 'Assembly Station A2', 'Production Line A', 'A2-02', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_A_007', 'Quality Check A2', 'Production Line A', 'A2-03', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_A_008', 'Packaging Unit A2', 'Production Line A', 'A2-04', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),

-- Production Line B Machines
(uuid_generate_v4(), 'QR_PROD_B_001', 'Hydraulic Press B1', 'Production Line B', 'B1-01', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_B_002', 'Cutting Machine B1', 'Production Line B', 'B1-02', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_B_003', 'Welding Station B1', 'Production Line B', 'B1-03', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_B_004', 'Grinding Machine B1', 'Production Line B', 'B1-04', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_B_005', 'Hydraulic Press B2', 'Production Line B', 'B2-01', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_B_006', 'Cutting Machine B2', 'Production Line B', 'B2-02', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_B_007', 'Welding Station B2', 'Production Line B', 'B2-03', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_B_008', 'Grinding Machine B2', 'Production Line B', 'B2-04', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),

-- Production Line C Machines
(uuid_generate_v4(), 'QR_PROD_C_001', 'CNC Machine C1', 'Production Line C', 'C1-01', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_C_002', 'Lathe Machine C1', 'Production Line C', 'C1-02', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_C_003', 'Milling Machine C1', 'Production Line C', 'C1-03', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_C_004', 'Drilling Machine C1', 'Production Line C', 'C1-04', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_C_005', 'CNC Machine C2', 'Production Line C', 'C2-01', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PROD_C_006', 'Lathe Machine C2', 'Production Line C', 'C2-02', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),

-- Packaging Department
(uuid_generate_v4(), 'QR_PACK_001', 'Automatic Packaging Machine 1', 'Packaging', 'P1-01', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PACK_002', 'Automatic Packaging Machine 2', 'Packaging', 'P1-02', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PACK_003', 'Labeling Machine 1', 'Packaging', 'P1-03', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PACK_004', 'Labeling Machine 2', 'Packaging', 'P1-04', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PACK_005', 'Shrink Wrap Machine', 'Packaging', 'P2-01', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PACK_006', 'Carton Sealing Machine', 'Packaging', 'P2-02', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_PACK_007', 'Palletizing Robot', 'Packaging', 'P2-03', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),

-- Quality Control Department
(uuid_generate_v4(), 'QR_QC_001', 'Coordinate Measuring Machine', 'Quality Control', 'QC-01', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_QC_002', 'Optical Inspection System', 'Quality Control', 'QC-02', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_QC_003', 'Hardness Testing Machine', 'Quality Control', 'QC-03', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_QC_004', 'Tensile Testing Machine', 'Quality Control', 'QC-04', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_QC_005', 'Surface Roughness Tester', 'Quality Control', 'QC-05', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_QC_006', 'Digital Caliper Station', 'Quality Control', 'QC-06', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),

-- Maintenance Workshop
(uuid_generate_v4(), 'QR_MAINT_001', 'Tool Grinder', 'Maintenance', 'MW-01', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_MAINT_002', 'Bench Drill Press', 'Maintenance', 'MW-02', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_MAINT_003', 'Portable Welder', 'Maintenance', 'MW-03', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_MAINT_004', 'Hydraulic Jack', 'Maintenance', 'MW-04', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_MAINT_005', 'Air Compressor', 'Maintenance', 'MW-05', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_MAINT_006', 'Parts Washer', 'Maintenance', 'MW-06', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),

-- Warehouse Equipment
(uuid_generate_v4(), 'QR_WARE_001', 'Forklift 1', 'Warehouse', 'WH-01', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_WARE_002', 'Forklift 2', 'Warehouse', 'WH-02', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_WARE_003', 'Pallet Jack 1', 'Warehouse', 'WH-03', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_WARE_004', 'Pallet Jack 2', 'Warehouse', 'WH-04', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_WARE_005', 'Overhead Crane', 'Warehouse', 'WH-05', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_WARE_006', 'Conveyor System', 'Warehouse', 'WH-06', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),

-- Utilities
(uuid_generate_v4(), 'QR_UTIL_001', 'Main Air Compressor', 'Utilities', 'UT-01', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_UTIL_002', 'Backup Air Compressor', 'Utilities', 'UT-02', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_UTIL_003', 'Cooling Tower', 'Utilities', 'UT-03', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_UTIL_004', 'Electrical Panel A', 'Utilities', 'UT-04', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_UTIL_005', 'Electrical Panel B', 'Utilities', 'UT-05', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_UTIL_006', 'Emergency Generator', 'Utilities', 'UT-06', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_UTIL_007', 'Water Treatment System', 'Utilities', 'UT-07', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_UTIL_008', 'HVAC Unit 1', 'Utilities', 'UT-08', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW()),
(uuid_generate_v4(), 'QR_UTIL_009', 'HVAC Unit 2', 'Utilities', 'UT-09', (SELECT id FROM users WHERE employee_id = 'ADMIN001'), NOW(), NOW());

-- Display inserted machines count
SELECT 'Machines inserted: ' || COUNT(*) as result FROM machine_map;

