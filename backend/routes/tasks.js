const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const { status, priority, due_date, assigned_to } = req.query;
    
    let query = `
      SELECT t.*, c.case_number, c.subject as case_subject,
             CONCAT(u.first_name, ' ', u.last_name) as assigned_name
      FROM tasks t
      LEFT JOIN cases c ON t.case_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.tenant_id = ?
    `;
    
    const params = [req.tenantId];
    let paramIndex = 2;

    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
      paramIndex++;
    }

    if (priority) {
      query += ` AND t.priority = ?`;
      params.push(priority);
      paramIndex++;
    }

    if (assigned_to) {
      query += ` AND t.assigned_to = ?`;
      params.push(assigned_to);
    }

    query += ' ORDER BY t.due_date ASC, t.priority DESC';

    const [tasks] = await pool.execute(query, params);
    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const {
      case_id, client_id, title, description, task_type,
      priority = 'medium', due_date, assigned_to
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO tasks (
        tenant_id, case_id, client_id, title, description, task_type,
        priority, due_date, assigned_to
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.tenantId, case_id, client_id, title, description, task_type,
       priority, due_date, assigned_to]
    );

    const taskId = result.insertId;
    const [tasks] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [taskId]);

    res.status(201).json({ task: tasks[0], message: 'Task created successfully' });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updateFields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id, req.tenantId);

    const query = `
      UPDATE tasks 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `;

    const [result] = await pool.execute(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const [tasks] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);

    res.json({ task: tasks[0], message: 'Task updated successfully' });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete task
router.post('/:id/complete', async (req, res) => {
  try {
    const [result] = await pool.execute(
      `UPDATE tasks 
       SET status = 'completed', completed_at = CURRENT_TIMESTAMP, completed_by = ?
       WHERE id = ? AND tenant_id = ?`,
      [req.user.userId, req.params.id, req.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const [tasks] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

    res.json({ task: tasks[0], message: 'Task completed successfully' });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM tasks WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
