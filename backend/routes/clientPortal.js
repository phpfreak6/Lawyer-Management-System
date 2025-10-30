const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get client's own cases
router.get('/cases', authorize('client'), async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    // Find client by user_id
    const [clients] = await pool.execute(
      'SELECT id, email, first_name, last_name FROM clients WHERE user_id = ?',
      [userId]
    );

    if (clients.length === 0) {
      return res.json({ cases: [], message: 'No client record found for this user' });
    }

    const clientId = clients[0].id;

    // Get cases for this client
    const [cases] = await pool.execute(
      `SELECT c.*, cl.first_name as client_first_name, cl.last_name as client_last_name,
              u.first_name as assigned_first_name, u.last_name as assigned_last_name
       FROM cases c
       LEFT JOIN clients cl ON c.client_id = cl.id
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.client_id = ?
       ORDER BY c.created_at DESC`,
      [clientId]
    );

    console.log('Found cases:', cases.length);
    console.log('Cases data:', cases);
    res.json({ cases });
  } catch (error) {
    console.error('Get client cases error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get client's own invoices
router.get('/invoices', authorize('client'), async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    // Find client by user_id
    const [clients] = await pool.execute(
      'SELECT id FROM clients WHERE user_id = ?',
      [userId]
    );

    if (clients.length === 0) {
      return res.json({ invoices: [] });
    }

    const clientId = clients[0].id;

    // Get invoices for this client
    const [invoices] = await pool.execute(
      `SELECT b.*, c.first_name as client_first_name, c.last_name as client_last_name
       FROM billing_records b
       LEFT JOIN clients c ON b.client_id = c.id
       WHERE b.client_id = ?
       ORDER BY b.created_at DESC`,
      [clientId]
    );

    res.json({ invoices });
  } catch (error) {
    console.error('Get client invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get client's upcoming calendar events
router.get('/calendar/upcoming', authorize('client'), async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    // Find client by user_id
    const [clients] = await pool.execute(
      'SELECT id FROM clients WHERE user_id = ?',
      [userId]
    );

    if (clients.length === 0) {
      return res.json({ events: [] });
    }

    const clientId = clients[0].id;

    // Get upcoming events for cases involving this client
    const [events] = await pool.execute(
      `SELECT ce.*, c.case_number, c.subject
       FROM calendar_events ce
       JOIN cases c ON ce.case_id = c.id
       WHERE c.client_id = ? 
       AND ce.start_datetime >= NOW()
       ORDER BY ce.start_datetime ASC
       LIMIT 10`,
      [clientId]
    );

    res.json({ events });
  } catch (error) {
    console.error('Get client events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get client's own documents
router.get('/documents', authorize('client'), async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    // Find client by user_id
    const [clients] = await pool.execute(
      'SELECT id FROM clients WHERE user_id = ?',
      [userId]
    );

    if (clients.length === 0) {
      return res.json({ documents: [] });
    }

    const clientId = clients[0].id;

    // Get documents for cases involving this client
    const [documents] = await pool.execute(
      `SELECT cd.*, c.case_number, c.subject
       FROM case_documents cd
       JOIN cases c ON cd.case_id = c.id
       WHERE c.client_id = ?
       ORDER BY cd.created_at DESC`,
      [clientId]
    );

    res.json({ documents });
  } catch (error) {
    console.error('Get client documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get client's cases list (for dropdown)
router.get('/cases', authorize('client'), async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    // Find client by user_id
    const [clients] = await pool.execute(
      'SELECT id FROM clients WHERE user_id = ?',
      [userId]
    );

    if (clients.length === 0) {
      return res.json({ cases: [] });
    }

    const clientId = clients[0].id;

    // Get all cases for this client (simplified list for dropdown)
    const [cases] = await pool.execute(
      `SELECT id, case_number, subject, status 
       FROM cases 
       WHERE client_id = ?
       ORDER BY created_at DESC`,
      [clientId]
    );

    res.json({ cases });
  } catch (error) {
    console.error('Get client cases list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single case details (client can only see their own)
router.get('/cases/:id', authorize('client'), async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    // Find client by user_id
    const [clients] = await pool.execute(
      'SELECT id FROM clients WHERE user_id = ?',
      [userId]
    );

    if (clients.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const clientId = clients[0].id;

    // Get case details for this client
    const [cases] = await pool.execute(
      `SELECT c.*, cl.first_name as client_first_name, cl.last_name as client_last_name,
              cl.email as client_email, cl.phone as client_phone,
              u.first_name as assigned_first_name, u.last_name as assigned_last_name
       FROM cases c
       LEFT JOIN clients cl ON c.client_id = cl.id
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.id = ? AND c.client_id = ?`,
      [req.params.id, clientId]
    );

    if (cases.length === 0) {
      return res.status(404).json({ error: 'Case not found or access denied' });
    }

    res.json({ case: cases[0] });
  } catch (error) {
    console.error('Get client case details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

