const express = require('express');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { syncWithGoogleCalendar } = require('../services/calendar');
const router = express.Router();

// Google OAuth consent: redirect user to Google
router.get('/google/auth', authenticate, async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
      return res.status(400).json({ error: 'Google OAuth not configured' });
    }
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    const scopes = ['https://www.googleapis.com/auth/calendar'];
    const stateToken = jwt.sign(
      { uid: req.user.id || req.user.userId, tid: req.tenantId },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );
    const url = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes, prompt: 'consent', state: stateToken });
    res.json({ url });
  } catch (err) {
    console.error('Google auth init error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google OAuth callback: exchange code for tokens and store on user
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send('Missing code');
    console.log('Google callback - code:', code ? 'present' : 'missing', 'state:', state ? 'present' : 'missing');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    let tokens;
    try {
      const result = await oauth2Client.getToken(code);
      tokens = result.tokens;
      console.log('Google tokens received - access_token:', tokens.access_token ? 'present' : 'missing', 'refresh_token:', tokens.refresh_token ? 'present' : 'missing');
    } catch (err) {
      console.error('Google token exchange error:', err);
      return res.status(500).send(`Token exchange failed: ${err.message}`);
    }

    // Verify state and persist tokens to the correct user
    if (!state) {
      console.error('Missing state in callback');
      return res.status(400).send('Missing state');
    }
    let decoded;
    try {
      decoded = jwt.verify(state, process.env.JWT_SECRET);
      console.log('State verified - uid:', decoded.uid, 'tid:', decoded.tid);
    } catch (e) {
      console.error('State verification failed:', e.message);
      return res.status(400).send('Invalid state');
    }

    const accessToken = tokens.access_token || null;
    const refreshToken = tokens.refresh_token || null;
    const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    if (!accessToken && !refreshToken) {
      console.error('No tokens in Google response');
      return res.status(400).send('No tokens returned by Google');
    }

    console.log('Saving tokens to DB for user:', decoded.uid, 'tenant:', decoded.tid);
    await pool.execute(
      `UPDATE users SET google_access_token = ?, google_refresh_token = ?, google_token_expiry = ? WHERE id = ? AND tenant_id = ?`,
      [accessToken, refreshToken, expiryDate, decoded.uid, decoded.tid]
    );
    console.log('Tokens saved successfully');

    // Redirect back to frontend with success hint
    res.send(`
      <html>
        <body>
          <h2>Google Calendar Connected Successfully!</h2>
          <p>Please return to the app and go to the Calendar page.</p>
          <script>
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Google callback error:', err);
    console.error('Error details:', err.message, err.stack);
    res.status(500).send(`Error connecting Google: ${err.message}`);
  }
});

// Securely store tokens (called from frontend after user completes OAuth flow if using one-time codes)
router.post('/google/store-tokens', authenticate, async (req, res) => {
  try {
    const { access_token, refresh_token, expiry_date } = req.body;
    if (!access_token && !refresh_token) {
      return res.status(400).json({ error: 'No tokens provided' });
    }
    await pool.execute(
      `UPDATE users SET google_access_token = ?, google_refresh_token = ?, google_token_expiry = ? WHERE id = ? AND tenant_id = ?`,
      [access_token || null, refresh_token || null, expiry_date ? new Date(expiry_date) : null, req.user.id || req.user.userId, req.tenantId]
    );
    res.json({ message: 'Google tokens saved' });
  } catch (err) {
    console.error('Store tokens error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Trigger sync
router.post('/google/sync', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT google_access_token, google_refresh_token FROM users WHERE id = ? AND tenant_id = ? LIMIT 1',
      [req.user.id || req.user.userId, req.tenantId]
    );
    if (rows.length === 0 || (!rows[0].google_access_token && !rows[0].google_refresh_token)) {
      return res.status(400).json({ error: 'Google account not connected' });
    }
    const token = rows[0].google_access_token || null;
    const refresh = rows[0].google_refresh_token || null;
    const result = await syncWithGoogleCalendar(token, refresh, req.user.id || req.user.userId, req.tenantId);
    res.json({ message: 'Sync complete', ...result });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Connection status
router.get('/google/status', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT google_access_token, google_refresh_token FROM users WHERE id = ? AND tenant_id = ? LIMIT 1',
      [req.user.id || req.user.userId, req.tenantId]
    );
    const connected = rows.length > 0 && (rows[0].google_access_token || rows[0].google_refresh_token);
    res.json({ connected: !!connected });
  } catch (err) {
    console.error('Google status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Existing calendar CRUD and sync routes (tenant-scoped) ---
const { authorize } = require('../middleware/auth');
const { syncWithOutlookCalendar, getUpcomingHearings } = require('../services/calendar');

// All routes require authentication
router.use(authenticate);

// Get all calendar events
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date, event_type, case_id } = req.query;
    
    let query = `
      SELECT ce.*, c.case_number, c.subject as case_subject,
             CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM calendar_events ce
      LEFT JOIN cases c ON ce.case_id = c.id
      LEFT JOIN users u ON ce.user_id = u.id
      WHERE ce.tenant_id = ?
    `;
    
    const params = [req.tenantId];

    if (start_date) {
      query += ` AND ce.start_datetime >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND ce.start_datetime <= ?`;
      params.push(end_date);
    }

    if (event_type) {
      query += ` AND ce.event_type = ?`;
      params.push(event_type);
    }

    if (case_id) {
      query += ` AND ce.case_id = ?`;
      params.push(case_id);
    }

    query += ' ORDER BY ce.start_datetime ASC';

    const [events] = await pool.execute(query, params);
    res.json({ events });
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get upcoming hearings
router.get('/upcoming', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const events = await getUpcomingHearings(req.user.userId, req.tenantId, days);
    res.json({ events });
  } catch (error) {
    console.error('Get upcoming hearings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create calendar event
router.post('/', async (req, res) => {
  try {
    const {
      case_id, title, description, event_type, start_datetime,
      end_datetime, location, reminder_minutes = 30
    } = req.body;

    if (!title || !start_datetime) {
      return res.status(400).json({ error: 'Title and start date are required' });
    }

    // Normalize datetimes to MySQL-compatible format if ISO provided
    const toMysqlDateTime = (value) => {
      if (!value) return null;
      const d = new Date(value);
      if (isNaN(d.getTime())) return value; // pass-through if not parseable
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');
    };

    const startDt = toMysqlDateTime(start_datetime);
    const endDt = toMysqlDateTime(end_datetime);
    const reminderMins = reminder_minutes === null ? null : Number(reminder_minutes);

    const [result] = await pool.execute(
      `INSERT INTO calendar_events (
        tenant_id, user_id, case_id, title, description, event_type,
        start_datetime, end_datetime, location, reminder_minutes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.tenantId, req.user.userId, case_id, title, description, event_type,
       startDt, endDt, location, reminderMins]
    );

    const eventId = result.insertId;
    const [events] = await pool.execute('SELECT * FROM calendar_events WHERE id = ?', [eventId]);

    res.status(201).json({ event: events[0], message: 'Event created successfully' });
  } catch (error) {
    console.error('Create calendar event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update calendar event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    // Whitelist columns and normalize values
    const allowed = ['case_id', 'title', 'description', 'event_type', 'start_datetime', 'end_datetime', 'location', 'reminder_minutes'];
    const updateFields = [];
    const values = [];

    for (const key of allowed) {
      if (payload[key] !== undefined) {
        let value = payload[key];
        if (value === '') value = null;
        if (key === 'case_id' || key === 'reminder_minutes') {
          value = value === null ? null : Number(value);
        }
        if ((key === 'start_datetime' || key === 'end_datetime') && value) {
          // Ensure MySQL-compatible datetime
          const d = new Date(value);
          if (!isNaN(d.getTime())) {
            value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace('T', ' ');
          }
        }
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id, req.tenantId);

    const query = `
      UPDATE calendar_events 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `;

    const [result] = await pool.execute(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const [events] = await pool.execute('SELECT * FROM calendar_events WHERE id = ?', [id]);

    res.json({ event: events[0], message: 'Event updated successfully' });
  } catch (error) {
    console.error('Update calendar event error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Delete calendar event
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM calendar_events WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete calendar event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sync with Google Calendar
router.post('/sync/google', async (req, res) => {
  try {
    const { access_token, refresh_token } = req.body;

    if (!access_token || !refresh_token) {
      return res.status(400).json({ error: 'Access token and refresh token are required' });
    }

    const result = await syncWithGoogleCalendar(
      access_token,
      refresh_token,
      req.user.userId,
      req.tenantId
    );

    res.json({ message: 'Calendar synced successfully', ...result });
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    res.status(500).json({ error: 'Failed to sync with Google Calendar' });
  }
});

// Sync with Outlook Calendar
router.post('/sync/outlook', async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    const result = await syncWithOutlookCalendar(access_token, req.user.userId, req.tenantId);

    res.json({ message: 'Calendar synced successfully', ...result });
  } catch (error) {
    console.error('Outlook Calendar sync error:', error);
    res.status(500).json({ error: 'Failed to sync with Outlook Calendar' });
  }
});

module.exports = router;

