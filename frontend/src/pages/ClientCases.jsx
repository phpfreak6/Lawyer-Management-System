import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Alert, LinearProgress, Button, Grid
} from '@mui/material';
import { FolderSpecial, Visibility } from '@mui/icons-material';
import api from '../utils/api';
import { useSnackbar } from 'notistack';

function ClientCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchCases();
  }, []);

  // Debug - log cases whenever they change
  useEffect(() => {
    console.log('Cases state updated:', cases);
  }, [cases]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/my-cases');
      console.log('My cases response:', response.data);
      setCases(response.data.cases || []);
      if (response.data.cases && response.data.cases.length > 0) {
        enqueueSnackbar(`Found ${response.data.cases.length} case(s)`, { variant: 'success' });
      } else {
        enqueueSnackbar('No cases found', { variant: 'info' });
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      console.error('Error details:', error.response?.data);
      enqueueSnackbar(error.response?.data?.error || 'Failed to load cases', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (caseId) => {
    window.location.href = `/cases/${caseId}`;
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

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading cases...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          <FolderSpecial sx={{ mr: 1, verticalAlign: 'middle' }} />
          My Cases
        </Typography>
        <Typography variant="body2" color="textSecondary">
          View all your cases and their current status
        </Typography>
      </Box>

      {cases.length === 0 ? (
        <Alert severity="info">
          No cases found. Contact your lawyer for case information.
        </Alert>
      ) : (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Case Number</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Court</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Next Hearing</TableCell>
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
                      color={getStageColor(caseItem.case_stage)} 
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
                      : 'Not scheduled'}
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => handleViewDetails(caseItem.id)}
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
    </Box>
  );
}

export default ClientCases;

