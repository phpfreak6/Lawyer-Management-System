import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Alert, LinearProgress, Button
} from '@mui/material';
import { Receipt, Visibility } from '@mui/icons-material';
import api from '../utils/api';
import { useSnackbar } from 'notistack';

function ClientInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/clients/me/invoices');
      setInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      enqueueSnackbar('Failed to load invoices', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (invoiceId) => {
    window.location.href = `/billing/${invoiceId}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: 'success',
      pending: 'warning',
      partial: 'info',
      overdue: 'error'
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading invoices...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
          My Invoices
        </Typography>
        <Typography variant="body2" color="textSecondary">
          View all your invoices and payment status
        </Typography>
      </Box>

      {invoices.length === 0 ? (
        <Alert severity="info">
          No invoices found.
        </Alert>
      ) : (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Subtotal</TableCell>
                <TableCell>GST</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {invoice.invoice_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>Legal Services</TableCell>
                  <TableCell>₹{invoice.subtotal?.toLocaleString()}</TableCell>
                  <TableCell>₹{invoice.gst_amount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      ₹{invoice.total_amount?.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={invoice.payment_status} 
                      size="small"
                      color={getStatusColor(invoice.payment_status)} 
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => handleViewInvoice(invoice.id)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default ClientInvoices;

