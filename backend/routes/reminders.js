const express = require('express');
const { authenticate } = require('../middleware/auth');
const { checkAndSendReminders } = require('../services/reminders');
const router = express.Router();

router.use(authenticate);

// Trigger reminders manually (admin use)
router.post('/run', async (req, res) => {
  try {
    await checkAndSendReminders();
    res.json({ message: 'Reminders executed' });
  } catch (error) {
    console.error('Run reminders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


