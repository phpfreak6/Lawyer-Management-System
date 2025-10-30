import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Grid, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Chip, IconButton, FormControl, InputLabel, Select, MenuItem,
  Tabs, Tab, List, ListItem, ListItemText, Avatar, Alert,
  Divider
} from '@mui/material';
import {
  Add, Edit, Delete, Today, CalendarToday, Event,
  Sync, CloudDone, Refresh
} from '@mui/icons-material';
import api from '../utils/api';
import { useSnackbar } from 'notistack';

function Calendar() {
  const [events, setEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, eventId: null });
  const [cases, setCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    case_id: '',
    title: '',
    description: '',
    event_type: '',
    start_datetime: '',
    end_datetime: '',
    location: '',
    reminder_minutes: 30
  });
  const [tabValue, setTabValue] = useState(0);
  const [syncStatus, setSyncStatus] = useState({ google: false, outlook: false });
  
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchEvents();
    fetchUpcomingEvents();
    fetchCases();
    fetchUsers();
    // Check Google connection status
    (async () => {
      try {
        const { data } = await api.get('/api/calendar/google/status');
        setSyncStatus((s) => ({ ...s, google: !!data.connected }));
      } catch (_) {}
    })();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/calendar');
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
      enqueueSnackbar('Failed to fetch calendar events', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const response = await api.get('/api/calendar/upcoming?days=7');
      setUpcomingEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    }
  };

  const fetchCases = async () => {
    try {
      const response = await api.get('/api/cases');
      setCases(response.data.cases);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/auth/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleOpenDialog = (event = null) => {
    if (event) {
      setEditingEvent(event);
      const startDate = event.start_datetime ? new Date(event.start_datetime).toISOString().slice(0, 16) : '';
      const endDate = event.end_datetime ? new Date(event.end_datetime).toISOString().slice(0, 16) : '';
      
      setFormData({
        case_id: event.case_id || '',
        title: event.title || '',
        description: event.description || '',
        event_type: event.event_type || '',
        start_datetime: startDate,
        end_datetime: endDate,
        location: event.location || '',
        reminder_minutes: event.reminder_minutes || 30
      });
    } else {
      setEditingEvent(null);
      setFormData({
        case_id: '',
        title: '',
        description: '',
        event_type: '',
        start_datetime: '',
        end_datetime: '',
        location: '',
        reminder_minutes: 30
      });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.start_datetime) {
      enqueueSnackbar('Title and start date are required', { variant: 'error' });
      return;
    }

    try {
      if (editingEvent) {
        await api.put(`/api/calendar/${editingEvent.id}`, formData);
        enqueueSnackbar('Event updated successfully', { variant: 'success' });
      } else {
        await api.post('/api/calendar', formData);
        enqueueSnackbar('Event created successfully', { variant: 'success' });
      }
      fetchEvents();
      fetchUpcomingEvents();
      setOpenDialog(false);
    } catch (error) {
      enqueueSnackbar(error.response?.data?.error || 'Failed to save event', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/calendar/${deleteDialog.eventId}`);
      enqueueSnackbar('Event deleted successfully', { variant: 'success' });
      fetchEvents();
      fetchUpcomingEvents();
      setDeleteDialog({ open: false, eventId: null });
    } catch (error) {
      enqueueSnackbar('Failed to delete event', { variant: 'error' });
      setDeleteDialog({ open: false, eventId: null });
    }
  };

  const handleSync = async (provider) => {
    try {
      if (provider === 'google') {
        // Start OAuth: get consent URL
        const { data } = await api.get('/api/calendar/google/auth');
        if (data.url) {
          window.location.href = data.url;
        } else {
          enqueueSnackbar('Google OAuth not configured', { variant: 'warning' });
        }
      } else if (provider === 'outlook') {
        // This would typically open OAuth flow
        enqueueSnackbar('Outlook Calendar sync requires OAuth setup', { variant: 'info' });
      }
    } catch (error) {
      enqueueSnackbar('Failed to sync calendar', { variant: 'error' });
    }
  };

  const getEventTypeColor = (type) => {
    const colors = {
      hearing: 'error',
      deadline: 'warning',
      meeting: 'info',
      filing: 'secondary'
    };
    return colors[type] || 'default';
  };

  const getEventsByType = (type) => {
    return events.filter(e => e.event_type === type);
  };

  const isUpcoming = (event) => {
    return new Date(event.start_datetime) > new Date();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Calendar</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Sync />}
            onClick={() => fetchEvents()}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            New Event
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Events</Typography>
              <Typography variant="h4">{events.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Upcoming</Typography>
              <Typography variant="h4">{events.filter(e => isUpcoming(e)).length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Hearings</Typography>
              <Typography variant="h4">{getEventsByType('hearing').length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Deadlines</Typography>
              <Typography variant="h4">{getEventsByType('deadline').length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Calendar Sync Status */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Calendar Integration</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarToday color={syncStatus.google ? 'success' : 'disabled'} />
              <Typography variant="body1">Google Calendar</Typography>
              <Chip 
                label={syncStatus.google ? 'Connected' : 'Not Connected'} 
                color={syncStatus.google ? 'success' : 'default'}
                size="small"
              />
          {syncStatus.google ? (
            <Button
              size="small"
              variant="outlined"
              onClick={async () => {
                try {
                  await api.post('/api/calendar/google/sync');
                  enqueueSnackbar('Google Calendar synced', { variant: 'success' });
                } catch (e) {
                  enqueueSnackbar(e.response?.data?.error || 'Sync failed', { variant: 'error' });
                }
              }}
              startIcon={<CloudDone />}
            >
              Sync
            </Button>
          ) : (
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleSync('google')}
              startIcon={<CloudDone />}
            >
              Connect
            </Button>
          )}
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarToday color={syncStatus.outlook ? 'success' : 'disabled'} />
              <Typography variant="body1">Microsoft Outlook</Typography>
              <Chip 
                label={syncStatus.outlook ? 'Connected' : 'Not Connected'} 
                color={syncStatus.outlook ? 'success' : 'default'}
                size="small"
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleSync('outlook')}
                startIcon={<CloudDone />}
              >
                Sync
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ p: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="All Events" />
          <Tab label="Upcoming Events" />
          <Tab label="Hearings" />
        </Tabs>

        {/* All Events */}
        {tabValue === 0 && (
          <Box sx={{ mt: 2 }}>
            <List>
              {events.map((event, index) => (
                <React.Fragment key={event.id}>
                  <ListItem
                    secondaryAction={
                      <Box>
                        <IconButton onClick={() => handleOpenDialog(event)}>
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => setDeleteDialog({ open: true, eventId: event.id })}>
                          <Delete />
                        </IconButton>
                      </Box>
                    }
                  >
                    <Avatar sx={{ mr: 2, bgcolor: `${getEventTypeColor(event.event_type)}.main` }}>
                      <Event />
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">{event.title}</Typography>
                          <Chip 
                            label={event.event_type} 
                            size="small" 
                            color={getEventTypeColor(event.event_type)} 
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {new Date(event.start_datetime).toLocaleString()} - {event.location}
                          </Typography>
                          {event.description && (
                            <Typography variant="body2">{event.description}</Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < events.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {events.length === 0 && (
                <Typography color="textSecondary" sx={{ p: 3, textAlign: 'center' }}>
                  No events scheduled
                </Typography>
              )}
            </List>
          </Box>
        )}

        {/* Upcoming Events */}
        {tabValue === 1 && (
          <Box sx={{ mt: 2 }}>
            <List>
              {upcomingEvents.map((event, index) => (
                <React.Fragment key={event.id}>
                  <ListItem>
                    <Avatar sx={{ mr: 2, bgcolor: `${getEventTypeColor(event.event_type)}.main` }}>
                      <Today />
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">{event.title}</Typography>
                          <Chip 
                            label={event.event_type} 
                            size="small" 
                            color={getEventTypeColor(event.event_type)} 
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="textSecondary">
                          {new Date(event.start_datetime).toLocaleString()} - {event.location}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < upcomingEvents.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {upcomingEvents.length === 0 && (
                <Typography color="textSecondary" sx={{ p: 3, textAlign: 'center' }}>
                  No upcoming events
                </Typography>
              )}
            </List>
          </Box>
        )}

        {/* Hearings Only */}
        {tabValue === 2 && (
          <Box sx={{ mt: 2 }}>
            <List>
              {getEventsByType('hearing').map((event, index) => (
                <React.Fragment key={event.id}>
                  <ListItem
                    secondaryAction={
                      <Box>
                        <IconButton onClick={() => handleOpenDialog(event)}>
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => setDeleteDialog({ open: true, eventId: event.id })}>
                          <Delete />
                        </IconButton>
                      </Box>
                    }
                  >
                    <Avatar sx={{ mr: 2, bgcolor: 'error.main' }}>
                      <Event />
                    </Avatar>
                    <ListItemText
                      primary={event.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {new Date(event.start_datetime).toLocaleString()} - {event.location}
                          </Typography>
                          {event.case_number && (
                            <Typography variant="body2">Case: {event.case_number}</Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < getEventsByType('hearing').length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {getEventsByType('hearing').length === 0 && (
                <Typography color="textSecondary" sx={{ p: 3, textAlign: 'center' }}>
                  No hearings scheduled
                </Typography>
              )}
            </List>
          </Box>
        )}
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title *"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Case</InputLabel>
                  <Select
                    value={formData.case_id}
                    onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
                    label="Case"
                  >
                    <MenuItem value="">None</MenuItem>
                    {cases.map((caseItem) => (
                      <MenuItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.case_number} - {caseItem.subject}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Event Type</InputLabel>
                  <Select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    label="Event Type"
                  >
                    <MenuItem value="hearing">Hearing</MenuItem>
                    <MenuItem value="deadline">Deadline</MenuItem>
                    <MenuItem value="meeting">Meeting</MenuItem>
                    <MenuItem value="filing">Filing</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date & Time *"
                  type="datetime-local"
                  value={formData.start_datetime}
                  onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date & Time"
                  type="datetime-local"
                  value={formData.end_datetime}
                  onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reminder (minutes before)"
                  type="number"
                  value={formData.reminder_minutes}
                  onChange={(e) => setFormData({ ...formData, reminder_minutes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingEvent ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, eventId: null })}>
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Are you sure you want to delete this event? This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, eventId: null })}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Calendar;
