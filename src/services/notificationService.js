const admin = require('firebase-admin');
const User = require('../models/User');

class NotificationService {
  constructor() {
    this.initializeFirebase();
  }

  // Initialize Firebase Admin SDK
  initializeFirebase() {
    try {
      if (!admin.apps.length) {
        const serviceAccount = {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: process.env.FIREBASE_AUTH_URI,
          token_uri: process.env.FIREBASE_TOKEN_URI
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });

        console.log('✅ Firebase Admin SDK initialized successfully');
      }
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error.message);
    }
  }

  // Send notification to a single device
  async sendToDevice(deviceToken, notification, data = {}) {
    try {
      if (!deviceToken) {
        console.warn('No device token provided');
        return null;
      }

      const message = {
        token: deviceToken,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'cmms_notifications'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      console.log('Notification sent successfully:', response);
      return response;

    } catch (error) {
      console.error('Failed to send notification:', error);
      
      // Handle invalid token errors
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        console.log('Invalid device token, should remove from database');
        // In a real implementation, you might want to remove the invalid token
      }
      
      return null;
    }
  }

  // Send notification to multiple devices
  async sendToMultipleDevices(deviceTokens, notification, data = {}) {
    try {
      if (!deviceTokens || deviceTokens.length === 0) {
        console.warn('No device tokens provided');
        return null;
      }

      // Filter out empty tokens
      const validTokens = deviceTokens.filter(token => token && token.trim());

      if (validTokens.length === 0) {
        console.warn('No valid device tokens found');
        return null;
      }

      const message = {
        tokens: validTokens,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'cmms_notifications'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await admin.messaging().sendMulticast(message);
      console.log(`Notifications sent: ${response.successCount}/${validTokens.length}`);
      
      // Handle failed tokens
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Failed to send to token ${validTokens[idx]}:`, resp.error);
          }
        });
      }

      return response;

    } catch (error) {
      console.error('Failed to send multicast notification:', error);
      return null;
    }
  }

  // Notify about new report
  async notifyNewReport(report) {
    try {
      // Notify technicians and leaders about new report
      const roles = ['technician', 'technician_leader'];
      
      if (report.safety_required) {
        roles.push('admin'); // Notify admin for safety-critical reports
      }

      const users = await User.findByRole('technician');
      const leaders = await User.findByRole('technician_leader');
      const allUsers = [...users, ...leaders];

      const deviceTokens = allUsers
        .map(user => user.device_token)
        .filter(token => token);

      const notification = {
        title: '🚨 New Maintenance Report',
        body: `${report.breakdown_type.toUpperCase()} issue in ${report.sector}${report.safety_required ? ' - SAFETY CRITICAL' : ''}`
      };

      const data = {
        type: 'new_report',
        report_id: report.id,
        sector: report.sector,
        breakdown_type: report.breakdown_type,
        safety_required: report.safety_required.toString()
      };

      await this.sendToMultipleDevices(deviceTokens, notification, data);

    } catch (error) {
      console.error('Failed to notify new report:', error);
    }
  }

  // Notify about report assignment
  async notifyReportAssignment(report, technicianId) {
    try {
      const technician = await User.findById(technicianId);
      
      if (!technician || !technician.device_token) {
        return;
      }

      const notification = {
        title: '📋 Report Assigned',
        body: `You have been assigned a ${report.breakdown_type} issue in ${report.sector}`
      };

      const data = {
        type: 'report_assigned',
        report_id: report.id,
        sector: report.sector,
        breakdown_type: report.breakdown_type
      };

      await this.sendToDevice(technician.device_token, notification, data);

    } catch (error) {
      console.error('Failed to notify report assignment:', error);
    }
  }

  // Notify about status update
  async notifyStatusUpdate(report) {
    try {
      // Notify reporter about status change
      const reporter = await User.findById(report.reporter_id);
      
      if (reporter && reporter.device_token) {
        const statusEmoji = {
          'noticed': '👀',
          'working': '🔧',
          'completed': '✅',
          'archived': '📁'
        };

        const notification = {
          title: `${statusEmoji[report.status]} Report Status Updated`,
          body: `Your report is now ${report.status.toUpperCase()}`
        };

        const data = {
          type: 'status_update',
          report_id: report.id,
          status: report.status
        };

        await this.sendToDevice(reporter.device_token, notification, data);
      }

      // Notify leaders about completed reports
      if (report.status === 'completed') {
        const leaders = await User.findByRole('technician_leader');
        const deviceTokens = leaders
          .map(leader => leader.device_token)
          .filter(token => token);

        const notification = {
          title: '✅ Report Completed',
          body: `${report.breakdown_type} issue in ${report.sector} has been resolved`
        };

        const data = {
          type: 'report_completed',
          report_id: report.id,
          sector: report.sector
        };

        await this.sendToMultipleDevices(deviceTokens, notification, data);
      }

    } catch (error) {
      console.error('Failed to notify status update:', error);
    }
  }

  // Notify about team assignment (call for help)
  async notifyTeamAssignment(reportId, technicianId) {
    try {
      const technician = await User.findById(technicianId);
      
      if (!technician || !technician.device_token) {
        return;
      }

      const notification = {
        title: '🤝 Team Assignment',
        body: 'You have been added to a maintenance team'
      };

      const data = {
        type: 'team_assignment',
        report_id: reportId
      };

      await this.sendToDevice(technician.device_token, notification, data);

    } catch (error) {
      console.error('Failed to notify team assignment:', error);
    }
  }

  // Notify about SLA escalation
  async notifyEscalation(report) {
    try {
      // Notify team leaders about escalated reports
      const leaders = await User.findByRole('technician_leader');
      const admins = await User.findByRole('admin');
      const allUsers = [...leaders, ...admins];

      const deviceTokens = allUsers
        .map(user => user.device_token)
        .filter(token => token);

      const notification = {
        title: '⚠️ Report Escalated',
        body: `SLA exceeded for ${report.breakdown_type} issue in ${report.sector}`
      };

      const data = {
        type: 'escalation',
        report_id: report.id,
        sector: report.sector,
        breakdown_type: report.breakdown_type
      };

      await this.sendToMultipleDevices(deviceTokens, notification, data);

    } catch (error) {
      console.error('Failed to notify escalation:', error);
    }
  }

  // Notify about part request status
  async notifyPartRequestStatus(partRequest, status) {
    try {
      const technician = await User.findById(partRequest.technician_id);
      
      if (!technician || !technician.device_token) {
        return;
      }

      const statusEmoji = {
        'approved': '✅',
        'rejected': '❌',
        'delivered': '📦'
      };

      const notification = {
        title: `${statusEmoji[status]} Part Request ${status.toUpperCase()}`,
        body: `Your request for ${partRequest.part_name} has been ${status}`
      };

      const data = {
        type: 'part_request_status',
        request_id: partRequest.id,
        status: status
      };

      await this.sendToDevice(technician.device_token, notification, data);

    } catch (error) {
      console.error('Failed to notify part request status:', error);
    }
  }

  // Send custom notification
  async sendCustomNotification(userIds, title, body, data = {}) {
    try {
      const users = await Promise.all(
        userIds.map(id => User.findById(id))
      );

      const deviceTokens = users
        .filter(user => user && user.device_token)
        .map(user => user.device_token);

      const notification = { title, body };

      await this.sendToMultipleDevices(deviceTokens, notification, data);

    } catch (error) {
      console.error('Failed to send custom notification:', error);
    }
  }

  // Send notification to all users of specific roles
  async sendToRoles(roles, title, body, data = {}) {
    try {
      const allUsers = [];
      
      for (const role of roles) {
        const users = await User.findByRole(role);
        allUsers.push(...users);
      }

      const deviceTokens = allUsers
        .map(user => user.device_token)
        .filter(token => token);

      const notification = { title, body };

      await this.sendToMultipleDevices(deviceTokens, notification, data);

    } catch (error) {
      console.error('Failed to send notification to roles:', error);
    }
  }

  // Test notification (for development)
  async sendTestNotification(deviceToken) {
    try {
      const notification = {
        title: '🧪 Test Notification',
        body: 'This is a test notification from CMMS backend'
      };

      const data = {
        type: 'test',
        timestamp: new Date().toISOString()
      };

      return await this.sendToDevice(deviceToken, notification, data);

    } catch (error) {
      console.error('Failed to send test notification:', error);
      return null;
    }
  }
}

module.exports = new NotificationService();

