const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get my cases - fetch cases for the logged-in user based on user_id
router.get('/my-cases', authorize('client'), async (req, res) => {
  try {
    // Get current user's ID from JWT token
    const userId = req.user.userId || req.user.id;
    
    console.log('=== MY CASES API ===');
    console.log('Current user ID:', userId);
    console.log('req.user:', req.user);
    
    // Find client record using user_id
    const [clients] = await pool.execute(
      'SELECT id, first_name, last_name, email, phone FROM clients WHERE user_id = ?',
      [userId]
    );

    console.log('Clients found:', clients);

    if (clients.length === 0) {
      console.log('No client record found for user_id:', userId);
      return res.json({ 
        cases: [], 
        message: 'No client profile found for your account',
        userId: userId
      });
    }

    const clientId = clients[0].id;
    console.log('Client ID:', clientId);

    // Fetch all cases for this client
    const [cases] = await pool.execute(
      `SELECT 
        c.id,
        c.case_number,
        c.subject,
        c.description,
        c.court_name,
        c.court_type,
        c.case_type,
        c.case_stage,
        c.filing_date,
        c.next_hearing_date,
        c.last_hearing_date,
        c.judgment_date,
        c.status,
        c.priority,
        c.billing_rate,
        c.total_amount,
        c.paid_amount,
        c.created_at,
        c.updated_at,
        CONCAT(cl.first_name, ' ', cl.last_name) as client_name,
        CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name
       FROM cases c
       LEFT JOIN clients cl ON c.client_id = cl.id
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.client_id = ?
       ORDER BY c.created_at DESC`,
      [clientId]
    );

    console.log('Cases found:', cases.length);

    res.json({ 
      success: true,
      cases: cases,
      client: {
        id: clients[0].id,
        name: `${clients[0].first_name} ${clients[0].last_name}`,
        email: clients[0].email,
        phone: clients[0].phone
      },
      total: cases.length
    });
  } catch (error) {
    console.error('Get my cases error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: error.stack
    });
  }
});

module.exports = router;

