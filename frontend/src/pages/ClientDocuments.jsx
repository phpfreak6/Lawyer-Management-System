import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Alert, LinearProgress,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem
} from '@mui/material';
import { Description, Download, Upload, Add } from '@mui/icons-material';
import api from '../utils/api';
import { useSnackbar } from 'notistack';
import { useRole } from '../contexts/RoleContext';

function ClientDocuments() {
  const [documents, setDocuments] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    document_type: '',
    case_id: '',
    description: ''
  });
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = useRole();

  useEffect(() => {
    fetchDocuments();
    fetchCases();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/documents/client/documents');
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      enqueueSnackbar('Failed to load documents', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const response = await api.get('/api/my-cases');
      setCases(response.data.cases || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadData({ ...uploadData, title: file.name });
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadFile || !uploadData.case_id) {
      enqueueSnackbar('Please select a file and case', { variant: 'error' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadData.title);
      formData.append('document_type', uploadData.document_type || 'client_upload');
      formData.append('description', uploadData.description);
      formData.append('case_id', uploadData.case_id);

      console.log('Uploading document:', {
        title: uploadData.title,
        case_id: uploadData.case_id,
        document_type: uploadData.document_type
      });

      const response = await api.post('/api/documents/client/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      enqueueSnackbar('Document uploaded successfully', { variant: 'success' });
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadData({
        title: '',
        document_type: '',
        case_id: '',
        description: ''
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      console.error('Error details:', error.response?.data);
      enqueueSnackbar(error.response?.data?.error || 'Failed to upload document', { variant: 'error' });
    }
  };

  const handleDownload = (docId) => {
    window.open(`/api/documents/${docId}/download`, '_blank');
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading documents...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
            My Documents
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Access and manage all documents related to your cases
          </Typography>
        </Box>
        {hasPermission('document:upload') && (
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Document
          </Button>
        )}
      </Box>

      {documents.length === 0 ? (
        <Alert severity="info">
          No documents available yet.
        </Alert>
      ) : (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Document Type</TableCell>
                <TableCell>Case</TableCell>
                <TableCell>Uploaded On</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {doc.title || doc.file_path}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={doc.document_type || 'Document'} 
                      size="small"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    {doc.case_number || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(doc.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => handleDownload(doc.id)}
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

      {/* Upload Document Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              select
              label="Select Case"
              value={uploadData.case_id}
              onChange={(e) => setUploadData({ ...uploadData, case_id: e.target.value })}
              margin="normal"
              required
            >
              {cases.map((caseItem) => (
                <MenuItem key={caseItem.id} value={caseItem.id}>
                  {caseItem.case_number} - {caseItem.subject}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Document Type"
              select
              value={uploadData.document_type}
              onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
              margin="normal"
            >
              <MenuItem value="evidence">Evidence</MenuItem>
              <MenuItem value="correspondence">Correspondence</MenuItem>
              <MenuItem value="medical_report">Medical Report</MenuItem>
              <MenuItem value="contract">Contract</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Document Title"
              value={uploadData.title}
              onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={uploadData.description}
              onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Add />}
                fullWidth
              >
                Select File
                <input
                  type="file"
                  hidden
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
          <Button onClick={handleUploadDocument} variant="contained" disabled={!uploadFile}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ClientDocuments;
