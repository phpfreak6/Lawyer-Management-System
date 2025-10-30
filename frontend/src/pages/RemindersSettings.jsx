import React, { useEffect, useState } from 'react';
import { Container, Box, Card, CardContent, Typography, TextField, Switch, FormControlLabel, Button, Alert } from '@mui/material';
import api from '../utils/api';

function RemindersSettings() {
  const [form, setForm] = useState({
    hearing_reminder_minutes: 60,
    filing_reminder_minutes: 60,
    task_reminder_minutes: 60,
    email_enabled: true,
    sms_enabled: false,
    whatsapp_enabled: false
  });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [running, setRunning] = useState(false);
  const [created, setCreated] = useState('');
  const [caseIdForTest, setCaseIdForTest] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/api/settings/reminders');
        setForm(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load settings');
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setError('');
    setSaved(false);
    try {
      await api.put('/api/settings/reminders', {
        hearing_reminder_minutes: Number(form.hearing_reminder_minutes) || 0,
        filing_reminder_minutes: Number(form.filing_reminder_minutes) || 0,
        task_reminder_minutes: Number(form.task_reminder_minutes) || 0,
        email_enabled: !!form.email_enabled,
        sms_enabled: !!form.sms_enabled,
        whatsapp_enabled: !!form.whatsapp_enabled
      });
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings');
    }
  };

  const handleRunNow = async () => {
    setError('');
    setRunning(true);
    try {
      await api.post('/api/reminders/run');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to run reminders');
    } finally {
      setRunning(false);
    }
  };

  const handleCreateTestHearing = async () => {
    setError('');
    setCreated('');
    if (!caseIdForTest) {
      setError('Enter a valid Case ID to create a test hearing');
      return;
    }
    try {
      const start = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const { data } = await api.post('/api/calendar', {
        case_id: Number(caseIdForTest),
        event_type: 'hearing',
        title: 'Test Hearing for WhatsApp Reminder',
        start_datetime: start
      });
      setCreated(`Created event #${data.event?.id || ''} at ${data.event?.start_datetime || start}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create test hearing');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Reminder Settings</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {saved && <Alert severity="success" sx={{ mb: 2 }}>Settings saved</Alert>}
            <TextField
              label="Hearing reminder (minutes)"
              type="number"
              fullWidth
              margin="dense"
              value={form.hearing_reminder_minutes}
              onChange={(e) => setForm({ ...form, hearing_reminder_minutes: Number(e.target.value) })}
            />
            <TextField
              label="Filing reminder (minutes)"
              type="number"
              fullWidth
              margin="dense"
              value={form.filing_reminder_minutes}
              onChange={(e) => setForm({ ...form, filing_reminder_minutes: Number(e.target.value) })}
            />
            <TextField
              label="Task reminder (minutes)"
              type="number"
              fullWidth
              margin="dense"
              value={form.task_reminder_minutes}
              onChange={(e) => setForm({ ...form, task_reminder_minutes: Number(e.target.value) })}
            />
            <FormControlLabel
              control={<Switch checked={form.email_enabled} onChange={(e) => setForm({ ...form, email_enabled: e.target.checked })} />}
              label="Email reminders"
            />
            <FormControlLabel
              control={<Switch checked={form.sms_enabled} onChange={(e) => setForm({ ...form, sms_enabled: e.target.checked })} />}
              label="SMS reminders"
            />
            <FormControlLabel
              control={<Switch checked={form.whatsapp_enabled} onChange={(e) => setForm({ ...form, whatsapp_enabled: e.target.checked })} />}
              label="WhatsApp reminders"
            />
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" onClick={handleSave}>Save</Button>
              <Button sx={{ ml: 2 }} variant="outlined" onClick={handleRunNow} disabled={running}>
                {running ? 'Running…' : 'Run Reminders Now'}
              </Button>
            </Box>
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Quick test: create a hearing in 15 minutes
              </Typography>
              <TextField
                label="Case ID"
                type="number"
                fullWidth
                margin="dense"
                value={caseIdForTest}
                onChange={(e) => setCaseIdForTest(e.target.value)}
              />
              <Button sx={{ mt: 1 }} variant="text" onClick={handleCreateTestHearing}>Create Test Hearing</Button>
              {created && <Alert severity="success" sx={{ mt: 1 }}>{created}</Alert>}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default RemindersSettings;


