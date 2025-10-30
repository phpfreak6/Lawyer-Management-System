import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Alert, LinearProgress, Button
} from '@mui/material';
import {
  FolderSpecial, Receipt, Description, Event as EventIcon
} from '@mui/icons-material';
import api from '../utils/api';
import { useSnackbar } from 'notistack';
import { useRole } from '../contexts/RoleContext';

function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    pendingInvoices: 0,
    totalInvoices: 0
  });
  
  const { enqueueSnackbar } = useSnackbar();
  const { userRole } = useRole();

  useEffect(() => {
    if (userRole === 'client') {
      fetchClientData();
    }
  }, [userRole]);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      // Fetch cases - client should only see their own cases
      const casesResponse = await api.get('/api/clients/me/cases');
      setCases(casesResponse.data.cases || []);
      
      // Fetch invoices
      const invoicesResponse = await api.get('/api/clients/me/invoices');
      const invoicesData = invoicesResponse.data.invoices || [];
      setInvoices(invoicesData);
      
      // Fetch upcoming events
      const eventsResponse = await api.get('/api/clients/me/calendar/upcoming');
      setUpcomingEvents(eventsResponse.data.events || []);
      
      // Calculate stats
      const activeCasesCount = casesResponse.data.cases?.filter(c => c.status === 'active').length || 0;
      const pendingInvoicesCount = invoicesData.filter(i => i.status === 'pending').length || 0;
      
      setStats({
        totalCases: casesResponse.data.cases?.length || 0,
        activeCases: activeCasesCount,
        pendingInvoices: pendingInvoicesCount,
        totalInvoices: invoicesData.length
      });
    } catch (error) {
      console.error('Error fetching client data:', error);
      enqueueSnackbar('Failed to load dashboard data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewCase = (caseId) => {
    window.location.href = `/cases/${caseId}`;
  };

  const handleViewInvoice = (invoiceId) => {
    window.location.href = `/billing/${invoiceId}`;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Client Portal
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Welcome to your case dashboard
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FolderSpecial sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h4">{stats.totalCases}</Typography>
              </Box>
              <Typography color="textSecondary">Total Cases</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FolderSpecial sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h4">{stats.activeCases}</Typography>
              </Box>
              <Typography color="textSecondary">Active Cases</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Receipt sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h4">{stats.pendingInvoices}</Typography>
              </Box>
              <Typography color="textSecondary">Pending Invoices</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Receipt sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h4">{stats.totalInvoices}</Typography>
              </Box>
              <Typography color="textSecondary">Total Invoices</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Cases */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <FolderSpecial sx={{ mr: 1, verticalAlign: 'middle' }} />
                My Cases
              </Typography>
              
              {cases.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No cases found. Contact your lawyer for case information.
                </Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Case Number</TableCell>
                        <TableCell>Subject</TableCell>
                        <TableCell>Court</TableCell>
                        <TableCell>Stage</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cases.map((caseItem) => (
                        <TableRow key={caseItem.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {caseItem.case_number}
                            </Typography>
                          </TableCell>
                          <TableCell>{caseItem.subject}</TableCell>
                          <TableCell>{caseItem.court_name}</TableCell>
                          <TableCell>
                            <Chip 
                              label={caseItem.case_stage} 
                              size="small"
                              color={
                                caseItem.case_stage === 'closed' ? 'default' :
                                caseItem.case_stage === 'judgment' ? 'success' :
                                caseItem.case_stage === 'hearing' ? 'warning' : 'info'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={caseItem.status} 
                              size="small"
                              color={caseItem.status === 'active' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="small" 
                              onClick={() => handleViewCase(caseItem.id)}
                              variant="outlined"
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar - Invoices and Events */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
          {/* Recent Invoices */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Recent Invoices
                </Typography>
                  
                  {invoices.length === 0 ? (
                    <Typography variant="body2" color="textSecondary">
                      No invoices yet
                    </Typography>
                  ) : (
                    <Box sx={{ mt: 1 }}>
                      {invoices.slice(0, 3).map((invoice) => (
                        <Box 
                          key={invoice.id} 
                          sx={{ 
                            mb: 2, 
                            pb: 2, 
                            borderBottom: '1px solid #eee',
                            '&:last-child': { borderBottom: 'none' }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" fontWeight="bold">
                              {invoice.invoice_number}
                            </Typography>
                            <Chip 
                              label={invoice.status} 
                              size="small"
                              color={invoice.status === 'paid' ? 'success' : invoice.status === 'pending' ? 'warning' : 'default'}
                            />
                          </Box>
                          <Typography variant="body2" color="textSecondary">
                            ₹{invoice.total_amount?.toLocaleString()}
                          </Typography>
                          <Button 
                            size="small" 
                            sx={{ mt: 1 }}
                            onClick={() => handleViewInvoice(invoice.id)}
                          >
                            View Details
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Upcoming Events */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Upcoming Events
                  </Typography>
                  
                  {upcomingEvents.length === 0 ? (
                    <Typography variant="body2" color="textSecondary">
                      No upcoming events
                    </Typography>
                  ) : (
                    <Box sx={{ mt: 1 }}>
                      {upcomingEvents.slice(0, 3).map((event) => (
                        <Box 
                          key={event.id} 
                          sx={{ 
                            mb: 2, 
                            pb: 2, 
                            borderBottom: '1px solid #eee',
                            '&:last-child': { borderBottom: 'none' }
                          }}
                        >
                          <Typography variant="body2" fontWeight="bold">
                            {event.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(event.start_datetime).toLocaleString()}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ClientDashboard;

