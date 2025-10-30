import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import { useSnackbar } from 'notistack';
import api from '../utils/api';

function FirmRegister() {
  const [firmName, setFirmName] = useState('');
  const [domain, setDomain] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!firmName || !adminFirstName || !adminLastName || !adminEmail || !adminPassword) {
      setError('Please fill all required fields');
      return;
    }
    try {
      await api.post('/api/tenants/register', {
        firm_name: firmName,
        domain: domain || undefined,
        admin_email: adminEmail,
        admin_password: adminPassword,
        admin_first_name: adminFirstName,
        admin_last_name: adminLastName,
        admin_phone: adminPhone || undefined
      });
      enqueueSnackbar('Firm created successfully. Please sign in.', { variant: 'success' });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create firm');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Card sx={{ width: '100%' }}>
          <CardContent>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Create your firm
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
              This will create a firm and an admin account
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
              <TextField fullWidth label="Firm name" value={firmName} onChange={(e) => setFirmName(e.target.value)} margin="normal" required />
              <TextField fullWidth label="Domain (optional)" value={domain} onChange={(e) => setDomain(e.target.value)} margin="normal" />
              <TextField fullWidth label="Admin first name" value={adminFirstName} onChange={(e) => setAdminFirstName(e.target.value)} margin="normal" required />
              <TextField fullWidth label="Admin last name" value={adminLastName} onChange={(e) => setAdminLastName(e.target.value)} margin="normal" required />
              <TextField fullWidth label="Admin email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} margin="normal" required />
              <TextField fullWidth label="Admin phone (optional)" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} margin="normal" />
              <TextField fullWidth label="Admin password" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} margin="normal" required />
              <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                Create Firm
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default FirmRegister;


