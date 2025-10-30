import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, Box, Alert, CircularProgress,
  ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { CreditCard, Payment } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../utils/api';
import { loadStripe } from '@stripe/stripe-js';

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => resolve(); // Resolve anyway to prevent hanging
    document.body.appendChild(script);
  });
};

function PaymentDialog({ open, onClose, invoice, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [stripe, setStripe] = useState(null);

  useEffect(() => {
    if (open && invoice) {
      const total = parseFloat(invoice.total_amount) || 0;
      const paid = parseFloat(invoice.paid_amount) || 0;
      setAmount(total - paid);
    }

    // Load Stripe on mount
    const loadStripeInstance = async () => {
      const stripePublicKey = process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxx';
      const stripeInstance = await loadStripe(stripePublicKey);
      setStripe(stripeInstance);
    };
    
    if (open) {
      loadStripeInstance();
    }
  }, [open, invoice]);

  const handleRazorpayPayment = async () => {
    if (!window.Razorpay) {
      await loadRazorpayScript();
    }

    setLoading(true);
    try {
      // Create payment order
      const response = await api.post('/api/payments/razorpay/order', {
        amount: amount,
        invoice_id: invoice.id,
        client_details: {
          name: `${invoice.client_first_name} ${invoice.client_last_name}`,
          email: invoice.client_email || 'client@example.com',
          phone: invoice.client_phone || ''
        }
      });

      const { order } = response.data;

      // Initialize Razorpay
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_xxxxxxxxxxxxx',
        amount: order.amount,
        currency: order.currency,
        name: 'Law Firm Associates',
        description: `Payment for Invoice ${invoice.invoice_number}`,
        order_id: order.id,
        handler: async function (paymentResponse) {
          try {
            // Verify payment
            await api.post('/api/payments/razorpay/verify', {
              razorpay_order_id: order.id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              invoice_id: invoice.id
            });

            enqueueSnackbar('Payment successful!', { variant: 'success' });
            onSuccess && onSuccess();
            onClose();
          } catch (error) {
            console.error('Payment verification error:', error);
            enqueueSnackbar('Payment verification failed', { variant: 'error' });
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: `${invoice.client_first_name} ${invoice.client_last_name}`,
          email: invoice.client_email || '',
          contact: invoice.client_phone || ''
        },
        theme: {
          color: '#1976d2'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Razorpay payment error:', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to initiate Razorpay payment', { variant: 'error' });
      setLoading(false);
    }
  };

  const handleStripePayment = async () => {
    setLoading(true);
    try {
      if (!stripe) {
        enqueueSnackbar('Stripe not initialized. Please check your API keys.', { variant: 'error' });
        setLoading(false);
        return;
      }

      // Create payment intent
      const response = await api.post('/api/payments/stripe/create-intent', {
        amount: amount,
        invoice_id: invoice.id,
        client_details: {
          name: `${invoice.client_first_name} ${invoice.client_last_name}`,
          email: invoice.client_email || 'client@example.com'
        }
      });

      const { clientSecret } = response.data;

      // Redirect to Stripe Checkout
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: stripe.elements().card,
          billing_details: {
            name: `${invoice.client_first_name} ${invoice.client_last_name}`,
            email: invoice.client_email || ''
          }
        }
      });

      if (result.error) {
        enqueueSnackbar(result.error.message, { variant: 'error' });
        setLoading(false);
      } else {
        // Payment succeeded
        await api.post('/api/payments/stripe/verify', {
          payment_intent_id: result.paymentIntent.id,
          invoice_id: invoice.id
        });

        enqueueSnackbar('Payment successful!', { variant: 'success' });
        onSuccess && onSuccess();
        onClose();
        setLoading(false);
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to initiate Stripe payment', { variant: 'error' });
      setLoading(false);
    }
  };

  const handleManualPayment = async () => {
    if (!amount || amount <= 0) {
      enqueueSnackbar('Please enter a valid amount', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      await api.put(`/api/billing/${invoice.id}/payment`, {
        paid_amount: amount,
        payment_method: 'manual',
        payment_date: new Date().toISOString().split('T')[0]
      });

      enqueueSnackbar('Payment recorded successfully', { variant: 'success' });
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Manual payment error:', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to record payment', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!amount || amount <= 0) {
      enqueueSnackbar('Please enter a valid amount', { variant: 'error' });
      return;
    }

    if (paymentMethod === 'razorpay') {
      await handleRazorpayPayment();
    } else if (paymentMethod === 'stripe') {
      await handleStripePayment();
    } else if (paymentMethod === 'manual') {
      await handleManualPayment();
    }
  };

  const totalAmount = parseFloat(invoice?.total_amount) || 0;
  const paidAmount = parseFloat(invoice?.paid_amount) || 0;
  const balance = totalAmount - paidAmount;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Pay Invoice</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              Invoice: {invoice?.invoice_number}
            </Typography>
          </Alert>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="textSecondary">Total Amount:</Typography>
            <Typography variant="body2" fontWeight="bold">₹{totalAmount.toFixed(2)}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="textSecondary">Paid:</Typography>
            <Typography variant="body2" color="success.main">₹{paidAmount.toFixed(2)}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="textSecondary">Balance:</Typography>
            <Typography variant="body2" fontWeight="bold" color={balance > 0 ? 'warning.main' : 'success.main'}>
              ₹{balance.toFixed(2)}
            </Typography>
          </Box>
        </Box>

        <TextField
          fullWidth
          label="Amount to Pay (₹)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          inputProps={{ min: 0.01, max: balance, step: 0.01 }}
          sx={{ mb: 3 }}
        />

        <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
          Select Payment Method:
        </Typography>
        
        <ToggleButtonGroup
          value={paymentMethod}
          exclusive
          onChange={(e, newMethod) => newMethod && setPaymentMethod(newMethod)}
          fullWidth
          sx={{ mb: 2 }}
        >
          <ToggleButton value="razorpay" aria-label="razorpay">
            <CreditCard sx={{ mr: 1 }} /> Razorpay
          </ToggleButton>
          <ToggleButton value="stripe" aria-label="stripe">
            <Payment sx={{ mr: 1 }} /> Stripe
          </ToggleButton>
          <ToggleButton value="manual" aria-label="manual">
            <Typography sx={{ mr: 1 }}>💵</Typography> Manual
          </ToggleButton>
        </ToggleButtonGroup>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="caption">
            {paymentMethod === 'razorpay' && 'Razorpay - Secure payment gateway (India)'}
            {paymentMethod === 'stripe' && 'Stripe - Secure payment gateway (International)'}
            {paymentMethod === 'manual' && 'Manual - Record cash/cheque payment'}
          </Typography>
        </Alert>

        {balance > 0 ? (
          <Alert severity="warning">
            <Typography variant="caption">
              You can pay ₹{balance.toFixed(2)} to complete this invoice.
            </Typography>
          </Alert>
        ) : (
          <Alert severity="success">
            <Typography variant="caption">
              This invoice has been fully paid.
            </Typography>
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <CreditCard />}
          onClick={handlePayment}
          disabled={loading || balance <= 0 || amount <= 0}
        >
          {loading ? 'Processing...' : paymentMethod === 'razorpay' ? 'Pay with Razorpay' : 
           paymentMethod === 'stripe' ? 'Pay with Stripe' : 'Record Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PaymentDialog;
