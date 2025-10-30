const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, role = 'paralegal', tenant_id } = req.body;

    // Validate input
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND tenant_id = ?',
      [email, tenant_id || process.env.DEFAULT_TENANT_ID]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    await pool.execute(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenant_id || 1, email, passwordHash, first_name, last_name, phone, role, true]
    );

    // Get the created user
    const [users] = await pool.execute(
      'SELECT id, email, first_name, last_name, role, tenant_id FROM users ORDER BY id DESC LIMIT 1'
    );

    const user = users[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, tenant_id } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user (without tenant_id check to simplify for now)
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        tenant_id: user.tenant_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, first_name, last_name, phone, role, profile_picture, tenant_id FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    
    // Return user object with name property for compatibility
    res.json({ 
      user: {
        ...user,
        name: `${user.first_name} ${user.last_name}`
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users for the tenant
router.get('/users', authenticate, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, first_name, last_name, email, role FROM users WHERE tenant_id = ? AND is_active = true',
      [req.tenantId]
    );

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
