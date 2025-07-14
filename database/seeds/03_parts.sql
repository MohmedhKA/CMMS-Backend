-- Sample Parts for CMMS System

INSERT INTO parts (id, part_number, part_name, description, category, manufacturer, unit_price, stock_quantity, minimum_stock, location, is_active, created_at, updated_at) VALUES 

-- Belts and Chains
(uuid_generate_v4(), 'BLT-001', 'Conveyor Belt 10m', 'Heavy duty rubber conveyor belt, 10 meters length', 'Belts', 'BeltCorp Industries', 150.00, 8, 2, 'Warehouse A-1-01', true, NOW(), NOW()),
(uuid_generate_v4(), 'BLT-002', 'Conveyor Belt 5m', 'Medium duty rubber conveyor belt, 5 meters length', 'Belts', 'BeltCorp Industries', 85.00, 12, 3, 'Warehouse A-1-02', true, NOW(), NOW()),
(uuid_generate_v4(), 'BLT-003', 'V-Belt A Section', 'Standard V-belt for motor drives', 'Belts', 'PowerTrans', 25.50, 20, 5, 'Warehouse A-1-03', true, NOW(), NOW()),
(uuid_generate_v4(), 'BLT-004', 'V-Belt B Section', 'Heavy duty V-belt for large motors', 'Belts', 'PowerTrans', 35.75, 15, 4, 'Warehouse A-1-04', true, NOW(), NOW()),
(uuid_generate_v4(), 'CHN-001', 'Roller Chain #40', 'Standard roller chain for light duty', 'Chains', 'ChainMax', 45.00, 10, 2, 'Warehouse A-1-05', true, NOW(), NOW()),
(uuid_generate_v4(), 'CHN-002', 'Roller Chain #60', 'Heavy duty roller chain', 'Chains', 'ChainMax', 65.00, 8, 2, 'Warehouse A-1-06', true, NOW(), NOW()),

-- Hydraulic Components
(uuid_generate_v4(), 'HYD-001', 'Hydraulic Seal Kit Complete', 'Complete seal kit for hydraulic press', 'Hydraulics', 'HydroTech Solutions', 75.50, 6, 2, 'Warehouse B-1-01', true, NOW(), NOW()),
(uuid_generate_v4(), 'HYD-002', 'Hydraulic Pump 5GPM', '5 gallon per minute hydraulic pump', 'Hydraulics', 'HydroTech Solutions', 450.00, 3, 1, 'Warehouse B-1-02', true, NOW(), NOW()),
(uuid_generate_v4(), 'HYD-003', 'Hydraulic Cylinder 4x12', '4 inch bore, 12 inch stroke cylinder', 'Hydraulics', 'HydroTech Solutions', 320.00, 4, 1, 'Warehouse B-1-03', true, NOW(), NOW()),
(uuid_generate_v4(), 'HYD-004', 'Hydraulic Hose 1/2 inch', 'High pressure hydraulic hose, per meter', 'Hydraulics', 'FlexHose Inc', 12.50, 50, 10, 'Warehouse B-1-04', true, NOW(), NOW()),
(uuid_generate_v4(), 'HYD-005', 'Hydraulic Filter Element', 'Return line filter element', 'Hydraulics', 'FilterPro', 28.75, 15, 5, 'Warehouse B-1-05', true, NOW(), NOW()),
(uuid_generate_v4(), 'HYD-006', 'Hydraulic Oil ISO 46', 'High quality hydraulic oil, 20L container', 'Hydraulics', 'LubriMax', 85.00, 12, 3, 'Warehouse B-1-06', true, NOW(), NOW()),

-- Electric Motors and Components
(uuid_generate_v4(), 'MTR-001', 'Electric Motor 5HP 3-Phase', '5 horsepower 3-phase electric motor', 'Motors', 'MotorMax Electric', 450.00, 4, 1, 'Warehouse C-1-01', true, NOW(), NOW()),
(uuid_generate_v4(), 'MTR-002', 'Electric Motor 3HP 3-Phase', '3 horsepower 3-phase electric motor', 'Motors', 'MotorMax Electric', 320.00, 5, 1, 'Warehouse C-1-02', true, NOW(), NOW()),
(uuid_generate_v4(), 'MTR-003', 'Electric Motor 1HP Single Phase', '1 horsepower single phase motor', 'Motors', 'MotorMax Electric', 180.00, 6, 2, 'Warehouse C-1-03', true, NOW(), NOW()),
(uuid_generate_v4(), 'ELC-001', 'Motor Starter 5HP', 'Magnetic motor starter for 5HP motor', 'Electrical', 'ElectroControl', 125.00, 8, 2, 'Warehouse C-1-04', true, NOW(), NOW()),
(uuid_generate_v4(), 'ELC-002', 'Control Relay 24VDC', '24V DC control relay, 4PDT', 'Electrical', 'ElectroControl', 15.50, 25, 8, 'Warehouse C-1-05', true, NOW(), NOW()),
(uuid_generate_v4(), 'ELC-003', 'Proximity Sensor', 'Inductive proximity sensor M18', 'Electrical', 'SensorTech', 45.00, 12, 4, 'Warehouse C-1-06', true, NOW(), NOW()),

