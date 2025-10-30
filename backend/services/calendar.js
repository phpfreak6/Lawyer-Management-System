const { google } = require('googleapis');
const axios = require('axios');
const pool = require('../config/database');

/**
 * Google Calendar Integration
 */
class GoogleCalendarService {
  constructor() {
    this.oauth2Client = null;
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
    }
  }

  async syncWithGoogleCalendar(accessToken, refreshToken, userId, tenantId) {
    if (!this.oauth2Client) {
      throw new Error('Google Calendar not configured');
    }

    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      // Get upcoming events from database (both new and existing)
      const [events] = await pool.execute(
        `SELECT * FROM calendar_events 
         WHERE user_id = ? AND tenant_id = ? 
         AND start_datetime >= NOW() 
         ORDER BY start_datetime ASC`,
        [userId, tenantId]
      );

      console.log('Events:', events);
      console.log('UserId:', userId);
      console.log('TenantId:', tenantId);

      // Sync each event to Google Calendar
      for (const event of events) {
        const googleEvent = {
          summary: event.title,
          description: event.description,
          start: { dateTime: event.start_datetime.toISOString(), timeZone: 'Asia/Kolkata' },
          end: { dateTime: event.end_datetime.toISOString(), timeZone: 'Asia/Kolkata' },
          location: event.location,
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: event.reminder_minutes },
              { method: 'popup', minutes: event.reminder_minutes }
            ]
          }
        };

        if (event.google_event_id) {
          // Update existing event
          await calendar.events.update({
            calendarId: 'primary',
            eventId: event.google_event_id,
            resource: googleEvent
          });
        } else {
          // Create new event
          const createdEvent = await calendar.events.insert({
            calendarId: 'primary',
            resource: googleEvent
          });

          // Update database with Google event ID
          await pool.execute(
            'UPDATE calendar_events SET google_event_id = ? WHERE id = ?',
            [createdEvent.data.id, event.id]
          );
        }
      }

      return { synced: events.length };
    } catch (error) {
      console.error('Google Calendar sync error:', error);
      throw error;
    }
  }

  async getGoogleCalendarEvents(accessToken, refreshToken, maxResults = 50) {
    if (!this.oauth2Client) {
      throw new Error('Google Calendar not configured');
    }

    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items;
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      throw error;
    }
  }
}

/**
 * Microsoft Outlook/Office 365 Integration
 */
class OutlookCalendarService {
  constructor() {
    this.clientId = process.env.OUTLOOK_CLIENT_ID;
    this.clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
    this.redirectUri = process.env.OUTLOOK_REDIRECT_URI;
  }

  async syncWithOutlookCalendar(accessToken, userId, tenantId) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Outlook Calendar not configured');
    }

    try {
      // Get upcoming events from database
      const [events] = await pool.execute(
        `SELECT * FROM calendar_events 
         WHERE user_id = ? AND tenant_id = ? 
         AND start_datetime >= NOW() 
         AND outlook_event_id IS NULL
         ORDER BY start_datetime ASC`,
        [userId, tenantId]
      );

      // Sync each event to Outlook
      const syncedCount = 0;
      for (const event of events) {
        const outlookEvent = {
          subject: event.title,
          body: {
            contentType: 'HTML',
            content: event.description || ''
          },
          start: {
            dateTime: event.start_datetime.toISOString(),
            timeZone: 'India Standard Time'
          },
          end: {
            dateTime: event.end_datetime.toISOString(),
            timeZone: 'India Standard Time'
          },
          location: { displayName: event.location }
        };

        const response = await axios.post(
          'https://graph.microsoft.com/v1.0/me/events',
          outlookEvent,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Update database with Outlook event ID
        await pool.execute(
          'UPDATE calendar_events SET outlook_event_id = ? WHERE id = ?',
          [response.data.id, event.id]
        );
      }

      return { synced: events.length };
    } catch (error) {
      console.error('Outlook Calendar sync error:', error);
      throw error;
    }
  }
}

/**
 * Get upcoming hearings for a user
 */
async function getUpcomingHearings(userId, tenantId, days = 7) {
  try {
    const [events] = await pool.execute(
      `SELECT ce.*, c.case_number, c.subject, cl.first_name, cl.last_name
       FROM calendar_events ce
       LEFT JOIN cases c ON ce.case_id = c.id
       LEFT JOIN clients cl ON c.client_id = cl.id
       WHERE ce.user_id = ? AND ce.tenant_id = ?
       AND ce.start_datetime >= NOW()
       AND ce.start_datetime <= DATE_ADD(NOW(), INTERVAL ? DAY)
       ORDER BY ce.start_datetime ASC`,
      [userId, tenantId, days]
    );

    return events;
  } catch (error) {
    console.error('Error fetching upcoming hearings:', error);
    throw error;
  }
}

// Create instances
const googleCalendarService = new GoogleCalendarService();
const outlookCalendarService = new OutlookCalendarService();

module.exports = {
  googleCalendarService,
  outlookCalendarService,
  syncWithGoogleCalendar: (token, refreshToken, userId, tenantId) =>
    googleCalendarService.syncWithGoogleCalendar(token, refreshToken, userId, tenantId),
  syncWithOutlookCalendar: (token, userId, tenantId) =>
    outlookCalendarService.syncWithOutlookCalendar(token, userId, tenantId),
  getUpcomingHearings
};

