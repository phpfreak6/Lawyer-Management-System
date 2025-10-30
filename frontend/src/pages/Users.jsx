import React, { useEffect, useState } from 'react';
import { Container, Box, Typography, Card, CardContent, TextField, MenuItem, Button, Grid, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Divider } from '@mui/material';
import api from '../utils/api';

function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', phone: '', role: '', is_active: true, password: '' });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'lawyer'
  });

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/api/users');
      setUsers(data.users || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/users', form);
      setForm({ first_name: '', last_name: '', email: '', phone: '', password: '', role: 'lawyer' });
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const startEdit = (u) => {
    setEditing(u.id);
    setEditForm({ first_name: u.first_name, last_name: u.last_name, email: u.email, phone: u.phone || '', role: u.role, is_active: u.is_active ?? true, password: '' });
    setOpen(true);
  };

  const saveEdit = async () => {
    setError('');
    try {
      const payload = { ...editForm };
      if (!payload.password) delete payload.password;
      await api.put(`/api/users/${editing}`, payload);
      setEditing(null);
      setOpen(false);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setOpen(false);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 3 }}>
        <Typography variant="h5" gutterBottom>Firm Users</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Create User</Typography>
                <Box component="form" onSubmit={handleCreate}>
                  <TextField fullWidth label="First name" margin="dense" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
                  <TextField fullWidth label="Last name" margin="dense" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
                  <TextField fullWidth label="Email" type="email" margin="dense" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  <TextField fullWidth label="Phone" margin="dense" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  <TextField fullWidth label="Password" type="password" margin="dense" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                  <TextField fullWidth select label="Role" margin="dense" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="lawyer">Lawyer</MenuItem>
                    <MenuItem value="paralegal">Paralegal</MenuItem>
                    <MenuItem value="client">Client</MenuItem>
                  </TextField>
                  <Button type="submit" variant="contained" sx={{ mt: 2 }}>Create</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Users</Typography>
                {users.map(u => (
                  <Box key={u.id} sx={{ py: 1, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Typography sx={{ minWidth: 160 }}>{u.first_name} {u.last_name}</Typography>
                      <Divider orientation="vertical" flexItem />
                      <Typography sx={{ minWidth: 220 }}>{u.email}</Typography>
                      <Divider orientation="vertical" flexItem />
                      <Typography sx={{ textTransform: 'capitalize' }}>{u.role}</Typography>
                    </Box>
                    <Button variant="outlined" size="small" onClick={() => startEdit(u)}>Edit</Button>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Dialog open={open} onClose={cancelEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="First name" value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
            <TextField label="Last name" value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
            <TextField label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} fullWidth sx={{ gridColumn: '1 / -1' }} />
            <TextField label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            <TextField select label="Role" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="lawyer">Lawyer</MenuItem>
              <MenuItem value="paralegal">Paralegal</MenuItem>
              <MenuItem value="client">Client</MenuItem>
            </TextField>
            <TextField label="New Password (optional)" type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} fullWidth sx={{ gridColumn: '1 / -1' }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelEdit}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit}>Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Users;


