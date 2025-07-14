-- Master Seed Script for CMMS Database
-- Run this script to populate the database with sample data

\echo 'Starting CMMS database seeding...'
\echo ''

-- Check if database is properly initialized
SELECT 'Database connection successful' as status;

\echo 'Seeding users...'
\i 01_users.sql
\echo ''

\echo 'Seeding machines...'
\i 02_machines.sql
\echo ''

\echo 'Seeding parts...'
\i 03_parts.sql
\echo ''

\echo 'Seeding reports...'
\i 04_reports.sql
\echo ''

\echo 'Seeding part requests...'
\i 05_part_requests.sql
\echo ''

\echo 'Seeding technician stats...'
\i 06_technician_stats.sql
\echo ''

\echo 'Seeding report technicians...'
\i 07_report_technicians.sql
\echo ''

-- Final summary
\echo 'Seeding completed! Summary:'
SELECT 
  'Users: ' || (SELECT COUNT(*) FROM users) ||
  ', Machines: ' || (SELECT COUNT(*) FROM machine_map) ||
  ', Parts: ' || (SELECT COUNT(*) FROM parts) ||
  ', Reports: ' || (SELECT COUNT(*) FROM reports) ||
  ', Part Requests: ' || (SELECT COUNT(*) FROM part_requests) ||
  ', Technician Stats: ' || (SELECT COUNT(*) FROM technician_stats) ||
  ', Report Technicians: ' || (SELECT COUNT(*) FROM report_technicians)
  as summary;

\echo ''
\echo 'Sample data has been successfully loaded into the CMMS database!'
\echo 'You can now test the API endpoints with realistic data.'
\echo ''
\echo 'Default login credentials:'
\echo 'Admin: employee_id=ADMIN001, password=Test@123'
\echo 'Technician Leader: employee_id=TL001, password=Test@123'
\echo 'Technician: employee_id=TECH001, password=Test@123'
\echo 'Worker: employee_id=WORK001, password=Test@123'

