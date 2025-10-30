const express = require('express');
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth');
const router = express.Router();
const { syncUserToClient } = require('../utils/clientUserSync');

// All routes require authentication
router.use(authenticate);

// List users in current tenant
router.get('/', async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, first_name, last_name, email, role, is_active FROM users WHERE tenant_id = ? ORDER BY created_at DESC',
      [req.tenantId]
    );
    res.json({ users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user in current tenant (admin only)
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can create users' });
    }
    const { email, password, first_name, last_name, phone, role } = req.body;
    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // allow roles: admin, lawyer, paralegal, client
    const allowedRoles = ['admin', 'lawyer', 'paralegal', 'client'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND tenant_id = ? LIMIT 1',
      [email, req.tenantId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, true)`,
      [req.tenantId, email, passwordHash, first_name, last_name, phone || null, role]
    );

    let clientSync = null;
    if (role === 'client') {
      try {
        clientSync = await syncUserToClient(result.insertId);
      } catch (e) {
        console.error('Client sync after user create failed:', e);
        clientSync = { success: false, error: e.message };
      }
    }

    res.status(201).json({
      user: {
        id: result.insertId,
        email,
        first_name,
        last_name,
        phone: phone || null,
        role
      },
      message: 'User created successfully',
      clientSync
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user in current tenant (admin only)
router.put('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can edit users' });
    }
    const userId = Number(req.params.id);
    const { email, password, first_name, last_name, phone, role, is_active } = req.body;

    // Check existing user belongs to tenant
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ? AND tenant_id = ? LIMIT 1', [userId, req.tenantId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Email uniqueness
    if (email && email !== users[0].email) {
      const [dup] = await pool.execute('SELECT id FROM users WHERE email = ? AND tenant_id = ? LIMIT 1', [email, req.tenantId]);
      if (dup.length > 0) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    // Build dynamic update
    const fields = [];
    const params = [];
    if (email) { fields.push('email = ?'); params.push(email); }
    if (first_name) { fields.push('first_name = ?'); params.push(first_name); }
    if (last_name) { fields.push('last_name = ?'); params.push(last_name); }
    if (phone !== undefined) { fields.push('phone = ?'); params.push(phone || null); }
    if (role) { fields.push('role = ?'); params.push(role); }
    if (typeof is_active === 'boolean') { fields.push('is_active = ?'); params.push(is_active); }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      fields.push('password_hash = ?');
      params.push(hash);
    }
    if (fields.length === 0) {
      return res.json({ message: 'No changes' });
    }
    params.push(userId, req.tenantId);

    await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`, params);

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
