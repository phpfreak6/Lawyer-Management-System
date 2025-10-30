import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Card, CardContent, TextField, Button, Typography, Alert, MenuItem, Select, InputLabel, FormControl, Link } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import api from '../utils/api';

function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [tenants, setTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    let isMounted = true;
    async function fetchTenants() {
      try {
        setLoadingTenants(true);
        const { data } = await api.get('/api/tenants');
        if (!isMounted) return;
        setTenants(data.tenants || []);
      } catch (err) {
        if (!isMounted) return;
        setError('Failed to load firms. Please try again.');
      } finally {
        if (isMounted) setLoadingTenants(false);
      }
    }
    fetchTenants();
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!firstName || !lastName || !email || !password || !tenantId) {
      setError('Please fill all required fields');
      return;
    }
    const result = await register({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      password,
      tenant_id: Number(tenantId)
    });
    if (result.success) {
      enqueueSnackbar('Registration successful. Please sign in.', { variant: 'success' });
      navigate('/login');
    } else {
      setError(result.error);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Card sx={{ width: '100%' }}>
          <CardContent>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Create your account
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
              Join your firm to get started
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="tenant-select-label">Firm</InputLabel>
                <Select
                  labelId="tenant-select-label"
                  label="Firm"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  disabled={loadingTenants}
                >
                  {tenants.map(t => (
                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField fullWidth label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} margin="normal" required />
              <TextField fullWidth label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} margin="normal" required />
              <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required />
              <TextField fullWidth label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} margin="normal" />
              <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required />

              <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                Sign Up
              </Button>
            </Box>

            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              Already have an account? <Link href="#" onClick={() => navigate('/login')}>Sign in</Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default Register;


