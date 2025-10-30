import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Alert, LinearProgress,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem
} from '@mui/material';
import { VerifiedUser, Upload, Add, Download } from '@mui/icons-material';
import api from '../utils/api';
import { useSnackbar } from 'notistack';
import { useRole } from '../contexts/RoleContext';

function ClientKYC() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadData, setUploadData] = useState({
    document_type: '',
    document_number: '',
    description: ''
  });
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = useRole();

  useEffect(() => {
    fetchKYCDocuments();
  }, []);

  const fetchKYCDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/kyc/client/documents');
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error fetching KYC documents:', error);
      enqueueSnackbar('Failed to load KYC documents', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleUploadKYC = async () => {
    if (!uploadFile || !uploadData.document_type) {
      enqueueSnackbar('Please select a file and document type', { variant: 'error' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('document_type', uploadData.document_type);
      formData.append('document_number', uploadData.document_number);
      formData.append('description', uploadData.description);

      await api.post('/api/kyc/client/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      enqueueSnackbar('KYC document uploaded successfully', { variant: 'success' });
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadData({
        document_type: '',
        document_number: '',
        description: ''
      });
      fetchKYCDocuments();
    } catch (error) {
      console.error('Error uploading KYC document:', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to upload KYC document', { variant: 'error' });
    }
  };

  const handleDownload = (filePath) => {
    window.open(`/uploads/${filePath}`, '_blank');
  };

  const getStatusColor = (isVerified) => {
    return isVerified ? 'success' : 'warning';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading KYC documents...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            <VerifiedUser sx={{ mr: 1, verticalAlign: 'middle' }} />
            KYC Documents
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Upload and manage your identity verification documents
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Upload />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Upload KYC Document
        </Button>
      </Box>

      {documents.length === 0 ? (
        <Alert severity="info">
          No KYC documents uploaded yet. Upload your identity documents here.
        </Alert>
      ) : (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Document Type</TableCell>
                <TableCell>Document Number</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Upload Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {doc.document_type}
                    </Typography>
                  </TableCell>
                  <TableCell>{doc.document_number || 'N/A'}</TableCell>
                  <TableCell>{doc.description || 'No description'}</TableCell>
                  <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip 
                      label={doc.is_verified ? 'Verified' : 'Pending Verification'} 
                      size="small"
                      color={getStatusColor(doc.is_verified)} 
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => handleDownload(doc.file_path)}
                    >
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Upload KYC Document Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload KYC Document</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              select
              label="Document Type"
              value={uploadData.document_type}
              onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
              margin="normal"
              required
            >
              <MenuItem value="aadhaar">Aadhaar Card</MenuItem>
              <MenuItem value="pan">PAN Card</MenuItem>
              <MenuItem value="passport">Passport</MenuItem>
              <MenuItem value="driving_license">Driving License</MenuItem>
              <MenuItem value="voter_id">Voter ID</MenuItem>
              <MenuItem value="bank_statement">Bank Statement</MenuItem>
              <MenuItem value="address_proof">Address Proof</MenuItem>
              <MenuItem value="photo">Photo ID</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Document Number"
              value={uploadData.document_number}
              onChange={(e) => setUploadData({ ...uploadData, document_number: e.target.value })}
              margin="normal"
              placeholder="e.g., 1234-5678-9012"
            />
            <TextField
              fullWidth
              label="Description"
              value={uploadData.description}
              onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Add />}
                fullWidth
              >
                Select Document (PDF, JPG, PNG)
                <input
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </Button>
              {uploadFile && (
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  Selected: {uploadFile.name}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUploadKYC} variant="contained" disabled={!uploadFile || !uploadData.document_type}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ClientKYC;

