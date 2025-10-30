import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Chip, Card, CardContent,
  Tabs, Tab, List, ListItem, ListItemText, Divider, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Avatar, Alert
} from '@mui/material';
import { 
  Edit, Delete, ArrowBack, PictureAsPdf, Upload,
  Schedule, Description, Person, AttachMoney,
  InsertDriveFile, Image as ImageIcon
} from '@mui/icons-material';
import api from '../utils/api';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const [caseData, setCaseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [openStageDialog, setOpenStageDialog] = useState(false);
  const [newStage, setNewStage] = useState('');
  const [stageNotes, setStageNotes] = useState('');
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    document_type: '',
    title: '',
    description: '',
    tags: ''
  });
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    fetchCaseDetails();
    fetchDocuments();
    fetchTimeline();
  }, [id]);

  const fetchCaseDetails = async () => {
    try {
      const response = await api.get(`/api/cases/${id}`);
      setCaseData(response.data.case);
    } catch (error) {
      console.error('Error fetching case:', error);
      enqueueSnackbar('Failed to fetch case details', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await api.get(`/api/cases/${id}/documents`);
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadFile || !uploadFormData.title) {
      enqueueSnackbar('Please select a file and enter a title', { variant: 'error' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('document_type', uploadFormData.document_type);
      formData.append('title', uploadFormData.title);
      formData.append('description', uploadFormData.description);
      formData.append('tags', uploadFormData.tags);

      await api.post(`/api/documents/case/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      enqueueSnackbar('Document uploaded successfully', { variant: 'success' });
      setOpenUploadDialog(false);
      setUploadFile(null);
      setUploadFormData({ document_type: '', title: '', description: '', tags: '' });
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to upload document', { variant: 'error' });
    }
  };

  const handleDownload = async (doc) => {
    try {
      console.log('Attempting to download document:', doc.id);
      
      // Use axios with responseType blob to download file
      const response = await api.get(`/api/documents/${doc.id}/download`, {
        responseType: 'blob',
        validateStatus: function (status) {
          return status < 500; // Don't throw for 4xx errors, we'll handle them
        }
      });
      
      console.log('Download response status:', response.status);
      
      if (response.status === 200) {
        // Get the blob from response
        const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
        
        // Get original filename from Content-Disposition header if available
        const contentDisposition = response.headers['content-disposition'];
        let filename = doc.title || 'document';
        
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
      console.error('Error downloading document:', error);
      enqueueSnackbar(error.response?.data?.error || error.message || 'Failed to download document', { variant: 'error' });
    }
  };

  const fetchTimeline = async () => {
    try {
      const response = await api.get(`/api/cases/${id}/timeline`);
      setTasks(response.data.tasks);
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching timeline:', error);
    }
  };

  const handleStageUpdate = async () => {
    try {
      await api.put(`/api/cases/${id}/stage`, {
        case_stage: newStage,
        notes: stageNotes
      });
      enqueueSnackbar('Case stage updated successfully', { variant: 'success' });
      fetchCaseDetails();
      setOpenStageDialog(false);
    } catch (error) {
      enqueueSnackbar(error.response?.data?.error || 'Failed to update stage', { variant: 'error' });
    }
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

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'error',
      high: 'warning',
      medium: 'info',
      low: 'default'
    };
    return colors[priority] || 'info';
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return InsertDriveFile;
    
    if (mimeType.includes('pdf')) {
      return PictureAsPdf;
    } else if (mimeType.startsWith('image/')) {
      return ImageIcon;
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return Description;
    } else {
      return InsertDriveFile;
    }
  };

  const getFileTypeColor = (mimeType) => {
    if (!mimeType) return 'default';
    
    if (mimeType.includes('pdf')) {
      return 'error'; // Red for PDF
    } else if (mimeType.startsWith('image/')) {
      return 'secondary'; // Purple for images
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return 'primary'; // Blue for Word docs
    } else {
      return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading case details...</Typography>
      </Box>
    );
  }

  if (!caseData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Case not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/cases')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">{caseData.case_number}</Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {caseData.subject}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={() => setOpenStageDialog(true)}
          sx={{ mr: 1 }}
        >
          Update Stage
        </Button>
      </Box>

      {/* Case Info Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Client
              </Typography>
              <Typography variant="h6">
                {caseData.client_first_name} {caseData.client_last_name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {caseData.client_email}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {caseData.client_phone}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Assigned To
              </Typography>
              <Typography variant="h6">
                {caseData.assigned_first_name} {caseData.assigned_last_name}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Status
              </Typography>
              <Chip 
                label={caseData.status} 
                color={caseData.status === 'active' ? 'success' : 'default'}
                sx={{ mt: 1 }}
              />
              <Typography color="textSecondary" sx={{ mt: 2 }}>
                Stage
              </Typography>
              <Chip 
                label={caseData.case_stage} 
                color={getStageColor(caseData.case_stage)}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ p: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Overview" />
          <Tab label="Documents" />
          <Tab label="Timeline" />
        </Tabs>

        {/* Overview Tab */}
        {tabValue === 0 && (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Case Details</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Case Number</Typography>
                    <Typography variant="body1" fontWeight="bold">{caseData.case_number}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">CNR Number</Typography>
                    <Typography variant="body1">{caseData.cnr_number || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Court Name</Typography>
                    <Typography variant="body1">{caseData.court_name || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Court Type</Typography>
                    <Typography variant="body1">{caseData.court_type || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Case Type</Typography>
                    <Typography variant="body1">{caseData.case_type || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Priority</Typography>
                    <Chip 
                      label={caseData.priority} 
                      size="small" 
                      color={getPriorityColor(caseData.priority)} 
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Filing Date</Typography>
                    <Typography variant="body1">
                      {caseData.filing_date ? new Date(caseData.filing_date).toLocaleDateString() : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Next Hearing</Typography>
                    <Typography variant="body1">
                      {caseData.next_hearing_date 
                        ? new Date(caseData.next_hearing_date).toLocaleDateString() 
                        : '-'}
                    </Typography>
                  </Grid>
                  {caseData.billing_rate && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Billing Rate</Typography>
                      <Typography variant="body1">₹{caseData.billing_rate}/hr</Typography>
                    </Grid>
                  )}
                </Grid>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Description</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1">
                  {caseData.description || 'No description provided'}
                </Typography>
                
                {caseData.notes && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Notes</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1">
                      {caseData.notes}
                    </Typography>
                  </>
                )}
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Documents Tab */}
        {tabValue === 1 && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Documents ({documents.length})</Typography>
              <Button
                variant="contained"
                startIcon={<Upload />}
                size="small"
                onClick={() => setOpenUploadDialog(true)}
              >
                Upload Document
              </Button>
            </Box>
            <List>
              {documents.map((doc, index) => {
                const FileIcon = getFileIcon(doc.mime_type);
                const fileColor = getFileTypeColor(doc.mime_type);
                
                return (
                  <React.Fragment key={doc.id}>
                    <ListItem
                      secondaryAction={
                        <IconButton onClick={() => handleDownload(doc)}>
                          <FileIcon />
                        </IconButton>
                      }
                    >
                      <Avatar sx={{ mr: 2, bgcolor: `${fileColor}.main` }}>
                        <FileIcon />
                      </Avatar>
                      <ListItemText
                        primary={doc.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {doc.document_type} - Uploaded by {doc.uploaded_by_name}
                            </Typography>
                            {doc.file_size && (
                              <Typography variant="body2" color="textSecondary">
                                {(doc.file_size / 1024).toFixed(2)} KB
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < documents.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
              {documents.length === 0 && (
                <Typography color="textSecondary" sx={{ p: 3, textAlign: 'center' }}>
                  No documents uploaded yet
                </Typography>
              )}
            </List>
          </Box>
        )}

        {/* Timeline Tab */}
        {tabValue === 2 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>Upcoming Events</Typography>
            <Divider sx={{ mb: 2 }} />
            {events.length === 0 ? (
              <Typography color="textSecondary">No upcoming events</Typography>
            ) : (
              <List>
                {events.map((event) => (
                  <ListItem key={event.id}>
                    <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                      <Schedule />
                    </Avatar>
                    <ListItemText
                      primary={event.title}
                      secondary={`${new Date(event.start_datetime).toLocaleString()} - ${event.location}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Tasks</Typography>
            <Divider sx={{ mb: 2 }} />
            {tasks.length === 0 ? (
              <Typography color="textSecondary">No tasks</Typography>
            ) : (
              <List>
                {tasks.map((task) => (
                  <ListItem key={task.id}>
                    <Avatar sx={{ mr: 2, bgcolor: getPriorityColor(task.priority) + '.main' }}>
                      <Description />
                    </Avatar>
                    <ListItemText
                      primary={task.title}
                      secondary={`Due: ${new Date(task.due_date).toLocaleDateString()}`}
                    />
                    <Chip label={task.status} size="small" sx={{ ml: 2 }} />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </Paper>

      {/* Update Stage Dialog */}
      <Dialog open={openStageDialog} onClose={() => setOpenStageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Case Stage</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Stage</InputLabel>
            <Select
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
              label="New Stage"
            >
              <MenuItem value="filing">Filing</MenuItem>
              <MenuItem value="hearing">Hearing</MenuItem>
              <MenuItem value="judgment">Judgment</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
              <MenuItem value="appeal">Appeal</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes"
            value={stageNotes}
            onChange={(e) => setStageNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStageDialog(false)}>Cancel</Button>
          <Button onClick={handleStageUpdate} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleDocumentUpload}>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <input
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                />
                <label htmlFor="file-upload">
                  <Button variant="outlined" component="span" fullWidth startIcon={<Upload />}>
                    {uploadFile ? uploadFile.name : 'Select File'}
                  </Button>
                </label>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Document Type</InputLabel>
                  <Select
                    value={uploadFormData.document_type}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, document_type: e.target.value })}
                    label="Document Type"
                  >
                    <MenuItem value="contract">Contract</MenuItem>
                    <MenuItem value="petition">Petition</MenuItem>
                    <MenuItem value="evidence">Evidence</MenuItem>
                    <MenuItem value="order">Court Order</MenuItem>
                    <MenuItem value="misc">Miscellaneous</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title *"
                  value={uploadFormData.title}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={uploadFormData.description}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tags (comma separated)"
                  value={uploadFormData.tags}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, tags: e.target.value })}
                  placeholder="e.g., contract, important, original"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenUploadDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Upload
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default CaseDetail;