-- Bearings
(uuid_generate_v4(), 'BRG-001', 'Ball Bearing 6205', 'Deep groove ball bearing 6205', 'Bearings', 'BearingPro', 25.75, 20, 5, 'Warehouse D-1-01', true, NOW(), NOW()),
(uuid_generate_v4(), 'BRG-002', 'Ball Bearing 6206', 'Deep groove ball bearing 6206', 'Bearings', 'BearingPro', 32.50, 18, 5, 'Warehouse D-1-02', true, NOW(), NOW()),
(uuid_generate_v4(), 'BRG-003', 'Ball Bearing 6207', 'Deep groove ball bearing 6207', 'Bearings', 'BearingPro', 42.00, 15, 4, 'Warehouse D-1-03', true, NOW(), NOW()),
(uuid_generate_v4(), 'BRG-004', 'Roller Bearing 22205', 'Spherical roller bearing 22205', 'Bearings', 'BearingPro', 85.00, 8, 2, 'Warehouse D-1-04', true, NOW(), NOW()),
(uuid_generate_v4(), 'BRG-005', 'Pillow Block Bearing UCP205', 'Pillow block bearing housing UCP205', 'Bearings', 'BearingPro', 65.00, 10, 3, 'Warehouse D-1-05', true, NOW(), NOW()),

-- Filters
(uuid_generate_v4(), 'FLT-001', 'Oil Filter Cartridge', 'Industrial oil filter cartridge', 'Filters', 'FilterTech Pro', 12.50, 30, 8, 'Warehouse E-1-01', true, NOW(), NOW()),
(uuid_generate_v4(), 'FLT-002', 'Air Filter Element', 'Compressed air filter element', 'Filters', 'FilterTech Pro', 18.75, 25, 6, 'Warehouse E-1-02', true, NOW(), NOW()),
(uuid_generate_v4(), 'FLT-003', 'Fuel Filter', 'Diesel fuel filter for generators', 'Filters', 'FilterTech Pro', 22.00, 20, 5, 'Warehouse E-1-03', true, NOW(), NOW()),
(uuid_generate_v4(), 'FLT-004', 'Coolant Filter', 'Coolant system filter cartridge', 'Filters', 'FilterTech Pro', 35.50, 15, 4, 'Warehouse E-1-04', true, NOW(), NOW()),

-- Gaskets and Seals
(uuid_generate_v4(), 'GSK-001', 'O-Ring Kit Metric', 'Metric O-ring assortment kit', 'Gaskets', 'SealMaster', 45.00, 8, 2, 'Warehouse F-1-01', true, NOW(), NOW()),
(uuid_generate_v4(), 'GSK-002', 'O-Ring Kit Imperial', 'Imperial O-ring assortment kit', 'Gaskets', 'SealMaster', 45.00, 8, 2, 'Warehouse F-1-02', true, NOW(), NOW()),
(uuid_generate_v4(), 'GSK-003', 'Flange Gasket 4 inch', '4 inch pipe flange gasket', 'Gaskets', 'SealMaster', 8.50, 25, 8, 'Warehouse F-1-03', true, NOW(), NOW()),
(uuid_generate_v4(), 'GSK-004', 'Shaft Seal 25mm', '25mm shaft seal for pumps', 'Gaskets', 'SealMaster', 15.75, 20, 6, 'Warehouse F-1-04', true, NOW(), NOW()),

-- Fasteners
(uuid_generate_v4(), 'FST-001', 'Hex Bolt M12x50 Grade 8.8', 'High tensile hex bolt M12x50mm', 'Fasteners', 'BoltCorp', 2.50, 100, 25, 'Warehouse G-1-01', true, NOW(), NOW()),
(uuid_generate_v4(), 'FST-002', 'Hex Bolt M16x60 Grade 8.8', 'High tensile hex bolt M16x60mm', 'Fasteners', 'BoltCorp', 4.25, 80, 20, 'Warehouse G-1-02', true, NOW(), NOW()),
(uuid_generate_v4(), 'FST-003', 'Hex Nut M12 Grade 8', 'High tensile hex nut M12', 'Fasteners', 'BoltCorp', 1.25, 150, 40, 'Warehouse G-1-03', true, NOW(), NOW()),
(uuid_generate_v4(), 'FST-004', 'Washer M12 Hardened', 'Hardened steel washer M12', 'Fasteners', 'BoltCorp', 0.75, 200, 50, 'Warehouse G-1-04', true, NOW(), NOW()),
(uuid_generate_v4(), 'FST-005', 'Socket Head Cap Screw M8x25', 'Allen head cap screw M8x25mm', 'Fasteners', 'BoltCorp', 1.85, 120, 30, 'Warehouse G-1-05', true, NOW(), NOW()),

