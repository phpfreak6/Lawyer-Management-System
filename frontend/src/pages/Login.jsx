import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Card, CardContent, TextField, Button,
  Typography, Alert, Link
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill all fields');
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      enqueueSnackbar('Login successful!', { variant: 'success' });
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Card sx={{ width: '100%' }}>
          <CardContent>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Lawyer Management System
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
              Sign in to your account
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} autoComplete="on" sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                name="email"
                inputMode="email"
                autoComplete="email"
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                name="current-password"
                autoComplete="current-password"
                InputLabelProps={{ shrink: true }}
                required
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign In
              </Button>
            </Box>

            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              Don't have an account? <Link href="#" onClick={() => navigate('/firm/register')}>
                Add Firm
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default Login;

