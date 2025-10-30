const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

// Import routes
const authRoutes = require('./routes/auth');
const caseRoutes = require('./routes/cases');
const clientRoutes = require('./routes/clients');
const taskRoutes = require('./routes/tasks');
const documentRoutes = require('./routes/documents');
const billingRoutes = require('./routes/billing');
const paymentRoutes = require('./routes/payments');
const calendarRoutes = require('./routes/calendar');
const kycRoutes = require('./routes/kyc');
const communicationRoutes = require('./routes/communications');
const esignatureRoutes = require('./routes/esignature');
const legalDataRoutes = require('./routes/legalData');
const legalDataAttachmentRoutes = require('./routes/legalDataAttachment');
const clientPortalRoutes = require('./routes/clientPortal');
const clientDocumentsRoutes = require('./routes/clientDocuments');
const clientKYCRoutes = require('./routes/clientKYC');
const syncRoutes = require('./routes/sync');
const myCasesRoutes = require('./routes/myCases');
const tenantsRoutes = require('./routes/tenants');
const usersRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const remindersRoutes = require('./routes/reminders');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Lawyer Management System API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes); // Also expose auth routes at /api/users
app.use('/api/cases', caseRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/esignature', esignatureRoutes);
app.use('/api/legal-data', legalDataRoutes);
app.use('/api/legal-data', legalDataAttachmentRoutes);
app.use('/api/clients/me', clientPortalRoutes);
app.use('/api/documents/client', clientDocumentsRoutes);
app.use('/api/kyc/client', clientKYCRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/my-cases', myCasesRoutes);
app.use('/api/tenants', tenantsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reminders', remindersRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

