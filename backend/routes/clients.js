const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all clients
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = `
      SELECT c.*, CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name,
             COUNT(cs.id) as case_count
      FROM clients c
      LEFT JOIN users u ON c.assigned_to = u.id
      LEFT JOIN cases cs ON cs.client_id = c.id
      WHERE c.tenant_id = ?
    `;
    
    const params = [req.tenantId];

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
      query += ` GROUP BY c.id, u.first_name, u.last_name`;
    } else if (search) {
      query += ` AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)
                 GROUP BY c.id, u.first_name, u.last_name`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    } else {
      query += ` GROUP BY c.id, u.first_name, u.last_name`;
    }

    query += ' ORDER BY c.created_at DESC';

    const [clients] = await pool.execute(query, params);
    res.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single client by ID
router.get('/:id', async (req, res) => {
  try {
    const [clients] = await pool.execute(
      `SELECT c.*, CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name
       FROM clients c
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.id = ? AND c.tenant_id = ?`,
      [req.params.id, req.tenantId]
    );

    if (clients.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ client: clients[0] });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new client
router.post('/', async (req, res) => {
  try {
    const {
      first_name, last_name, email, phone, alternate_phone,
      address, city, state, pincode, date_of_birth,
      pan_number, aadhar_number, gstin, occupation, assigned_to
    } = req.body;

    if (!first_name || !last_name || !phone) {
      return res.status(400).json({ error: 'First name, last name, and phone are required' });
    }

    // normalize optional/empty values to NULL for strict SQL modes
    const normalize = (v) => (v === '' || v === undefined ? null : v);

    const [insertResult] = await pool.execute(
      `INSERT INTO clients (
        tenant_id, first_name, last_name, email, phone, alternate_phone,
        address, city, state, pincode, date_of_birth, pan_number,
        aadhar_number, gstin, occupation, assigned_to
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        first_name,
        last_name,
        normalize(email),
        phone,
        normalize(alternate_phone),
        normalize(address),
        normalize(city),
        normalize(state),
        normalize(pincode),
        normalize(date_of_birth),
        normalize(pan_number),
        normalize(aadhar_number),
        normalize(gstin),
        normalize(occupation),
        normalize(assigned_to)
      ]
    );

    // fetch the newly inserted client by insertId, scoped by tenant
    const [clients] = await pool.execute(
      'SELECT * FROM clients WHERE id = ? AND tenant_id = ? LIMIT 1',
      [insertResult.insertId, req.tenantId]
    );
    const newClient = clients[0];
    let loginCreated = false;
    let generatedPassword = null;

    // Auto-create user login for client if email is provided
    if (email) {
      try {
        // Check if user already exists
        const [existingUsers] = await pool.execute(
          'SELECT id FROM users WHERE email = ? AND tenant_id = ?',
          [email, req.tenantId]
        );

        let userId;
        if (existingUsers.length === 0) {
          // Generate default password: first 4 chars of name + phone last 4 digits
          generatedPassword = `${first_name.substring(0, 4).toLowerCase()}${phone.slice(-4)}`;
          const passwordHash = await bcrypt.hash(generatedPassword, 10);

          const [userResult] = await pool.execute(
            `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active)
             VALUES (?, ?, ?, ?, ?, ?, 'client', true)`,
            [req.tenantId, email, passwordHash, first_name, last_name, phone]
          );
          userId = userResult.insertId;
          loginCreated = true;
          console.log(`Auto-created login for client: ${email} with password: ${generatedPassword}`);
        } else {
          userId = existingUsers[0].id;
          console.log(`User already exists for email: ${email}`);
        }

        // Update client with user_id
        await pool.execute(
          'UPDATE clients SET user_id = ? WHERE id = ? AND tenant_id = ?',
          [userId, newClient.id, req.tenantId]
        );
      } catch (userError) {
        console.error('Error creating client login:', userError);
        // Don't fail client creation if user creation fails
      }
    }

    res.status(201).json({ 
      client: newClient, 
      message: 'Client created successfully',
      loginCreated,
      generatedPassword
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    // Whitelist allowed columns to update (exclude computed/locked fields)
    const allowedFields = new Set([
      'first_name', 'last_name', 'email', 'phone', 'alternate_phone',
      'address', 'city', 'state', 'pincode', 'date_of_birth',
      'pan_number', 'aadhar_number', 'gstin', 'occupation', 'status',
      'notes', 'assigned_to', 'user_id'
    ]);

    const updateFields = [];
    const values = [];

    const normalize = (v) => {
      if (v === '' || v === undefined || v === null) return null;
      if (typeof v === 'string' && (v.toLowerCase() === 'null' || v.toLowerCase() === 'undefined')) return null;
      return v;
    };

    // Validate and coerce specific fields before building query
    if (Object.prototype.hasOwnProperty.call(updates, 'date_of_birth')) {
      const dob = normalize(updates.date_of_birth);
      if (dob) {
        const d = new Date(dob);
        if (isNaN(d.getTime())) {
          return res.status(400).json({ error: 'Invalid date_of_birth' });
        }
        // format YYYY-MM-DD
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        updates.date_of_birth = `${yyyy}-${mm}-${dd}`;
      } else {
        updates.date_of_birth = null;
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'assigned_to')) {
      const assigned = normalize(updates.assigned_to);
      if (assigned === null) {
        updates.assigned_to = null;
      } else {
        const assignedId = parseInt(assigned, 10);
        if (Number.isNaN(assignedId)) {
          return res.status(400).json({ error: 'assigned_to must be a valid user id' });
        }
        // Ensure the user exists in the same tenant
        const [users] = await pool.execute(
          'SELECT id FROM users WHERE id = ? AND tenant_id = ? LIMIT 1',
          [assignedId, req.tenantId]
        );
        if (users.length === 0) {
          return res.status(400).json({ error: 'assigned_to user does not exist in tenant' });
        }
        updates.assigned_to = assignedId;
      }
    }

    Object.keys(updates).forEach(key => {
      if (!allowedFields.has(key)) {
        return; // skip unknown or computed fields like assigned_to_name, case_count
      }
      const value = updates[key];
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(normalize(value));
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id, req.tenantId);

    const query = `
      UPDATE clients 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `;

    const [result] = await pool.execute(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const [clients] = await pool.execute('SELECT * FROM clients WHERE id = ? AND tenant_id = ? LIMIT 1', [id, req.tenantId]);

    res.json({ client: clients[0], message: 'Client updated successfully' });
  } catch (error) {
    if (error && (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW')) {
      return res.status(400).json({ error: 'Invalid reference value (e.g., assigned_to)' });
    }
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get client cases
router.get('/:id/cases', async (req, res) => {
  try {
    const [cases] = await pool.execute(
      'SELECT * FROM cases WHERE client_id = ? AND tenant_id = ? ORDER BY created_at DESC',
      [req.params.id, req.tenantId]
    );

    res.json({ cases });
  } catch (error) {
    console.error('Get client cases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get client KYC documents
router.get('/:id/kyc', async (req, res) => {
  try {
    const [documents] = await pool.execute(
      `SELECT k.*, CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name
       FROM kyc_documents k
       LEFT JOIN users u ON k.uploaded_by = u.id
       WHERE k.client_id = ?
       ORDER BY k.created_at DESC`,
      [req.params.id]
    );

    res.json({ documents });
  } catch (error) {
    console.error('Get KYC documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
