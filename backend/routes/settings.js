const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Get tenant reminder settings
router.get('/reminders', async (req, res) => {
  try {
    // Ensure whatsapp_enabled column exists (in case migration hasn't run)
    try {
      const [cols] = await pool.execute(
        `SELECT COUNT(*) AS cnt
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'tenant_settings'
           AND COLUMN_NAME = 'whatsapp_enabled'`
      );
      if ((cols[0]?.cnt || 0) === 0) {
        try {
          await pool.execute(
            `ALTER TABLE tenant_settings ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT false AFTER sms_enabled`
          );
        } catch (_) {}
      }
    } catch (_) {}

    const [rows] = await pool.execute(
      'SELECT hearing_reminder_minutes, filing_reminder_minutes, task_reminder_minutes, email_enabled, sms_enabled, COALESCE(whatsapp_enabled, false) AS whatsapp_enabled FROM tenant_settings WHERE tenant_id = ? LIMIT 1',
      [req.tenantId]
    );
    if (rows.length === 0) {
      return res.json({
        hearing_reminder_minutes: 60,
        filing_reminder_minutes: 60,
        task_reminder_minutes: 60,
        email_enabled: true,
        sms_enabled: false,
        whatsapp_enabled: false
      });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Get reminder settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update tenant reminder settings (upsert)
router.put('/reminders', async (req, res) => {
  try {
    // Fallback if tenantId not set by middleware
    const tenantId = req.tenantId || req.user?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context missing' });
    }

    // Ensure table exists (in case migration not yet applied)
    await pool.execute(`CREATE TABLE IF NOT EXISTS tenant_settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      tenant_id INT NOT NULL,
      hearing_reminder_minutes INT DEFAULT 60,
      filing_reminder_minutes INT DEFAULT 60,
      task_reminder_minutes INT DEFAULT 60,
      email_enabled BOOLEAN DEFAULT true,
      sms_enabled BOOLEAN DEFAULT false,
      whatsapp_enabled BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_tenant_settings (tenant_id)
    )`);

    // Attempt to add whatsapp_enabled if table exists without it
    try {
      await pool.execute('ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT false AFTER sms_enabled');
    } catch (_) {}

    const { hearing_reminder_minutes = 60, filing_reminder_minutes = 60, task_reminder_minutes = 60, email_enabled = true, sms_enabled = false, whatsapp_enabled = false } = req.body;
    await pool.execute(
      `INSERT INTO tenant_settings (tenant_id, hearing_reminder_minutes, filing_reminder_minutes, task_reminder_minutes, email_enabled, sms_enabled, whatsapp_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         hearing_reminder_minutes = VALUES(hearing_reminder_minutes),
         filing_reminder_minutes = VALUES(filing_reminder_minutes),
         task_reminder_minutes = VALUES(task_reminder_minutes),
         email_enabled = VALUES(email_enabled),
         sms_enabled = VALUES(sms_enabled),
         whatsapp_enabled = VALUES(whatsapp_enabled)`,
      [tenantId, hearing_reminder_minutes, filing_reminder_minutes, task_reminder_minutes, email_enabled, sms_enabled, whatsapp_enabled]
    );
    res.json({ message: 'Reminder settings updated' });
  } catch (error) {
    console.error('Update reminder settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


