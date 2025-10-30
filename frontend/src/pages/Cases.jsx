import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Grid,
  Card, CardContent, Alert, Fab, Tooltip
} from '@mui/material';
import { 
  Add, Edit, Delete, Visibility, Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, caseId: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    case_number: '',
    client_id: '',
    cnr_number: '',
    court_name: '',
    court_type: '',
    case_type: '',
    case_stage: 'filing',
    subject: '',
    description: '',
    filing_date: '',
    next_hearing_date: '',
    priority: 'medium',
    assigned_to: '',
    billing_rate: ''
  });
  
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [editingCase, setEditingCase] = useState(null);

  useEffect(() => {
    fetchCases();
    fetchClients();
    fetchUsers();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/cases');
      setCases(response.data.cases);
    } catch (error) {
      console.error('Error fetching cases:', error);
      enqueueSnackbar('Failed to fetch cases', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/api/clients');
      setClients(response.data.clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
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

  const handleOpenDialog = (caseItem = null) => {
    if (caseItem) {
      setEditingCase(caseItem);
      setFormData({
        case_number: caseItem.case_number || '',
        client_id: caseItem.client_id || '',
        cnr_number: caseItem.cnr_number || '',
        court_name: caseItem.court_name || '',
        court_type: caseItem.court_type || '',
        case_type: caseItem.case_type || '',
        case_stage: caseItem.case_stage || 'filing',
        subject: caseItem.subject || '',
        description: caseItem.description || '',
        filing_date: caseItem.filing_date || '',
        next_hearing_date: caseItem.next_hearing_date || '',
        priority: caseItem.priority || 'medium',
        assigned_to: caseItem.assigned_to || '',
        billing_rate: caseItem.billing_rate || ''
      });
    } else {
      setEditingCase(null);
      setFormData({
        case_number: '',
        client_id: '',
        cnr_number: '',
        court_name: '',
        court_type: '',
        case_type: '',
        case_stage: 'filing',
        subject: '',
        description: '',
        filing_date: '',
        next_hearing_date: '',
        priority: 'medium',
        assigned_to: '',
        billing_rate: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCase(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.case_number || !formData.client_id) {
      enqueueSnackbar('Case number and client are required', { variant: 'error' });
      return;
    }

    try {
      if (editingCase) {
        // Update case
        await api.put(`/api/cases/${editingCase.id}`, formData);
        enqueueSnackbar('Case updated successfully', { variant: 'success' });
      } else {
        // Create case
        await api.post('/api/cases', formData);
        enqueueSnackbar('Case created successfully', { variant: 'success' });
      }
      fetchCases();
      handleCloseDialog();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.error || 'Failed to save case', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/cases/${deleteDialog.caseId}`);
      enqueueSnackbar('Case deleted successfully', { variant: 'success' });
      fetchCases();
      setDeleteDialog({ open: false, caseId: null });
    } catch (error) {
      enqueueSnackbar(error.response?.data?.error || 'Failed to delete case', { variant: 'error' });
      setDeleteDialog({ open: false, caseId: null });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      closed: 'default',
      on_hold: 'warning'
    };
    return colors[status] || 'default';
  };

  const getStageColor = (stage) => {
    const colors = {
      filing: 'info',
      hearing: 'warning',
      judgment: 'success',
      appeal: 'secondary',
      closed: 'default'
    };
    return colors[stage] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'error',
      high: 'warning',
      medium: 'info',
      low: 'default'
    };
    return colors[priority] || 'info';
  };

  // Filter cases based on search and filters
  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = !searchTerm || 
      caseItem.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${caseItem.client_first_name} ${caseItem.client_last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = !filterStage || caseItem.case_stage === filterStage;
    const matchesStatus = !filterStatus || caseItem.status === filterStatus;
    
    return matchesSearch && matchesStage && matchesStatus;
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Cases</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          New Case
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Cases
              </Typography>
              <Typography variant="h4">{cases.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Cases
              </Typography>
              <Typography variant="h4">
                {cases.filter(c => c.status === 'active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Upcoming Hearings
              </Typography>
              <Typography variant="h4">
                {cases.filter(c => c.next_hearing_date).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Closed Cases
              </Typography>
              <Typography variant="h4">
                {cases.filter(c => c.status === 'closed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Stage</InputLabel>
              <Select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                label="Stage"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="filing">Filing</MenuItem>
                <MenuItem value="hearing">Hearing</MenuItem>
                <MenuItem value="judgment">Judgment</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="appeal">Appeal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="on_hold">On Hold</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Cases Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Case Number</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Court</TableCell>
              <TableCell>Stage</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Next Hearing</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography>Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : filteredCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="textSecondary">No cases found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCases.map((caseItem) => (
                <TableRow key={caseItem.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {caseItem.case_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {caseItem.client_first_name} {caseItem.client_last_name}
                  </TableCell>
                  <TableCell>{caseItem.subject}</TableCell>
                  <TableCell>{caseItem.court_name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={caseItem.case_stage} 
                      size="small" 
                      color={getStageColor(caseItem.case_stage)} 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={caseItem.priority} 
                      size="small" 
                      color={getPriorityColor(caseItem.priority)} 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={caseItem.status} 
                      size="small" 
                      color={getStatusColor(caseItem.status)} 
                    />
                  </TableCell>
                  <TableCell>
                    {caseItem.next_hearing_date 
                      ? new Date(caseItem.next_hearing_date).toLocaleDateString() 
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/cases/${caseItem.id}`)}
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(caseItem)}
                        color="secondary"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        onClick={() => setDeleteDialog({ open: true, caseId: caseItem.id })}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingCase ? 'Edit Case' : 'Create New Case'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Case Number *"
                  value={formData.case_number}
                  onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CNR Number"
                  value={formData.cnr_number}
                  onChange={(e) => setFormData({ ...formData, cnr_number: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Client *</InputLabel>
                  <Select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    label="Client *"
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
                  <InputLabel>Assigned To</InputLabel>
                  <Select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    label="Assigned To"
                  >
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.role})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Court Name"
                  value={formData.court_name}
                  onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Court Type</InputLabel>
                  <Select
                    value={formData.court_type}
                    onChange={(e) => setFormData({ ...formData, court_type: e.target.value })}
                    label="Court Type"
                  >
                    <MenuItem value="High Court">High Court</MenuItem>
                    <MenuItem value="District Court">District Court</MenuItem>
                    <MenuItem value="Supreme Court">Supreme Court</MenuItem>
                    <MenuItem value="Civil Court">Civil Court</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Case Type</InputLabel>
                  <Select
                    value={formData.case_type}
                    onChange={(e) => setFormData({ ...formData, case_type: e.target.value })}
                    label="Case Type"
                  >
                    <MenuItem value="Civil">Civil</MenuItem>
                    <MenuItem value="Criminal">Criminal</MenuItem>
                    <MenuItem value="Family">Family</MenuItem>
                    <MenuItem value="Corporate">Corporate</MenuItem>
                    <MenuItem value="Property">Property</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Stage</InputLabel>
                  <Select
                    value={formData.case_stage}
                    onChange={(e) => setFormData({ ...formData, case_stage: e.target.value })}
                    label="Stage"
                  >
                    <MenuItem value="filing">Filing</MenuItem>
                    <MenuItem value="hearing">Hearing</MenuItem>
                    <MenuItem value="judgment">Judgment</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                    <MenuItem value="appeal">Appeal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    label="Priority"
                  >
                    <MenuItem value="urgent">Urgent</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Billing Rate"
                  type="number"
                  value={formData.billing_rate}
                  onChange={(e) => setFormData({ ...formData, billing_rate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Filing Date"
                  type="date"
                  value={formData.filing_date}
                  onChange={(e) => setFormData({ ...formData, filing_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Next Hearing Date"
                  type="datetime-local"
                  value={formData.next_hearing_date}
                  onChange={(e) => setFormData({ ...formData, next_hearing_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingCase ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, caseId: null })}>
        <DialogTitle>Delete Case</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Are you sure you want to delete this case? This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, caseId: null })}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Cases;
