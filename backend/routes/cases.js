const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all cases for the tenant
router.get('/', async (req, res) => {
  try {
    const { status, stage, client_id, assigned_to } = req.query;
    
    let query = `
      SELECT c.*, cl.first_name as client_first_name, cl.last_name as client_last_name,
             u.first_name as assigned_first_name, u.last_name as assigned_last_name
      FROM cases c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN users u ON c.assigned_to = u.id
      WHERE c.tenant_id = ?
    `;
    
    const params = [req.tenantId];
    let paramIndex = 2;

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
      paramIndex++;
    }

    if (stage) {
      query += ` AND c.case_stage = ?`;
      params.push(stage);
      paramIndex++;
    }

    if (client_id) {
      query += ` AND c.client_id = ?`;
      params.push(client_id);
      paramIndex++;
    }

    if (assigned_to) {
      query += ` AND c.assigned_to = ?`;
      params.push(assigned_to);
    }

    query += ' ORDER BY c.created_at DESC';

    const [cases] = await pool.execute(query, params);
    res.json({ cases });
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single case by ID
router.get('/:id', async (req, res) => {
  try {
    const [cases] = await pool.execute(
      `SELECT c.*, cl.first_name as client_first_name, cl.last_name as client_last_name,
              cl.email as client_email, cl.phone as client_phone,
              u.first_name as assigned_first_name, u.last_name as assigned_last_name
       FROM cases c
       LEFT JOIN clients cl ON c.client_id = cl.id
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.id = ? AND c.tenant_id = ?`,
      [req.params.id, req.tenantId]
    );

    if (cases.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json({ case: cases[0] });
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new case
router.post('/', async (req, res) => {
  try {
    const {
      case_number, client_id, cnr_number, court_name, court_type, case_type,
      case_stage = 'filing', subject, description, filing_date, next_hearing_date,
      priority = 'medium', assigned_to, billing_rate
    } = req.body;

    if (!case_number || !client_id) {
      return res.status(400).json({ error: 'Case number and client are required' });
    }

    // Normalize optional fields: empty strings -> null, numbers parsed
    const normalize = (v) => (v === '' || v === undefined ? null : v);

    const normalized = {
      cnr_number: normalize(cnr_number),
      court_name: normalize(court_name),
      court_type: normalize(court_type),
      case_type: normalize(case_type),
      case_stage: normalize(case_stage) || 'filing',
      subject: normalize(subject),
      description: normalize(description),
      filing_date: normalize(filing_date),
      next_hearing_date: normalize(next_hearing_date),
      priority: normalize(priority) || 'medium',
      assigned_to: normalize(assigned_to),
      billing_rate: billing_rate === '' || billing_rate === undefined ? null : Number(billing_rate)
    };

    await pool.execute(
      `INSERT INTO cases (
        tenant_id, case_number, client_id, cnr_number, court_name, court_type,
        case_type, case_stage, subject, description, filing_date, next_hearing_date,
        priority, assigned_to, billing_rate
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        case_number,
        client_id,
        normalized.cnr_number,
        normalized.court_name,
        normalized.court_type,
        normalized.case_type,
        normalized.case_stage,
        normalized.subject,
        normalized.description,
        normalized.filing_date,
        normalized.next_hearing_date,
        normalized.priority,
        normalized.assigned_to,
        normalized.billing_rate
      ]
    );

    const [cases] = await pool.execute('SELECT * FROM cases ORDER BY id DESC LIMIT 1');

    res.status(201).json({ case: cases[0], message: 'Case created successfully' });
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update case
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Normalize: convert empty strings to null, parse numbers
    Object.keys(updates).forEach((key) => {
      const value = updates[key];
      if (value === '' || value === undefined) {
        updates[key] = null;
      }
    });
    if (updates.billing_rate !== undefined && updates.billing_rate !== null) {
      updates.billing_rate = Number(updates.billing_rate);
      if (Number.isNaN(updates.billing_rate)) updates.billing_rate = null;
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id, req.tenantId);

    const query = `
      UPDATE cases 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `;

    const [result] = await pool.execute(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const [cases] = await pool.execute('SELECT * FROM cases WHERE id = ?', [id]);

    res.json({ case: cases[0], message: 'Case updated successfully' });
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete case (only admins and lawyers)
router.delete('/:id', authorize('admin', 'lawyer'), async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM cases WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json({ message: 'Case deleted successfully' });
  } catch (error) {
    console.error('Delete case error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get case documents
router.get('/:id/documents', async (req, res) => {
  try {
    const [documents] = await pool.execute(
      `SELECT cd.*, CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name
       FROM case_documents cd
       LEFT JOIN users u ON cd.uploaded_by = u.id
       WHERE cd.case_id = ?
       ORDER BY cd.created_at DESC`,
      [req.params.id]
    );

    res.json({ documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get case timeline/tasks
router.get('/:id/timeline', async (req, res) => {
  try {
    const [tasks] = await pool.execute(
      `SELECT t.*, CONCAT(u.first_name, ' ', u.last_name) as assigned_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.case_id = ?
       ORDER BY t.due_date DESC`,
      [req.params.id]
    );

    const [events] = await pool.execute(
      `SELECT ce.*, CONCAT(u.first_name, ' ', u.last_name) as user_name
       FROM calendar_events ce
       LEFT JOIN users u ON ce.user_id = u.id
       WHERE ce.case_id = ?
       ORDER BY ce.start_datetime DESC`,
      [req.params.id]
    );

    res.json({
      tasks,
      events
    });
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update case stage
router.put('/:id/stage', authorize('admin', 'lawyer'), async (req, res) => {
  try {
    const { case_stage, notes } = req.body;
    const validStages = ['filing', 'hearing', 'judgment', 'closed', 'appeal'];

    if (!case_stage || !validStages.includes(case_stage)) {
      return res.status(400).json({ error: 'Valid case stage is required' });
    }

    // Get current case
    const [cases] = await pool.execute(
      'SELECT * FROM cases WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );

    if (cases.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const currentCase = cases[0];

    // Update case stage with notes
    await pool.execute(
      `UPDATE cases 
       SET case_stage = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`,
      [case_stage, notes || currentCase.notes, req.params.id, req.tenantId]
    );

    // Log the stage change as a communication log
    await pool.execute(
      `INSERT INTO communication_logs (
        tenant_id, client_id, case_id, communication_type, direction,
        subject, content, sent_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.tenantId, currentCase.client_id, req.params.id, 'system', 'outgoing',
       'Case Stage Updated', `Case stage changed to: ${case_stage}`, req.user.userId]
    );

    const [updatedCases] = await pool.execute('SELECT * FROM cases WHERE id = ?', [req.params.id]);

    res.json({ case: updatedCases[0], message: 'Case stage updated successfully' });
  } catch (error) {
    console.error('Update case stage error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get case stage history
router.get('/:id/stage-history', async (req, res) => {
  try {
    const [logs] = await pool.execute(
      `SELECT cl.*, CONCAT(u.first_name, ' ', u.last_name) as user_name
       FROM communication_logs cl
       LEFT JOIN users u ON cl.sent_by = u.id
       WHERE cl.case_id = ? AND cl.communication_type = 'system'
       AND cl.subject LIKE '%Case Stage Updated%'
       ORDER BY cl.timestamp DESC`,
      [req.params.id]
    );

    res.json({ history: logs });
  } catch (error) {
    console.error('Get stage history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
