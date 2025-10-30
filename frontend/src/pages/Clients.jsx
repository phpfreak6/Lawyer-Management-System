import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Grid, Card, CardContent, Menu, MenuItem, FormControl, InputLabel, Select
} from '@mui/material';
import { Add, Edit, Delete, Visibility, MoreVert } from '@mui/icons-material';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

function Clients() {
  const [clients, setClients] = useState([]);
  const [clientsWithCases, setClientsWithCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, clientId: null });
  const [users, setUsers] = useState([]);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    alternate_phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    date_of_birth: '',
    pan_number: '',
    aadhar_number: '',
    gstin: '',
    occupation: '',
    assigned_to: ''
  });

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchClients();
    fetchUsers();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const [clientsRes, casesRes] = await Promise.all([
        api.get('/api/clients'),
        api.get('/api/cases')
      ]);
      
      const casesCount = {};
      casesRes.data.cases.forEach(c => {
        casesCount[c.client_id] = (casesCount[c.client_id] || 0) + 1;
      });
      
      const clientsData = clientsRes.data.clients.map(c => ({
        ...c,
        case_count: casesCount[c.id] || 0
      }));
      
      setClients(clientsData);
      setClientsWithCases(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      enqueueSnackbar('Failed to fetch clients', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/auth/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleOpenDialog = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        email: client.email || '',
        phone: client.phone || '',
        alternate_phone: client.alternate_phone || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        pincode: client.pincode || '',
        date_of_birth: client.date_of_birth || '',
        pan_number: client.pan_number || '',
        aadhar_number: client.aadhar_number || '',
        gstin: client.gstin || '',
        occupation: client.occupation || '',
        assigned_to: client.assigned_to || ''
      });
    } else {
      setEditingClient(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        alternate_phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        date_of_birth: '',
        pan_number: '',
        aadhar_number: '',
        gstin: '',
        occupation: '',
        assigned_to: ''
      });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.phone) {
      enqueueSnackbar('First name, last name, and phone are required', { variant: 'error' });
      return;
    }

    try {
      if (editingClient) {
        await api.put(`/api/clients/${editingClient.id}`, formData);
        enqueueSnackbar('Client updated successfully', { variant: 'success' });
      } else {
        const response = await api.post('/api/clients', formData);
        
        // Show client login credentials if auto-created
        if (response.data.loginCreated && formData.email) {
          const defaultPassword = `${formData.first_name.substring(0, 4).toLowerCase()}${formData.phone.slice(-4)}`;
          enqueueSnackbar(
            `Client created! Login: ${formData.email} | Password: ${defaultPassword}`, 
            { variant: 'success', autoHideDuration: 10000 }
          );
        } else {
          enqueueSnackbar('Client created successfully', { variant: 'success' });
        }
      }
      fetchClients();
      setOpenDialog(false);
    } catch (error) {
      enqueueSnackbar(error.response?.data?.error || 'Failed to save client', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/clients/${deleteDialog.clientId}`);
      enqueueSnackbar('Client deleted successfully', { variant: 'success' });
      fetchClients();
      setDeleteDialog({ open: false, clientId: null });
    } catch (error) {
      enqueueSnackbar(error.response?.data?.error || 'Failed to delete client', { variant: 'error' });
      setDeleteDialog({ open: false, clientId: null });
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Clients</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          New Client
        </Button>
      </Box>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Clients</Typography>
              <Typography variant="h4">{clients.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Active Clients</Typography>
              <Typography variant="h4">{clients.filter(c => c.status === 'active').length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Cases</Typography>
              <Typography variant="h4">{clients.reduce((sum, c) => sum + (c.case_count || 0), 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Clients Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Cases</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id} hover>
                <TableCell>
                  <Typography variant="subtitle2">
                    {client.first_name} {client.last_name}
                  </Typography>
                </TableCell>
                <TableCell>{client.email || '-'}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell>
                  <Chip label={client.case_count || 0} size="small" color="primary" />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={client.status} 
                    size="small" 
                    color={getStatusColor(client.status)} 
                  />
                </TableCell>
                <TableCell>{client.assigned_to_name || '-'}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => navigate(`/clients/${client.id}`)}>
                    <Visibility />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleOpenDialog(client)}>
                    <Edit />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingClient ? 'Edit Client' : 'Create New Client'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name *"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name *"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone *"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Alternate Phone"
                  value={formData.alternate_phone}
                  onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="PAN Number"
                  value={formData.pan_number}
                  onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Aadhar Number"
                  value={formData.aadhar_number}
                  onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="GSTIN"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Occupation"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Assigned To</InputLabel>
                  <Select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    label="Assigned To"
                  >
                    <MenuItem value="">
                      <em>Not assigned</em>
                    </MenuItem>
                    {users
                      .filter((user) => user.role === 'lawyer')
                      .map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.role})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingClient ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, clientId: null })}>
        <DialogTitle>Delete Client</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this client?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, clientId: null })}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Clients;
