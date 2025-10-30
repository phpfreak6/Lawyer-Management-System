import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Chip, Card, CardContent,
  Tabs, Tab, List, ListItem, ListItemText, Divider, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Alert, Tooltip
} from '@mui/material';
import { 
  ArrowBack, Person, Phone, Email, LocationOn,
  Description, FolderSpecial, ContactMail, Upload, Delete, Verified, Warning
} from '@mui/icons-material';
import api from '../utils/api';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const [clientData, setClientData] = useState(null);
  const [cases, setCases] = useState([]);
  const [kycDocuments, setKycDocuments] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [openKycDialog, setOpenKycDialog] = useState(false);
  const [openDeleteKycDialog, setOpenDeleteKycDialog] = useState({ open: false, docId: null });
  const [uploadFile, setUploadFile] = useState(null);
  const [kycFormData, setKycFormData] = useState({
    document_type: '',
    document_number: '',
    expiry_date: '',
    renewal_reminder_date: ''
  });

  useEffect(() => {
    fetchClientDetails();
    fetchClientCases();
    fetchKycDocuments();
    fetchCommunications();
  }, [id]);

  const fetchClientDetails = async () => {
    try {
      const response = await api.get(`/api/clients/${id}`);
      setClientData(response.data.client);
    } catch (error) {
      console.error('Error fetching client:', error);
      enqueueSnackbar('Failed to fetch client details', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchClientCases = async () => {
    try {
      const response = await api.get(`/api/clients/${id}/cases`);
      setCases(response.data.cases);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const fetchKycDocuments = async () => {
    try {
      const response = await api.get(`/api/kyc/client/${id}`);
      setKycDocuments(response.data.documents);
    } catch (error) {
      console.error('Error fetching KYC documents:', error);
    }
  };

  const handleKycUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadFile || !kycFormData.document_type || !kycFormData.document_number) {
      enqueueSnackbar('Please upload a file and enter document details', { variant: 'error' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('document_type', kycFormData.document_type);
      formData.append('document_number', kycFormData.document_number);
      if (kycFormData.expiry_date) {
        formData.append('expiry_date', kycFormData.expiry_date);
      }
      if (kycFormData.renewal_reminder_date) {
        formData.append('renewal_reminder_date', kycFormData.renewal_reminder_date);
      }

      await api.post(`/api/kyc/client/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      enqueueSnackbar('KYC document uploaded successfully', { variant: 'success' });
      setOpenKycDialog(false);
      setUploadFile(null);
      setKycFormData({ document_type: '', document_number: '', expiry_date: '', renewal_reminder_date: '' });
      fetchKycDocuments();
    } catch (error) {
      console.error('Error uploading KYC document:', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to upload document', { variant: 'error' });
    }
  };

  const handleDeleteKyc = async () => {
    try {
      await api.delete(`/api/kyc/${openDeleteKycDialog.docId}`);
      enqueueSnackbar('KYC document deleted successfully', { variant: 'success' });
      fetchKycDocuments();
      setOpenDeleteKycDialog({ open: false, docId: null });
    } catch (error) {
      enqueueSnackbar('Failed to delete document', { variant: 'error' });
      setOpenDeleteKycDialog({ open: false, docId: null });
    }
  };

  const handleToggleVerify = async (docId, currentStatus) => {
    try {
      if (currentStatus) {
        // Unverify
        await api.put(`/api/kyc/${docId}`, { is_verified: false });
        enqueueSnackbar('Document unverified', { variant: 'info' });
      } else {
        // Verify
        await api.put(`/api/kyc/${docId}/verify`);
        enqueueSnackbar('Document verified successfully', { variant: 'success' });
      }
      fetchKycDocuments();
    } catch (error) {
      enqueueSnackbar('Failed to update document status', { variant: 'error' });
    }
  };

  const handleViewDocument = async (doc) => {
    try {
      console.log('Attempting to view document:', doc.id);
      
      // Use api.get with blob response type for proper authentication
      const response = await api.get(`/api/kyc/${doc.id}/download`, {
        responseType: 'blob',
        validateStatus: function (status) {
          return status < 500;
        }
      });
      
      console.log('Download response status:', response.status);
      
      if (response.status === 200) {
        // Get the blob from response
        const blob = new Blob([response.data], { 
          type: response.headers['content-type'] || 'application/octet-stream' 
        });
        
        // Get original filename from Content-Disposition header if available
        const contentDisposition = response.headers['content-disposition'];
        let filename = doc.document_type || 'document';
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        
        // Create a temporary URL for the blob
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        
        // Trigger the download
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        
        enqueueSnackbar('Document downloaded successfully', { variant: 'success' });
      } else {
        // Read the error blob if it's a JSON error
        const text = await response.data.text();
        let errorMessage = 'Failed to download document';
        
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = text || errorMessage;
        }
        
        console.error('Download error:', errorMessage);
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      enqueueSnackbar(error.response?.data?.error || error.message || 'Failed to view document', { variant: 'error' });
    }
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const fetchCommunications = async () => {
    try {
      const response = await api.get(`/api/communications?client_id=${id}`);
      setCommunications(response.data.logs);
    } catch (error) {
      console.error('Error fetching communications:', error);
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'default';
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
        <Typography>Loading client details...</Typography>
      </Box>
    );
  }

  if (!clientData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Client not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/clients')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">
            {clientData.first_name} {clientData.last_name}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Client Profile
          </Typography>
        </Box>
        <Chip 
          label={clientData.status} 
          color={getStatusColor(clientData.status)}
        />
      </Box>

      {/* Info Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Phone sx={{ mb: 1, color: 'textSecondary' }} />
              <Typography color="textSecondary" gutterBottom>
                Phone
              </Typography>
              <Typography variant="h6">{clientData.phone}</Typography>
              {clientData.alternate_phone && (
                <Typography variant="body2" color="textSecondary">
                  Alt: {clientData.alternate_phone}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Email sx={{ mb: 1, color: 'textSecondary' }} />
              <Typography color="textSecondary" gutterBottom>
                Email
              </Typography>
              <Typography variant="body2">{clientData.email || '-'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <FolderSpecial sx={{ mb: 1, color: 'textSecondary' }} />
              <Typography color="textSecondary" gutterBottom>
                Total Cases
              </Typography>
              <Typography variant="h6">{cases.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Description sx={{ mb: 1, color: 'textSecondary' }} />
              <Typography color="textSecondary" gutterBottom>
                KYC Documents
              </Typography>
              <Typography variant="h6">{kycDocuments.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ p: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Overview" />
          <Tab label="Cases" />
          <Tab label="KYC Documents" />
          <Tab label="Communications" />
        </Tabs>

        {/* Overview Tab */}
        {tabValue === 0 && (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Personal Information</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Date of Birth</Typography>
                    <Typography variant="body1">
                      {clientData.date_of_birth ? new Date(clientData.date_of_birth).toLocaleDateString() : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Occupation</Typography>
                    <Typography variant="body1">{clientData.occupation || '-'}</Typography>
                  </Grid>
                  {clientData.address && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">Address</Typography>
                      <Typography variant="body1">{clientData.address}</Typography>
                      {clientData.city && (
                        <Typography variant="body2" color="textSecondary">
                          {clientData.city}, {clientData.state} {clientData.pincode}
                        </Typography>
                      )}
                    </Grid>
                  )}
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>KYC Details</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">PAN Number</Typography>
                    <Typography variant="body1">{clientData.pan_number || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Aadhar Number</Typography>
                    <Typography variant="body1">{clientData.aadhar_number || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">GSTIN</Typography>
                    <Typography variant="body1">{clientData.gstin || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Assigned To</Typography>
                    <Typography variant="body1">{clientData.assigned_to_name || '-'}</Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Cases Tab */}
        {tabValue === 1 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>Client Cases ({cases.length})</Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table>
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
                    <TableRow key={caseItem.id}>
                      <TableCell>{caseItem.case_number}</TableCell>
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
                        <Button
                          size="small"
                          onClick={() => navigate(`/cases/${caseItem.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {cases.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="textSecondary">No cases found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* KYC Documents Tab */}
        {tabValue === 2 && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">KYC Documents ({kycDocuments.length})</Typography>
              <Button
                variant="contained"
                startIcon={<Upload />}
                size="small"
                onClick={() => setOpenKycDialog(true)}
              >
                Upload KYC Document
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List>
              {kycDocuments.map((doc, index) => {
                const expiringSoon = isExpiringSoon(doc.expiry_date);
                const expired = isExpired(doc.expiry_date);
                
                return (
                  <React.Fragment key={doc.id}>
                    <ListItem
                      secondaryAction={
                        <Box>
                          <Tooltip title={doc.is_verified ? "View Document" : "View Document"}>
                            <IconButton 
                              onClick={() => handleViewDocument(doc)}
                              color="primary"
                            >
                              <Description />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={doc.is_verified ? "Unverify Document" : "Verify Document"}>
                            <IconButton 
                              onClick={() => handleToggleVerify(doc.id, doc.is_verified)}
                              color={doc.is_verified ? "default" : "success"}
                            >
                              <Verified />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Document">
                            <IconButton 
                              onClick={() => setOpenDeleteKycDialog({ open: true, docId: doc.id })}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <Avatar sx={{ mr: 2, bgcolor: expired ? 'error.main' : expiringSoon ? 'warning.main' : 'success.main' }}>
                        <Description />
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">{doc.document_type}</Typography>
                            {doc.is_verified && (
                              <Chip label="Verified" size="small" color="success" />
                            )}
                            {expired && (
                              <Chip label="Expired" size="small" color="error" />
                            )}
                            {expiringSoon && !expired && (
                              <Chip label="Expiring Soon" size="small" color="warning" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              Number: {doc.document_number || '-'}
                            </Typography>
                            {doc.expiry_date && (
                              <Typography 
                                variant="body2" 
                                color={expired ? 'error' : expiringSoon ? 'warning.main' : 'textSecondary'}
                              >
                                Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                                {expired && <Warning sx={{ ml: 0.5, fontSize: 'small' }} />}
                              </Typography>
                            )}
                            {doc.renewal_reminder_date && (
                              <Typography variant="body2" color="textSecondary">
                                Reminder: {new Date(doc.renewal_reminder_date).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < kycDocuments.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
              {kycDocuments.length === 0 && (
                <Typography color="textSecondary" sx={{ p: 3, textAlign: 'center' }}>
                  No KYC documents uploaded yet. Click "Upload KYC Document" to add one.
                </Typography>
              )}
            </List>
          </Box>
        )}

        {/* Communications Tab */}
        {tabValue === 3 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>Communication Logs ({communications.length})</Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {communications.map((comm, index) => (
                <React.Fragment key={comm.id}>
                  <ListItem>
                    <Avatar sx={{ mr: 2, bgcolor: comm.direction === 'incoming' ? 'info.main' : 'primary.main' }}>
                      <ContactMail />
                    </Avatar>
                    <ListItemText
                      primary={comm.subject}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {comm.communication_type} - {comm.direction} | {new Date(comm.timestamp).toLocaleString()}
                          </Typography>
                          <Typography variant="body2">{comm.content}</Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < communications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {communications.length === 0 && (
                <Typography color="textSecondary" sx={{ p: 3, textAlign: 'center' }}>
                  No communication logs yet
                </Typography>
              )}
            </List>
          </Box>
        )}
      </Paper>

      {/* Upload KYC Document Dialog */}
      <Dialog open={openKycDialog} onClose={() => setOpenKycDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleKycUpload}>
          <DialogTitle>Upload KYC Document</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <input
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  id="kyc-file-upload"
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                />
                <label htmlFor="kyc-file-upload">
                  <Button variant="outlined" component="span" fullWidth startIcon={<Upload />}>
                    {uploadFile ? uploadFile.name : 'Select KYC Document File'}
                  </Button>
                </label>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Document Type *"
                  value={kycFormData.document_type}
                  onChange={(e) => setKycFormData({ ...kycFormData, document_type: e.target.value })}
                  required
                  placeholder="e.g., PAN, Aadhar, Passport, License"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Document Number *"
                  value={kycFormData.document_number}
                  onChange={(e) => setKycFormData({ ...kycFormData, document_number: e.target.value })}
                  required
                  placeholder="e.g., ABCDE1234F for PAN"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Expiry Date"
                  type="date"
                  value={kycFormData.expiry_date}
                  onChange={(e) => setKycFormData({ ...kycFormData, expiry_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Renewal Reminder Date"
                  type="date"
                  value={kycFormData.renewal_reminder_date}
                  onChange={(e) => setKycFormData({ ...kycFormData, renewal_reminder_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenKycDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Upload
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete KYC Document Dialog */}
      <Dialog open={openDeleteKycDialog.open} onClose={() => setOpenDeleteKycDialog({ open: false, docId: null })}>
        <DialogTitle>Delete KYC Document</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Are you sure you want to delete this KYC document? This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteKycDialog({ open: false, docId: null })}>Cancel</Button>
          <Button onClick={handleDeleteKyc} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ClientDetail;
