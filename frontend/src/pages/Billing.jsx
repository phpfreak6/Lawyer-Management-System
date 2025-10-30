import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, 
  IconButton, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Grid, FormControl,
  InputLabel, Select, Alert, LinearProgress
} from '@mui/material';
import { 
  Add, Edit, Delete, Visibility, 
  AccessTime, Receipt, Download
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function Billing() {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  
  const [formData, setFormData] = useState({
    client_id: '',
    case_id: '',
    invoice_number: '',
    billable_hours: '',
    hourly_rate: '',
    expenses: '',
    gst_percentage: 18,
    due_date: ''
  });


  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchCases();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/billing');
      setInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      enqueueSnackbar('Failed to fetch invoices', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/api/clients');
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchCases = async () => {
    try {
      const response = await api.get('/api/cases');
      setCases(response.data.cases || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const handleOpenDialog = (invoice = null) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData({
        client_id: invoice.client_id || '',
        case_id: invoice.case_id || '',
        invoice_number: invoice.invoice_number || '',
        billable_hours: invoice.billable_hours || '',
        hourly_rate: invoice.hourly_rate || '',
        expenses: invoice.expenses || '',
        gst_percentage: invoice.gst_percentage || 18,
        due_date: invoice.due_date ? invoice.due_date.split('T')[0] : ''
      });
    } else {
      setEditingInvoice(null);
      setFormData({
        client_id: '',
        case_id: '',
        invoice_number: '',
        billable_hours: '',
        hourly_rate: '',
        expenses: '',
        gst_percentage: 18,
        due_date: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingInvoice(null);
    setFormData({
      client_id: '',
      case_id: '',
      invoice_number: '',
      billable_hours: '',
      hourly_rate: '',
      expenses: '',
      gst_percentage: 18,
      due_date: ''
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingInvoice) {
        // Update invoice - Note: Update endpoint not implemented yet
        enqueueSnackbar('Update functionality coming soon', { variant: 'info' });
      } else {
        // Create new invoice
        await api.post('/api/billing', formData);
        enqueueSnackbar('Invoice created successfully', { variant: 'success' });
      }
      fetchInvoices();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving invoice:', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to save invoice', { variant: 'error' });
    }
  };

  const handleDelete = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;

    try {
      await api.delete(`/api/billing/${invoiceId}`);
      enqueueSnackbar('Invoice deleted successfully', { variant: 'success' });
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      enqueueSnackbar('Failed to delete invoice', { variant: 'error' });
    }
  };


  const calculateAmount = () => {
    const billable_hours = parseFloat(formData.billable_hours) || 0;
    const hourly_rate = parseFloat(formData.hourly_rate) || 0;
    const expenses = parseFloat(formData.expenses) || 0;
    const gst_percentage = parseFloat(formData.gst_percentage) || 18;

    const subtotal = (billable_hours * hourly_rate) + expenses;
    const gst = (subtotal * gst_percentage) / 100;
    const total = subtotal + gst;

    return { subtotal, gst, total };
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      partial: 'info',
      paid: 'success'
    };
    return colors[status] || 'default';
  };

  const amounts = calculateAmount();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Billing & Invoices</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Create Invoice
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Case</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="textSecondary">No invoices found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => {
                const totalAmount = parseFloat(invoice.total_amount) || 0;
                const paidAmount = parseFloat(invoice.paid_amount) || 0;
                const balance = totalAmount - paidAmount;
                return (
                  <TableRow key={invoice.id} hover>
                    <TableCell>{invoice.invoice_number}</TableCell>
                    <TableCell>
                      {invoice.client_first_name} {invoice.client_last_name}
                    </TableCell>
                    <TableCell>{invoice.case_number || '-'}</TableCell>
                    <TableCell><strong>₹{totalAmount.toFixed(2)}</strong></TableCell>
                    <TableCell>₹{paidAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`₹${balance.toFixed(2)}`}
                        size="small"
                        color={balance > 0 ? 'warning' : 'success'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={invoice.payment_status} 
                        size="small" 
                        color={getPaymentStatusColor(invoice.payment_status)} 
                      />
                    </TableCell>
                    <TableCell>
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/billing/${invoice.id}`)}
                        title="View Details"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(invoice.id)}
                        color="error"
                        title="Delete Invoice"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Invoice Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle>
            {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Client</InputLabel>
                  <Select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    label="Client"
                  >
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.first_name} {client.last_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Case</InputLabel>
                  <Select
                    value={formData.case_id}
                    onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
                    label="Case"
                  >
                    <MenuItem value="">None</MenuItem>
                    {cases.map((caseItem) => (
                      <MenuItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.case_number}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Invoice Number *"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  required
                  placeholder="INV-2024-001"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Due Date *"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Billable Hours"
                  type="number"
                  value={formData.billable_hours}
                  onChange={(e) => setFormData({ ...formData, billable_hours: e.target.value })}
                  inputProps={{ min: 0, step: 0.5 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Hourly Rate (₹)"
                  type="number"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                  inputProps={{ min: 0, step: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Expenses (₹)"
                  type="number"
                  value={formData.expenses}
                  onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
                  inputProps={{ min: 0, step: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="GST %"
                  type="number"
                  value={formData.gst_percentage}
                  onChange={(e) => setFormData({ ...formData, gst_percentage: e.target.value })}
                  inputProps={{ min: 0, max: 100, step: 1 }}
                />
              </Grid>

              {/* Calculation Preview */}
              {(formData.billable_hours || formData.expenses) && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="subtitle2">
                      Subtotal: ₹{amounts.subtotal.toFixed(2)}
                      <br />
                      GST ({formData.gst_percentage}%): ₹{amounts.gst.toFixed(2)}
                      <br />
                      <strong>Total: ₹{amounts.total.toFixed(2)}</strong>
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingInvoice ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default Billing;
