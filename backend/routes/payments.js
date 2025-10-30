const express = require('express');
const { PaymentService, StripeService } = require('../services/payments');
const { authenticate } = require('../middleware/auth');
const pool = require('../config/database');
const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create payment order
router.post('/razorpay/order', async (req, res) => {
  try {
    const { amount, invoice_id, client_details } = req.body;

    const [invoices] = await pool.execute(
      'SELECT * FROM billing_records WHERE id = ? AND tenant_id = ?',
      [invoice_id, req.tenantId]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoices[0];
    const order = await PaymentService.createPaymentOrder(
      invoice.total_amount - invoice.paid_amount,
      'INR',
      invoice_id,
      client_details
    );

    res.json({ order });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Verify payment
router.post('/razorpay/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoice_id } = req.body;

    const isValid = PaymentService.verifyPayment(razorpay_payment_id, razorpay_signature, razorpay_order_id);

    if (!isValid) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Update invoice
    const [invoices] = await pool.execute(
      'SELECT * FROM billing_records WHERE id = ? AND tenant_id = ?',
      [invoice_id, req.tenantId]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoices[0];
    const newPaidAmount = invoice.paid_amount + (invoice.total_amount - invoice.paid_amount);
    const paymentStatus = newPaidAmount >= invoice.total_amount ? 'paid' : 'partial';

    await pool.execute(
      `UPDATE billing_records 
       SET paid_amount = ?, payment_status = ?, payment_method = 'online', payment_date = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`,
      [newPaidAmount, paymentStatus, invoice_id, req.tenantId]
    );

    res.json({ message: 'Payment verified successfully', verified: true });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Create Stripe payment intent
router.post('/stripe/create-intent', async (req, res) => {
  try {
    const { amount, invoice_id, client_details } = req.body;

    const [invoices] = await pool.execute(
      'SELECT * FROM billing_records WHERE id = ? AND tenant_id = ?',
      [invoice_id, req.tenantId]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoices[0];
    const paymentIntent = await StripeService.createPaymentIntent(
      amount,
      'inr',
      {
        invoice_id: invoice_id.toString(),
        client_name: client_details.name,
        client_email: client_details.email
      }
    );

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Create Stripe payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Verify Stripe payment
router.post('/stripe/verify', async (req, res) => {
  try {
    const { payment_intent_id, invoice_id } = req.body;

    // Get payment details from Stripe
    const paymentIntent = await StripeService.stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Update invoice
    const [invoices] = await pool.execute(
      'SELECT * FROM billing_records WHERE id = ? AND tenant_id = ?',
      [invoice_id, req.tenantId]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoices[0];
    const paidAmount = paymentIntent.amount / 100; // Convert from paise/cents to rupees
    const newPaidAmount = invoice.paid_amount + paidAmount;
    const paymentStatus = newPaidAmount >= invoice.total_amount ? 'paid' : 'partial';

    await pool.execute(
      `UPDATE billing_records 
       SET paid_amount = ?, payment_status = ?, payment_method = 'stripe', payment_date = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`,
      [newPaidAmount, paymentStatus, invoice_id, req.tenantId]
    );

    res.json({ message: 'Payment verified successfully', verified: true });
  } catch (error) {
    console.error('Verify Stripe payment error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

module.exports = router;
