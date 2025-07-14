# CMMS API Documentation

## Authentication Routes
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh authentication token
- `POST /api/auth/logout` - User logout

## User Routes
- `GET /api/users` - Get all users (Leaders/Admin)
- `POST /api/users` - Create new user (Admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin)
- `PUT /api/users/:id/role` - Update user role (Admin)
- `GET /api/users/:id/reports` - Get user's reports
- `GET /api/users/:id/assignments` - Get user's current assignments
- `POST /api/users/bulk-create` - Bulk create users (Admin)
- `GET /api/users/search` - Search users
- `GET /api/users/role/:role` - Get users by role

## Report Routes
- `POST /api/reports` - Create new report
- `GET /api/reports` - Get all reports with filtering
- `GET /api/reports/:id` - Get report by ID
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report
- `GET /api/reports/reporter/:id` - Get reports by reporter
- `GET /api/reports/unassigned` - Get unassigned reports
- `GET /api/reports/due-today` - Get reports due today
- `GET /api/reports/escalated` - Get escalated reports
- `PUT /api/reports/:id/assign` - Assign report to technician
- `PUT /api/reports/:id/status` - Update report status
- `POST /api/reports/:id/team` - Add team member to report
- `DELETE /api/reports/:id/team/:technicianId` - Remove team member
- `GET /api/reports/:id/team` - Get report team members
- `POST /api/reports/:id/escalate` - Escalate report
- `POST /api/reports/:id/archive` - Archive report
- `GET /api/reports/export` - Export reports data
- `POST /api/reports/bulk-assign` - Bulk assign reports

## Machine Routes
- `POST /api/machines` - Create new machine
- `GET /api/machines` - Get all machines
- `GET /api/machines/:id` - Get machine by ID
- `PUT /api/machines/:id` - Update machine
- `DELETE /api/machines/:id` - Delete machine
- `GET /api/machines/search` - Search machines
- `GET /api/machines/stats` - Get machine statistics
- `POST /api/machines/bulk` - Bulk create machines
- `POST /api/machines/:id/qr-code` - Generate QR code
- `POST /api/machines/validate-qr` - Validate QR code
- `GET /api/machines/:id/reports` - Get machine reports
- `GET /api/machines/:id/maintenance-history` - Get maintenance history
- `PUT /api/machines/:id/status` - Update machine status

## Part Routes
- `POST /api/parts` - Create new part
- `GET /api/parts` - Get all parts
- `PUT /api/parts/:id` - Update part
- `DELETE /api/parts/:id` - Delete part
- `GET /api/parts/low-stock` - Get low stock parts
- `PUT /api/parts/:id/stock` - Update part stock
- `POST /api/parts/requests` - Create part request
- `GET /api/parts/requests` - Get all part requests
- `GET /api/parts/requests/:id` - Get part request by ID
- `PUT /api/parts/bulk-stock` - Bulk update stock
- `POST /api/parts/bulk-create` - Bulk create parts
- `GET /api/parts/export` - Export parts data
- `POST /api/parts/import` - Import parts from CSV

## File Routes
- `POST /api/files/upload` - Upload single file
- `POST /api/files/upload-multiple` - Upload multiple files
- `POST /api/files/upload-report-image` - Upload report image
- `POST /api/files/upload-part-document` - Upload part document
- `GET /api/files/:filePath` - Serve/download file
- `DELETE /api/files/:filePath` - Delete file
- `GET /api/files/list/:directory` - List files in directory
- `POST /api/files/cleanup` - Cleanup old temporary files
- `GET /api/files/stats` - Get file storage statistics

## Admin Routes
- `GET /api/admin/health` - System health check
- `GET /api/admin/stats` - System statistics
- `POST /api/admin/tasks/:taskName` - Trigger background task
- `GET /api/admin/tasks/status` - Get background tasks status
- `GET /api/admin/logs` - Get system logs
- `POST /api/admin/backup` - Create database backup
- `POST /api/admin/database/optimize` - Optimize database
- `GET /api/admin/database/size` - Get database size
- `POST /api/admin/notifications/test` - Send test notification
- `GET /api/admin/system/info` - Get system information

## Technician Stats Routes
- `GET /api/stats/time-period` - Get stats by time period
- `GET /api/stats/leaderboard` - Get performance leaderboard
- `GET /api/stats/technician/:id/aggregated` - Get aggregated stats
- `GET /api/stats/sector-performance` - Get sector performance
- `GET /api/stats/sla-performance` - Get SLA performance
- `GET /api/stats/productivity-metrics` - Get productivity metrics
- `GET /api/stats/export` - Export statistics data
- `GET /api/stats/reports/monthly` - Get monthly performance report
- `GET /api/stats/reports/quarterly` - Get quarterly performance report