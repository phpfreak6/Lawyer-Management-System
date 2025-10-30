import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Grid, Card, CardContent, FormControl, InputLabel, Select, MenuItem,
  DialogContentText, Alert
} from '@mui/material';
import { Add, Edit, Delete, CheckCircle, Schedule } from '@mui/icons-material';
import api from '../utils/api';
import { useSnackbar } from 'notistack';

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, taskId: null });
  const [cases, setCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    case_id: '',
    client_id: '',
    title: '',
    description: '',
    task_type: '',
    priority: 'medium',
    due_date: '',
    assigned_to: ''
  });
  
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchTasks();
    fetchCases();
    fetchClients();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/tasks');
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      enqueueSnackbar('Failed to fetch tasks', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const response = await api.get('/api/cases');
      setCases(response.data.cases);
    } catch (error) {
      console.error('Error fetching cases:', error);
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

  const handleOpenDialog = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        case_id: task.case_id || '',
        client_id: task.client_id || '',
        title: task.title || '',
        description: task.description || '',
        task_type: task.task_type || '',
        priority: task.priority || 'medium',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        assigned_to: task.assigned_to || ''
      });
    } else {
      setEditingTask(null);
      setFormData({
        case_id: '',
        client_id: '',
        title: '',
        description: '',
        task_type: '',
        priority: 'medium',
        due_date: '',
        assigned_to: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTask(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      enqueueSnackbar('Title is required', { variant: 'error' });
      return;
    }

    try {
      if (editingTask) {
        await api.put(`/api/tasks/${editingTask.id}`, formData);
        enqueueSnackbar('Task updated successfully', { variant: 'success' });
      } else {
        await api.post('/api/tasks', formData);
        enqueueSnackbar('Task created successfully', { variant: 'success' });
      }
      fetchTasks();
      handleCloseDialog();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.error || 'Failed to save task', { variant: 'error' });
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await api.post(`/api/tasks/${taskId}/complete`);
      enqueueSnackbar('Task completed successfully', { variant: 'success' });
      fetchTasks();
    } catch (error) {
      enqueueSnackbar('Failed to complete task', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/tasks/${deleteDialog.taskId}`);
      enqueueSnackbar('Task deleted successfully', { variant: 'success' });
      fetchTasks();
      setDeleteDialog({ open: false, taskId: null });
    } catch (error) {
      enqueueSnackbar('Failed to delete task', { variant: 'error' });
      setDeleteDialog({ open: false, taskId: null });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      in_progress: 'info',
      completed: 'success',
      cancelled: 'default'
    };
    return colors[status] || 'default';
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

  const getTasksByStatus = (status) => {
    return tasks.filter(t => t.status === status);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Tasks</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          New Task
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Tasks</Typography>
              <Typography variant="h4">{tasks.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Pending</Typography>
              <Typography variant="h4">{getTasksByStatus('pending').length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>In Progress</Typography>
              <Typography variant="h4">{getTasksByStatus('in_progress').length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Completed</Typography>
              <Typography variant="h4">{getTasksByStatus('completed').length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tasks Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Case</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id} hover>
                <TableCell>{task.title}</TableCell>
                <TableCell>{task.case_number || '-'}</TableCell>
                <TableCell>{task.task_type || '-'}</TableCell>
                <TableCell>
                  <Chip 
                    label={task.priority} 
                    size="small" 
                    color={getPriorityColor(task.priority)} 
                  />
                </TableCell>
                <TableCell>
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={task.status} 
                    size="small" 
                    color={getStatusColor(task.status)} 
                  />
                </TableCell>
                <TableCell>{task.assigned_name || '-'}</TableCell>
                <TableCell>
                  {task.status !== 'completed' && (
                    <IconButton 
                      size="small" 
                      onClick={() => handleComplete(task.id)}
                      color="success"
                      title="Mark as complete"
                    >
                      <CheckCircle />
                    </IconButton>
                  )}
                  <IconButton 
                    size="small" 
                    onClick={() => handleOpenDialog(task)}
                    color="primary"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => setDeleteDialog({ open: true, taskId: task.id })}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title *"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
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
                        {caseItem.case_number} - {caseItem.subject}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Client</InputLabel>
                  <Select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    label="Client"
                  >
                    <MenuItem value="">None</MenuItem>
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
                  <InputLabel>Task Type</InputLabel>
                  <Select
                    value={formData.task_type}
                    onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                    label="Task Type"
                  >
                    <MenuItem value="filing">Filing</MenuItem>
                    <MenuItem value="research">Research</MenuItem>
                    <MenuItem value="meeting">Meeting</MenuItem>
                    <MenuItem value="hearing_preparation">Hearing Preparation</MenuItem>
                    <MenuItem value="document_review">Document Review</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
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
                  label="Due Date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <Schedule sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Assigned To</InputLabel>
                  <Select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    label="Assigned To"
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {users.map((user) => (
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
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingTask ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, taskId: null })}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Are you sure you want to delete this task? This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, taskId: null })}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Tasks;
