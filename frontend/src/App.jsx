import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, Typography } from '@mui/material';
import { SnackbarProvider } from 'notistack';

// Pages
import Login from './pages/Login';
import FirmRegister from './pages/FirmRegister';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Billing from './pages/Billing';
import InvoiceDetail from './pages/InvoiceDetail';
import LegalData from './pages/LegalData';
import Users from './pages/Users';
import RemindersSettings from './pages/RemindersSettings';
import ClientDashboard from './pages/ClientDashboard';
import ClientCases from './pages/ClientCases';
import ClientDocuments from './pages/ClientDocuments';
import ClientInvoices from './pages/ClientInvoices';
import ClientKYC from './pages/ClientKYC';

// Components
import Layout from './components/Layout';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RoleProvider } from './contexts/RoleContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Show nothing while checking auth to prevent flash
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/firm/register" element={<PublicRoute><FirmRegister /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="cases" element={<Cases />} />
        <Route path="cases/:id" element={<CaseDetail />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="billing" element={<Billing />} />
        <Route path="billing/:id" element={<InvoiceDetail />} />
        <Route path="legal-data" element={<LegalData />} />
        <Route path="users" element={<Users />} />
        <Route path="settings/reminders" element={<RemindersSettings />} />
        <Route path="client" element={<ClientDashboard />} />
        <Route path="client/cases" element={<ClientCases />} />
        <Route path="client/documents" element={<ClientDocuments />} />
        <Route path="client/invoices" element={<ClientInvoices />} />
        <Route path="client/kyc" element={<ClientKYC />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <Router>
          <AuthProvider>
            <RoleProvider>
              <AppRoutes />
            </RoleProvider>
          </AuthProvider>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;

