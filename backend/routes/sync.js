const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const {
  syncClientToUser,
  syncUserToClient,
  syncAllClients,
  syncAllUsers,
  getSyncStatus
} = require('../utils/clientUserSync');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get sync status
router.get('/status', authorize('admin'), async (req, res) => {
  try {
    const status = await getSyncStatus(req.tenantId);
    res.json(status);
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync specific client to user
router.post('/client/:id', authorize('admin'), async (req, res) => {
  try {
    const result = await syncClientToUser(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Sync client error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync all clients to users
router.post('/clients', authorize('admin'), async (req, res) => {
  try {
    const result = await syncAllClients();
    res.json(result);
  } catch (error) {
    console.error('Sync all clients error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync all client users to clients table
router.post('/users', authorize('admin'), async (req, res) => {
  try {
    const result = await syncAllUsers();
    res.json(result);
  } catch (error) {
    console.error('Sync all users error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

