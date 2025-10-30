const Razorpay = require('razorpay');

/**
 * Razorpay Payment Gateway Integration
 * For processing online payments from clients
 */
class PaymentService {
  constructor() {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
    }
  }

  /**
   * Create a payment order for an invoice
   */
  async createPaymentOrder(amount, currency = 'INR', invoiceId, clientDetails) {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    try {
      const options = {
        amount: amount * 100, // Convert to paise
        currency,
        receipt: `invoice_${invoiceId}`,
        notes: {
          invoice_id: invoiceId,
          client_name: clientDetails.name,
          client_email: clientDetails.email
        }
      };

      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  }

  /**
   * Verify payment signature
   */
  verifyPayment(paymentId, signature, orderId) {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId) {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw error;
    }
  }
}

/**
 * Stripe Payment Gateway Integration
 * Alternative payment gateway for international clients
 */
class StripeService {
  constructor() {
    this.stripe = null;
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    }
  }

  async createPaymentIntent(amount, currency = 'inr', metadata = {}) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount * 100, // Convert to paise
        currency,
        metadata
      });
      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  async verifyWebhook(payload, signature) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error) {
      console.error('Webhook verification failed:', error);
      throw error;
    }
  }
}

module.exports = {
  PaymentService: new PaymentService(),
  StripeService: new StripeService()
};

