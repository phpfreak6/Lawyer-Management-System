import React, { useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Card, CardContent, TextField, Button,
  Grid, Chip, Paper, Divider, Alert, CircularProgress
} from '@mui/material';
import {
  Gavel as GavelIcon, Business as BusinessIcon, Badge as BadgeIcon,
  CloudUpload as CloudUploadIcon, Description as DescriptionIcon,
  VerifiedUser as VerifiedUserIcon, Search as SearchIcon
} from '@mui/icons-material';
import api from '../utils/api';
import { useSnackbar } from 'notistack';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function LegalData() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  
  // eCourts state
  const [cnrNumber, setCnrNumber] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [courtId, setCourtId] = useState('');
  const [hearingDate, setHearingDate] = useState('');

  // Verification state
  const [gstin, setGstin] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [verificationResults, setVerificationResults] = useState(null);

  // DigiLocker state
  const [docType, setDocType] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [clientAadhaar, setClientAadhaar] = useState('');

  // eSign state
  const [esignData, setEsignData] = useState({ document: '', signerAadhaar: '' });

  const { enqueueSnackbar } = useSnackbar();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSearchResults(null);
    setVerificationResults(null);
  };

  // eCourts Functions
  const handleSearchCNR = async () => {
    if (!cnrNumber) {
      enqueueSnackbar('Please enter CNR number', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/legal-data/ecourts/search-cnr', { cnr_number: cnrNumber });
      setSearchResults(response.data.result);
      enqueueSnackbar('Case found successfully', { variant: 'success' });
    } catch (error) {
      console.error('Search error:', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to search case', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGetCaseStatus = async () => {
    if (!caseNumber) {
      enqueueSnackbar('Please enter case number', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/api/legal-data/ecourts/case-status/${caseNumber}`);
      setSearchResults(response.data.result);
      enqueueSnackbar('Case status retrieved', { variant: 'success' });
    } catch (error) {
      console.error('Get case status error:', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to get case status', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGetCauseList = async () => {
    if (!courtId || !hearingDate) {
      enqueueSnackbar('Please enter court ID and date', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/legal-data/ecourts/cause-list', {
        court_id: courtId,
        date: hearingDate
      });
      setSearchResults(response.data.result);
      enqueueSnackbar('Cause list retrieved', { variant: 'success' });
    } catch (error) {
      console.error('Get cause list error:', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to get cause list', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Verification Functions
  const handleVerifyGST = async () => {
    if (!gstin) {
      enqueueSnackbar('Please enter GSTIN', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/legal-data/verify/gst', { gstin });
      setVerificationResults({ type: 'GST', data: response.data.result });
      enqueueSnackbar('GST verified successfully', { variant: 'success' });
    } catch (error) {
      console.error('GST verification error:', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to verify GST', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPAN = async () => {
    if (!panNumber) {
      enqueueSnackbar('Please enter PAN number', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/legal-data/verify/pan', { pan_number: panNumber });
      setVerificationResults({ type: 'PAN', data: response.data.result });
      enqueueSnackbar('PAN verified successfully', { variant: 'success' });
    } catch (error) {
      console.error('PAN verification error:', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to verify PAN', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // DigiLocker Functions
  const handleVerifyDocument = async () => {
    if (!docType || !docNumber) {
      enqueueSnackbar('Please enter document type and number', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/legal-data/digitallocker/verify', {
        document_type: docType,
        document_number: docNumber
      });
      setVerificationResults({ type: 'DigiLocker', data: response.data.result });
      enqueueSnackbar('Document verified successfully', { variant: 'success' });
    } catch (error) {
      console.error('Document verification error:', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to verify document', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchDocument = async () => {
    if (!docType || !clientAadhaar) {
      enqueueSnackbar('Please enter document type and Aadhaar', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/legal-data/digitallocker/fetch', {
        document_type: docType,
        client_aadhaar: clientAadhaar
      });
      setVerificationResults({ type: 'DigiLocker Fetch', data: response.data.result });
      enqueueSnackbar('Document fetched successfully', { variant: 'success' });
    } catch (error) {
      console.error('Document fetch error:', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to fetch document', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // eSign Functions
  const handleCreateEsign = async () => {
    if (!esignData.document || !esignData.signerAadhaar) {
      enqueueSnackbar('Please enter document data and signer Aadhaar', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/legal-data/esign/create', {
        document_data: esignData.document,
        signer_aadhaar: esignData.signerAadhaar
      });
      setVerificationResults({ type: 'eSign', data: response.data.result });
      enqueueSnackbar('eSign request created successfully', { variant: 'success' });
    } catch (error) {
      console.error('eSign creation error:', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to create eSign request', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Legal Data Integration
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Access eCourts, verify GST/PAN, DigiLocker documents, and eSign services
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="eCourts" icon={<GavelIcon />} />
          <Tab label="GST Verification" icon={<BusinessIcon />} />
          <Tab label="PAN Verification" icon={<BadgeIcon />} />
          <Tab label="DigiLocker" icon={<CloudUploadIcon />} />
          <Tab label="eSign" icon={<DescriptionIcon />} />
        </Tabs>
      </Paper>

      {/* eCourts Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Search by CNR Number
                </Typography>
                <TextField
                  fullWidth
                  label="CNR Number"
                  value={cnrNumber}
                  onChange={(e) => setCnrNumber(e.target.value)}
                  margin="normal"
                />
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSearchCNR}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                  sx={{ mt: 2 }}
                >
                  Search
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Get Case Status
                </Typography>
                <TextField
                  fullWidth
                  label="Case Number"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  margin="normal"
                />
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleGetCaseStatus}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  Get Status
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Cause List
                </Typography>
                <TextField
                  fullWidth
                  label="Court ID"
                  value={courtId}
                  onChange={(e) => setCourtId(e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={hearingDate}
                  onChange={(e) => setHearingDate(e.target.value)}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleGetCauseList}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  Get Cause List
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {searchResults && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Search Results
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {JSON.stringify(searchResults, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* GST Verification Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Verify GST Number
                </Typography>
                <TextField
                  fullWidth
                  label="GSTIN"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="e.g., 27AABCU9603R1ZM"
                  margin="normal"
                />
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleVerifyGST}
                  disabled={loading}
                  startIcon={<VerifiedUserIcon />}
                  sx={{ mt: 2 }}
                >
                  Verify GST
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {verificationResults && verificationResults.type === 'GST' && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Verification Results
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box>
                    <Typography variant="body2"><strong>GSTIN:</strong> {verificationResults.data.gstin}</Typography>
                    <Typography variant="body2"><strong>Status:</strong> {verificationResults.data.status}</Typography>
                    <Typography variant="body2"><strong>Trade Name:</strong> {verificationResults.data.trade_name}</Typography>
                    <Typography variant="body2"><strong>Legal Name:</strong> {verificationResults.data.legal_name}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* PAN Verification Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Verify PAN Number
                </Typography>
                <TextField
                  fullWidth
                  label="PAN Number"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  placeholder="e.g., ABCDE1234F"
                  margin="normal"
                />
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleVerifyPAN}
                  disabled={loading}
                  startIcon={<VerifiedUserIcon />}
                  sx={{ mt: 2 }}
                >
                  Verify PAN
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {verificationResults && verificationResults.type === 'PAN' && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Verification Results
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box>
                    <Typography variant="body2"><strong>PAN:</strong> {verificationResults.data.pan}</Typography>
                    <Typography variant="body2"><strong>Name:</strong> {verificationResults.data.name}</Typography>
                    <Typography variant="body2"><strong>Status:</strong> {verificationResults.data.status}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* DigiLocker Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Verify Document
                </Typography>
                <TextField
                  fullWidth
                  label="Document Type"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  placeholder="e.g., aadhaar, driving_license"
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Document Number"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  margin="normal"
                />
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleVerifyDocument}
                  disabled={loading}
                  startIcon={<VerifiedUserIcon />}
                  sx={{ mt: 2 }}
                >
                  Verify Document
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Fetch Document
                </Typography>
                <TextField
                  fullWidth
                  label="Document Type"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Client Aadhaar"
                  value={clientAadhaar}
                  onChange={(e) => setClientAadhaar(e.target.value)}
                  margin="normal"
                />
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleFetchDocument}
                  disabled={loading}
                  startIcon={<CloudUploadIcon />}
                  sx={{ mt: 2 }}
                >
                  Fetch Document
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {verificationResults && verificationResults.type.includes('DigiLocker') && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Results
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {JSON.stringify(verificationResults.data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* eSign Tab */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Create eSign Request
                </Typography>
                <TextField
                  fullWidth
                  label="Document Data"
                  value={esignData.document}
                  onChange={(e) => setEsignData({ ...esignData, document: e.target.value })}
                  multiline
                  rows={4}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Signer Aadhaar"
                  value={esignData.signerAadhaar}
                  onChange={(e) => setEsignData({ ...esignData, signerAadhaar: e.target.value })}
                  margin="normal"
                />
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleCreateEsign}
                  disabled={loading}
                  startIcon={<DescriptionIcon />}
                  sx={{ mt: 2 }}
                >
                  Create eSign Request
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {verificationResults && verificationResults.type === 'eSign' && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    eSign Request Created
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box>
                    <Typography variant="body2"><strong>Request ID:</strong> {verificationResults.data.request_id}</Typography>
                    <Typography variant="body2"><strong>Status:</strong> {verificationResults.data.status}</Typography>
                    <Chip label={verificationResults.data.status} color={verificationResults.data.status === 'completed' ? 'success' : 'warning'} sx={{ mt: 2 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}

export default LegalData;

