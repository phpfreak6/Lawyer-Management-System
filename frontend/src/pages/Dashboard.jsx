import React from 'react';
import { Navigate } from 'react-router-dom';
import {
  Grid, Paper, Typography, Box,
  Card, CardContent, LinearProgress
} from '@mui/material';
import { FolderSpecial, People, Assignment, Receipt } from '@mui/icons-material';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useRole } from '../contexts/RoleContext';

function Dashboard() {
  const { userRole } = useRole();

  // Redirect clients to their dedicated portal
  if (userRole === 'client') {
    return <Navigate to="/client" replace />;
  }
  const [stats, setStats] = useState({
    activeCases: 0,
    totalClients: 0,
    pendingTasks: 0,
    unpaidInvoices: 0,
    casesByStage: {},
    upcomingHearings: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [casesRes, clientsRes, tasksRes, billingRes] = await Promise.all([
        axios.get('/api/cases'),
        axios.get('/api/clients'),
        axios.get('/api/tasks'),
        axios.get('/api/billing')
      ]);

      const activeCases = casesRes.data.cases?.filter(c => c.status === 'active').length || 0;
      const pendingTasks = tasksRes.data.tasks?.filter(t => t.status === 'pending').length || 0;
      const unpaidInvoices = billingRes.data.invoices?.filter(i => i.payment_status !== 'paid').length || 0;

      setStats({
        activeCases,
        totalClients: clientsRes.data.clients?.length || 0,
        pendingTasks,
        unpaidInvoices
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const statCards = [
    { title: 'Active Cases', value: stats.activeCases, icon: <FolderSpecial />, color: '#1976d2' },
    { title: 'Total Clients', value: stats.totalClients, icon: <People />, color: '#2e7d32' },
    { title: 'Pending Tasks', value: stats.pendingTasks, icon: <Assignment />, color: '#ed6c02' },
    { title: 'Unpaid Invoices', value: stats.unpaidInvoices, icon: <Receipt />, color: '#d32f2f' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: card.color, mr: 2, fontSize: 40 }}>
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4">{card.value}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Activity feed will be displayed here
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Deadlines
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No upcoming deadlines
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;

