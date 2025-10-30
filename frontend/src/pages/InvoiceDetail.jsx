import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Chip, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Divider, Alert, LinearProgress, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, FormControl,
  InputLabel, Select
} from '@mui/material';
import { 
  ArrowBack, Edit, Delete, Receipt, AccessTime, AttachMoney,
  Download, Print, Payment, Add
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../utils/api';
import PaymentDialog from './PaymentDialog';

function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [openTimeDialog, setOpenTimeDialog] = useState(false);
  const [openExpenseDialog, setOpenExpenseDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [cases, setCases] = useState([]);

  const [timeFormData, setTimeFormData] = useState({
    case_id: '',
    date: '',
    hours: '',
    description: ''
  });

  const [expenseFormData, setExpenseFormData] = useState({
    case_id: '',
    description: '',
    amount: '',
    expense_type: '',
    date_incurred: ''
  });

  useEffect(() => {
    fetchInvoice();
    fetchCases();
  }, [id]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/billing/${id}`);
      setInvoice(response.data.invoice);
      setTimeEntries(response.data.timeEntries || []);
      setExpenses(response.data.expenses || []);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      enqueueSnackbar('Failed to load invoice', { variant: 'error' });
    } finally {
      setLoading(false);
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

  const handleSaveTimeEntry = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/billing/${id}/time-entry`, timeFormData);
      enqueueSnackbar('Time entry added successfully', { variant: 'success' });
      setOpenTimeDialog(false);
      setTimeFormData({ case_id: '', date: '', hours: '', description: '' });
      fetchInvoice();
    } catch (error) {
      console.error('Error adding time entry:', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to add time entry', { variant: 'error' });
    }
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/billing/${id}/expense`, expenseFormData);
      enqueueSnackbar('Expense added successfully', { variant: 'success' });
      setOpenExpenseDialog(false);
      setExpenseFormData({ case_id: '', description: '', amount: '', expense_type: '', date_incurred: '' });
      fetchInvoice();
    } catch (error) {
      console.error('Error adding expense:', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to add expense', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;

    try {
      await api.delete(`/api/billing/${id}`);
      enqueueSnackbar('Invoice deleted successfully', { variant: 'success' });
      navigate('/billing');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      enqueueSnackbar('Failed to delete invoice', { variant: 'error' });
    }
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      partial: 'info',
      paid: 'success'
    };
    return colors[status] || 'default';
  };

  const calculateTotals = () => {
    const totalTime = timeEntries.reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    return { totalTime, totalExpenses };
  };

  if (loading) {
    return (
      <Box>
        <LinearProgress />
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box>
        <Alert severity="error">Invoice not found</Alert>
      </Box>
    );
  }

  // Parse amounts to handle string values from database
  const totalAmount = parseFloat(invoice.total_amount) || 0;
  const paidAmount = parseFloat(invoice.paid_amount) || 0;
  const billableHours = parseFloat(invoice.billable_hours) || 0;
  const hourlyRate = parseFloat(invoice.hourly_rate) || 0;
  const expenseAmount = parseFloat(invoice.expenses) || 0;
  const subtotal = parseFloat(invoice.subtotal) || 0;
  const gstAmount = parseFloat(invoice.gst_amount) || 0;

  const { totalTime, totalExpenses } = calculateTotals();
  const balance = totalAmount - paidAmount;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/billing')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">Invoice #{invoice.invoice_number}</Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Download />}
            sx={{ mr: 1 }}
            onClick={() => window.print()}
          >
            Download PDF
          </Button>
          <IconButton color="error" onClick={handleDelete}>
            <Delete />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Invoice Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Invoice Details</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Invoice Number</Typography>
                <Typography variant="body1" fontWeight="bold">{invoice.invoice_number}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Due Date</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Client</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {invoice.client_first_name} {invoice.client_last_name}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Case Number</Typography>
                <Typography variant="body1">{invoice.case_number || '-'}</Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>Billing Summary</Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell align="right"><strong>Amount</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Billable Hours ({billableHours} hrs × ₹{hourlyRate}/hr)</TableCell>
                    <TableCell align="right">₹{(billableHours * hourlyRate).toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Expenses</TableCell>
                    <TableCell align="right">₹{expenseAmount.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Subtotal</TableCell>
                    <TableCell align="right"><strong>₹{subtotal.toFixed(2)}</strong></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>GST ({invoice.gst_percentage}%)</TableCell>
                    <TableCell align="right">₹{gstAmount.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Total Amount</strong></TableCell>
                    <TableCell align="right"><strong>₹{totalAmount.toFixed(2)}</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Time Entries */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Time Entries</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Add />}
                onClick={() => setOpenTimeDialog(true)}
              >
                Add Time Entry
              </Button>
            </Box>

            {timeEntries.length === 0 ? (
              <Alert severity="info">No time entries added yet</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Hours</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {timeEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell>{entry.hours}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Expenses */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Expenses</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Add />}
                onClick={() => setOpenExpenseDialog(true)}
              >
                Add Expense
              </Button>
            </Box>

            {expenses.length === 0 ? (
              <Alert severity="info">No expenses added yet</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{expense.date_incurred ? new Date(expense.date_incurred).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{expense.expense_type}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell align="right">₹{parseFloat(expense.amount || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Payment Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>Payment Summary</Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Status</Typography>
              <Chip 
                label={invoice.payment_status} 
                color={getPaymentStatusColor(invoice.payment_status)} 
                sx={{ mt: 0.5, mb: 2 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Total Amount</Typography>
              <Typography variant="h6">₹{totalAmount.toFixed(2)}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Paid Amount</Typography>
              <Typography variant="h6" color="success.main">₹{paidAmount.toFixed(2)}</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Balance</Typography>
              <Typography variant="h5" color={balance > 0 ? 'warning.main' : 'success.main'}>
                ₹{balance.toFixed(2)}
              </Typography>
            </Box>

            {balance > 0 && (
              <Button
                variant="contained"
                fullWidth
                startIcon={<Payment />}
                color="success"
                onClick={() => setOpenPaymentDialog(true)}
              >
                Pay Now
              </Button>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Add Time Entry Dialog */}
      <Dialog open={openTimeDialog} onClose={() => setOpenTimeDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveTimeEntry}>
          <DialogTitle>Add Time Entry</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Case</InputLabel>
                  <Select
                    value={timeFormData.case_id}
                    onChange={(e) => setTimeFormData({ ...timeFormData, case_id: e.target.value })}
                    label="Case"
                  >
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
                  label="Date"
                  type="date"
                  value={timeFormData.date}
                  onChange={(e) => setTimeFormData({ ...timeFormData, date: e.target.value })}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hours"
                  type="number"
                  value={timeFormData.hours}
                  onChange={(e) => setTimeFormData({ ...timeFormData, hours: e.target.value })}
                  required
                  inputProps={{ min: 0, step: 0.5 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={timeFormData.description}
                  onChange={(e) => setTimeFormData({ ...timeFormData, description: e.target.value })}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenTimeDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Add</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={openExpenseDialog} onClose={() => setOpenExpenseDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveExpense}>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Case</InputLabel>
                  <Select
                    value={expenseFormData.case_id}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, case_id: e.target.value })}
                    label="Case"
                  >
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
                  label="Expense Type"
                  value={expenseFormData.expense_type}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, expense_type: e.target.value })}
                  required
                  placeholder="e.g., Filing fees, Court fees"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount (₹)"
                  type="number"
                  value={expenseFormData.amount}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Date Incurred"
                  type="date"
                  value={expenseFormData.date_incurred}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, date_incurred: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={expenseFormData.description}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenExpenseDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Add</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Payment Dialog */}
      <PaymentDialog
        open={openPaymentDialog}
        onClose={() => setOpenPaymentDialog(false)}
        invoice={invoice}
        onSuccess={() => {
          fetchInvoice();
          setOpenPaymentDialog(false);
        }}
      />
    </Box>
  );
}

export default InvoiceDetail;
