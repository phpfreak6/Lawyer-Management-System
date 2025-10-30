const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get communication logs
router.get('/', async (req, res) => {
  try {
    const { client_id, case_id, communication_type, direction } = req.query;
    
    let query = `
      SELECT cl.*, CONCAT(u.first_name, ' ', u.last_name) as sent_by_name,
             cs.case_number, cs.subject as case_subject
      FROM communication_logs cl
      LEFT JOIN users u ON cl.sent_by = u.id
      LEFT JOIN cases cs ON cl.case_id = cs.id
      WHERE cl.tenant_id = ?
    `;
    
    const params = [req.tenantId];

    if (client_id) {
      query += ` AND cl.client_id = ?`;
      params.push(client_id);
    }

    if (case_id) {
      query += ` AND cl.case_id = ?`;
      params.push(case_id);
    }

    if (communication_type) {
      query += ` AND cl.communication_type = ?`;
      params.push(communication_type);
    }

    if (direction) {
      query += ` AND cl.direction = ?`;
      params.push(direction);
    }

    query += ' ORDER BY cl.timestamp DESC';

    const [logs] = await pool.execute(query, params);
    res.json({ logs });
  } catch (error) {
    console.error('Get communication logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create communication log
router.post('/', async (req, res) => {
  try {
    const {
      client_id, case_id, communication_type, direction, subject,
      content, attachments, notes
    } = req.body;

    if (!client_id || !communication_type || !direction) {
      return res.status(400).json({ error: 'Client ID, communication type, and direction are required' });
    }

    // Verify client belongs to tenant
    const [clients] = await pool.execute(
      'SELECT id FROM clients WHERE id = ? AND tenant_id = ?',
      [client_id, req.tenantId]
    );

    if (clients.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // If case_id provided, verify case belongs to tenant
    if (case_id) {
      const [cases] = await pool.execute(
        'SELECT id FROM cases WHERE id = ? AND tenant_id = ?',
        [case_id, req.tenantId]
      );

      if (cases.length === 0) {
        return res.status(404).json({ error: 'Case not found' });
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO communication_logs (
        tenant_id, client_id, case_id, communication_type, direction,
        subject, content, sent_by, attachments, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.tenantId, client_id, case_id, communication_type, direction,
       subject, content, req.user.userId,
       attachments ? JSON.stringify(attachments) : null, notes]
    );

    const logId = result.insertId;
    const [logs] = await pool.execute('SELECT * FROM communication_logs WHERE id = ?', [logId]);

    res.status(201).json({ log: logs[0], message: 'Communication log created successfully' });
  } catch (error) {
    console.error('Create communication log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get communication log by ID
router.get('/:id', async (req, res) => {
  try {
    const [logs] = await pool.execute(
      `SELECT cl.*, CONCAT(u.first_name, ' ', u.last_name) as sent_by_name,
              cs.case_number, cs.subject as case_subject,
              c.first_name as client_first_name, c.last_name as client_last_name
       FROM communication_logs cl
       LEFT JOIN users u ON cl.sent_by = u.id
       LEFT JOIN cases cs ON cl.case_id = cs.id
       LEFT JOIN clients c ON cl.client_id = c.id
       WHERE cl.id = ? AND cl.tenant_id = ?`,
      [req.params.id, req.tenantId]
    );

    if (logs.length === 0) {
      return res.status(404).json({ error: 'Communication log not found' });
    }

    res.json({ log: logs[0] });
  } catch (error) {
    console.error('Get communication log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

