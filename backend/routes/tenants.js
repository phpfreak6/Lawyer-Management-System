const express = require('express');
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Public endpoint to list tenants (for firm selection during signup)
router.get('/', async (req, res) => {
  try {
    const [tenants] = await pool.execute(
      'SELECT id, name, domain FROM tenants ORDER BY name ASC'
    );
    res.json({ tenants });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

// Create a new tenant (firm) and admin user, then return auth token
router.post('/register', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { firm_name, domain, subscription_tier = 'basic', max_users = 5, admin_email, admin_password, admin_first_name, admin_last_name, admin_phone } = req.body;

    if (!firm_name || !admin_email || !admin_password || !admin_first_name || !admin_last_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await connection.beginTransaction();

    // If domain provided, ensure it is unique
    if (domain) {
      const [existingTenantByDomain] = await connection.execute(
        'SELECT id FROM tenants WHERE domain = ? LIMIT 1',
        [domain]
      );
      if (existingTenantByDomain.length > 0) {
        await connection.rollback();
        return res.status(409).json({ error: 'Domain already in use' });
      }
    }

    // Create tenant
    const [tenantResult] = await connection.execute(
      `INSERT INTO tenants (name, domain, subscription_tier, max_users)
       VALUES (?, ?, ?, ?)`,
      [firm_name, domain || null, subscription_tier, max_users]
    );
    const newTenantId = tenantResult.insertId;

    // Ensure no duplicate admin email within this tenant
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ? AND tenant_id = ? LIMIT 1',
      [admin_email, newTenantId]
    );
    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(409).json({ error: 'User already exists for this firm' });
    }

    // Create admin user
    const passwordHash = await bcrypt.hash(admin_password, 10);
    const [userResult] = await connection.execute(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 'admin', true)`,
      [newTenantId, admin_email, passwordHash, admin_first_name, admin_last_name, admin_phone || null]
    );
    const newUserId = userResult.insertId;

    await connection.commit();

    // Issue JWT for immediate login
    let token = null;
    if (process.env.JWT_SECRET) {
      token = jwt.sign(
        { userId: newUserId, tenantId: newTenantId, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );
    }

    res.status(201).json({
      message: 'Firm and admin created successfully',
      token,
      user: {
        id: newUserId,
        email: admin_email,
        name: `${admin_first_name} ${admin_last_name}`,
        role: 'admin',
        tenant_id: newTenantId
      },
      tenant: {
        id: newTenantId,
        name: firm_name,
        domain: domain || null,
        subscription_tier,
        max_users
      }
    });
  } catch (error) {
    try { await connection.rollback(); } catch (_) {}
    console.error('Tenant register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});