-- Cutting Tools
(uuid_generate_v4(), 'CUT-001', 'End Mill 10mm HSS', '10mm high speed steel end mill', 'Cutting Tools', 'ToolMaster', 35.00, 15, 4, 'Warehouse H-1-01', true, NOW(), NOW()),
(uuid_generate_v4(), 'CUT-002', 'End Mill 12mm Carbide', '12mm carbide end mill', 'Cutting Tools', 'ToolMaster', 65.00, 10, 3, 'Warehouse H-1-02', true, NOW(), NOW()),
(uuid_generate_v4(), 'CUT-003', 'Drill Bit Set HSS', 'High speed steel drill bit set 1-13mm', 'Cutting Tools', 'ToolMaster', 85.00, 6, 2, 'Warehouse H-1-03', true, NOW(), NOW()),
(uuid_generate_v4(), 'CUT-004', 'Lathe Insert CNMG', 'Carbide turning insert CNMG 120408', 'Cutting Tools', 'ToolMaster', 12.50, 50, 15, 'Warehouse H-1-04', true, NOW(), NOW()),
(uuid_generate_v4(), 'CUT-005', 'Bandsaw Blade 27x0.9x2/3', 'Bi-metal bandsaw blade 27x0.9mm', 'Cutting Tools', 'ToolMaster', 45.00, 8, 2, 'Warehouse H-1-05', true, NOW(), NOW()),

-- Welding Supplies
(uuid_generate_v4(), 'WLD-001', 'Welding Rod E6013 3.2mm', 'General purpose welding electrode', 'Welding', 'WeldPro', 25.00, 20, 5, 'Warehouse I-1-01', true, NOW(), NOW()),
(uuid_generate_v4(), 'WLD-002', 'Welding Rod E7018 4.0mm', 'Low hydrogen welding electrode', 'Welding', 'WeldPro', 35.00, 15, 4, 'Warehouse I-1-02', true, NOW(), NOW()),
(uuid_generate_v4(), 'WLD-003', 'MIG Wire ER70S-6 1.2mm', 'MIG welding wire 15kg spool', 'Welding', 'WeldPro', 125.00, 8, 2, 'Warehouse I-1-03', true, NOW(), NOW()),
(uuid_generate_v4(), 'WLD-004', 'Welding Gas CO2', 'Carbon dioxide welding gas cylinder', 'Welding', 'GasTech', 85.00, 6, 2, 'Warehouse I-1-04', true, NOW(), NOW()),

-- Lubricants
(uuid_generate_v4(), 'LUB-001', 'Machine Oil SAE 30', 'General purpose machine oil, 20L', 'Lubricants', 'LubriMax', 65.00, 12, 3, 'Warehouse J-1-01', true, NOW(), NOW()),
(uuid_generate_v4(), 'LUB-002', 'Gear Oil SAE 90', 'Heavy duty gear oil, 20L', 'Lubricants', 'LubriMax', 75.00, 10, 3, 'Warehouse J-1-02', true, NOW(), NOW()),
(uuid_generate_v4(), 'LUB-003', 'Grease Multi-Purpose', 'Lithium based multi-purpose grease, 18kg', 'Lubricants', 'LubriMax', 95.00, 8, 2, 'Warehouse J-1-03', true, NOW(), NOW()),
(uuid_generate_v4(), 'LUB-004', 'Penetrating Oil', 'Penetrating oil spray, 400ml', 'Lubricants', 'LubriMax', 8.50, 30, 10, 'Warehouse J-1-04', true, NOW(), NOW()),

-- Safety Equipment
(uuid_generate_v4(), 'SAF-001', 'Safety Glasses Clear', 'Clear safety glasses with side shields', 'Safety', 'SafetyFirst', 12.50, 50, 15, 'Warehouse K-1-01', true, NOW(), NOW()),
(uuid_generate_v4(), 'SAF-002', 'Hard Hat White', 'White safety hard hat', 'Safety', 'SafetyFirst', 25.00, 30, 10, 'Warehouse K-1-02', true, NOW(), NOW()),
(uuid_generate_v4(), 'SAF-003', 'Work Gloves Leather', 'Leather work gloves, size L', 'Safety', 'SafetyFirst', 15.75, 40, 12, 'Warehouse K-1-03', true, NOW(), NOW()),
(uuid_generate_v4(), 'SAF-004', 'Ear Plugs Foam', 'Disposable foam ear plugs, box of 200', 'Safety', 'SafetyFirst', 35.00, 20, 5, 'Warehouse K-1-04', true, NOW(), NOW()),

-- Low Stock Items (for testing alerts)
(uuid_generate_v4(), 'LOW-001', 'Emergency Repair Kit', 'Emergency machine repair kit', 'Emergency', 'EmergencySupply', 150.00, 1, 3, 'Warehouse L-1-01', true, NOW(), NOW()),
(uuid_generate_v4(), 'LOW-002', 'Critical Spare Motor', 'Critical spare motor for line A', 'Motors', 'MotorMax Electric', 850.00, 0, 1, 'Warehouse L-1-02', true, NOW(), NOW()),
(uuid_generate_v4(), 'LOW-003', 'Urgent Hydraulic Pump', 'Urgent replacement hydraulic pump', 'Hydraulics', 'HydroTech Solutions', 650.00, 1, 2, 'Warehouse L-1-03', true, NOW(), NOW());

-- Display inserted parts count
SELECT 'Parts inserted: ' || COUNT(*) as result FROM parts;

