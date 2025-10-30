const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all billing records
router.get('/', async (req, res) => {
  try {
    const { payment_status, case_id, client_id } = req.query;
    
    let query = `
      SELECT br.*, c.case_number, c.subject as case_subject,
             cl.first_name as client_first_name, cl.last_name as client_last_name
      FROM billing_records br
      LEFT JOIN cases c ON br.case_id = c.id
      LEFT JOIN clients cl ON br.client_id = cl.id
      WHERE br.tenant_id = ?
    `;
    
    const params = [req.tenantId];
    let paramIndex = 2;

    if (payment_status) {
      query += ` AND br.payment_status = ?`;
      params.push(payment_status);
    }

    if (case_id) {
      query += ` AND br.case_id = ?`;
      params.push(case_id);
    }

    if (client_id) {
      query += ` AND br.client_id = ?`;
      params.push(client_id);
    }

    query += ' ORDER BY br.created_at DESC';

    const [invoices] = await pool.execute(query, params);
    res.json({ invoices });
  } catch (error) {
    console.error('Get billing records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single invoice
router.get('/:id', async (req, res) => {
  try {
    const [invoices] = await pool.execute(
      `SELECT br.*, c.case_number, c.subject as case_subject,
              cl.first_name as client_first_name, cl.last_name as client_last_name,
              cl.email as client_email, cl.phone as client_phone,
              cl.address as client_address, cl.city, cl.state, cl.pincode, cl.gstin
       FROM billing_records br
       LEFT JOIN cases c ON br.case_id = c.id
       LEFT JOIN clients cl ON br.client_id = cl.id
       WHERE br.id = ? AND br.tenant_id = ?`,
      [req.params.id, req.tenantId]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoices[0];

    // Get time entries for this invoice
    const [timeEntries] = await pool.execute(
      'SELECT * FROM time_entries WHERE billing_record_id = ?',
      [req.params.id]
    );

    // Get expenses for this invoice
    const [expenses] = await pool.execute(
      'SELECT * FROM expenses WHERE billing_record_id = ?',
      [req.params.id]
    );

    res.json({
      invoice,
      timeEntries,
      expenses
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new invoice
router.post('/', authorize('admin', 'lawyer'), async (req, res) => {
  try {
    console.log('Create invoice request body:', JSON.stringify(req.body, null, 2));
    
    const {
      case_id, client_id, invoice_number, billable_hours, hourly_rate,
      expenses = 0, gst_percentage = 18, due_date
    } = req.body;

    if (!invoice_number || !client_id) {
      return res.status(400).json({ error: 'Invoice number and client are required' });
    }

    // Parse numeric values
    const billableHours = parseFloat(billable_hours) || 0;
    const hourlyRate = parseFloat(hourly_rate) || 0;
    const expenseAmount = parseFloat(expenses) || 0;
    const gstPercent = parseFloat(gst_percentage) || 18;

    // Calculate amounts
    const subtotal = (billableHours * hourlyRate) + expenseAmount;
    const gstAmount = (subtotal * gstPercent) / 100;
    const totalAmount = subtotal + gstAmount;

    console.log('Creating invoice with data:', {
      client_id,
      invoice_number,
      billable_hours: billableHours,
      hourly_rate: hourlyRate,
      expenses: expenseAmount,
      subtotal,
      gst_amount: gstAmount,
      total_amount: totalAmount
    });

    const [result] = await pool.execute(
      `INSERT INTO billing_records (
        tenant_id, case_id, client_id, invoice_number, billable_hours,
        hourly_rate, expenses, subtotal, gst_percentage, gst_amount, total_amount, due_date, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.tenantId, case_id || null, client_id, invoice_number, billableHours,
       hourlyRate, expenseAmount, subtotal, gstPercent, gstAmount, totalAmount, due_date || null, req.user.userId]
    );

    const invoiceId = result.insertId;
    const [invoices] = await pool.execute('SELECT * FROM billing_records WHERE id = ?', [invoiceId]);

    res.status(201).json({ invoice: invoices[0], message: 'Invoice created successfully' });
  } catch (error) {
    console.error('Create invoice error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Update payment status
router.put('/:id/payment', authorize('admin', 'lawyer'), async (req, res) => {
  try {
    const { paid_amount, payment_method, payment_date } = req.body;

    const [invoices] = await pool.execute(
      'SELECT * FROM billing_records WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoices[0];
    const newPaidAmount = paid_amount || invoice.paid_amount;
    const paymentStatus = newPaidAmount >= invoice.total_amount ? 'paid' :
                         newPaidAmount > 0 ? 'partial' : 'pending';

    await pool.execute(
      `UPDATE billing_records 
       SET paid_amount = ?, payment_status = ?, payment_method = ?, payment_date = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`,
      [newPaidAmount, paymentStatus, payment_method, payment_date, req.params.id, req.tenantId]
    );

    const [updatedInvoices] = await pool.execute('SELECT * FROM billing_records WHERE id = ?', [req.params.id]);

    res.json({ invoice: updatedInvoices[0], message: 'Payment updated successfully' });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add time entry
router.post('/:id/time-entry', authorize('admin', 'lawyer', 'paralegal'), async (req, res) => {
  try {
    const { case_id, date, hours, description } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO time_entries (case_id, user_id, date, hours, description, billing_record_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [case_id, req.user.userId, date, hours, description, req.params.id]
    );

    const entryId = result.insertId;
    const [entries] = await pool.execute('SELECT * FROM time_entries WHERE id = ?', [entryId]);

    res.status(201).json({ timeEntry: entries[0], message: 'Time entry added successfully' });
  } catch (error) {
    console.error('Add time entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add expense
router.post('/:id/expense', authorize('admin', 'lawyer'), async (req, res) => {
  try {
    const { case_id, description, amount, expense_type, receipt_path, date_incurred } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO expenses (case_id, description, amount, expense_type, receipt_path, date_incurred, billing_record_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [case_id, description, amount, expense_type, receipt_path, date_incurred, req.params.id, req.user.userId]
    );

    const expenseId = result.insertId;
    const [expenses] = await pool.execute('SELECT * FROM expenses WHERE id = ?', [expenseId]);

    res.status(201).json({ expense: expenses[0], message: 'Expense added successfully' });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
