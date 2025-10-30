const cron = require('node-cron');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const pool = require('../config/database');
// Ensure required tables exist (for environments where migrations haven't been run)
async function ensureRemindersTables() {
  try {
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

    // Try adding whatsapp_enabled if the table already exists without it
    try {
      await pool.execute('ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT false AFTER sms_enabled');
    } catch (_) {}

    await pool.execute(`CREATE TABLE IF NOT EXISTS reminders_log (
      id INT PRIMARY KEY AUTO_INCREMENT,
      tenant_id INT NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id INT NOT NULL,
      recipient VARCHAR(255) NOT NULL,
      channel VARCHAR(20) NOT NULL,
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_reminder (tenant_id, entity_type, entity_id, recipient, channel),
      INDEX idx_tenant_time (tenant_id, sent_at)
    )`);
  } catch (err) {
    console.error('Failed ensuring reminders tables:', err.message);
  }
}

// Run ensure once at startup
ensureRemindersTables();


// Email transporter (configure with your SMTP settings)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Twilio client (configure with your credentials)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Send email reminder
async function sendEmailReminder(to, subject, message) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: message,
      html: `<p>${message}</p>`
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Send SMS reminder
async function sendSMSReminder(to, message) {
  if (!twilioClient) {
    console.warn('Twilio not configured');
    return;
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    console.log(`SMS sent to ${to}`);
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
}

// Send WhatsApp reminder via Twilio WhatsApp
async function sendWhatsAppReminder(to, message) {

  if (!twilioClient) {
    console.warn('Twilio not configured');
    return;
  }

  const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM; // e.g., 'whatsapp:+14155238886'
  if (!fromWhatsApp) {
    console.warn('TWILIO_WHATSAPP_FROM not set');
    return;
  }

  const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  try {
    await twilioClient.messages.create({
      body: message,
      from: fromWhatsApp,
      to: toWhatsApp
    });
    console.log(`WhatsApp sent to ${to}`);
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
  }
}

async function getTenantSettings(tenantId) {
  const [rows] = await pool.execute(
    `SELECT * FROM tenant_settings WHERE tenant_id = ?`,
    [tenantId]
  );
  if (rows.length > 0) return rows[0];
  return {
    hearing_reminder_minutes: 60,
    filing_reminder_minutes: 60,
    task_reminder_minutes: 60,
    email_enabled: true,
    sms_enabled: false,
    whatsapp_enabled: false
  };
}

async function alreadySent(tenantId, entityType, entityId, recipient, channel) {
  const [rows] = await pool.execute(
    `SELECT id FROM reminders_log WHERE tenant_id = ? AND entity_type = ? AND entity_id = ? AND recipient = ? AND channel = ? LIMIT 1`,
    [tenantId, entityType, entityId, recipient, channel]
  );
  return rows.length > 0;
}

async function logSent(tenantId, entityType, entityId, recipient, channel) {
  try {
    await pool.execute(
      `INSERT INTO reminders_log (tenant_id, entity_type, entity_id, recipient, channel)
       VALUES (?, ?, ?, ?, ?)`,
      [tenantId, entityType, entityId, recipient, channel]
    );
  } catch (_) {}
}

// Check for upcoming hearings, filings and tasks
async function checkAndSendReminders() {
  try {
    await ensureRemindersTables();
    // Get upcoming hearings and filings per-tenant using settings
    const [tenants] = await pool.execute('SELECT id FROM tenants');
    for (const t of tenants) {
      const settings = await getTenantSettings(t.id);
      

      // Hearings
      const [hearings] = await pool.execute(
        `SELECT ce.*,c.client_id, c.case_number, cl.first_name, cl.last_name, cl.phone, cl.email
         FROM calendar_events ce
         LEFT JOIN cases c ON ce.case_id = c.id
         LEFT JOIN clients cl ON c.client_id = cl.id
         WHERE c.tenant_id = ?
         AND ce.event_type = 'hearing'
         AND ce.start_datetime BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? MINUTE)`,
        [t.id, settings.hearing_reminder_minutes]
      );

    // console.log('Hearings:', hearings);


     

      for (const hearing of hearings) {
        if (settings.email_enabled && hearing.email && !(await alreadySent(t.id, 'hearing', hearing.id, hearing.email, 'email'))) {
          await sendEmailReminder(
            hearing.email,
            `Upcoming Hearing: ${hearing.title}`,
            `You have a hearing scheduled for ${hearing.start_datetime} for case ${hearing.case_number}.`
          );
          await logSent(t.id, 'hearing', hearing.id, hearing.email, 'email');
        }

        if (settings.sms_enabled && hearing.phone && !(await alreadySent(t.id, 'hearing', hearing.id, hearing.phone, 'sms'))) {
          await sendSMSReminder(
            hearing.phone,
            `Reminder: Hearing scheduled for ${hearing.start_datetime} for case ${hearing.case_number}`
          );
          await logSent(t.id, 'hearing', hearing.id, hearing.phone, 'sms');
        }
        if (settings.whatsapp_enabled && hearing.phone && !(await alreadySent(t.id, 'hearing', hearing.id, hearing.phone, 'whatsapp'))) {
          console.log('Sending WhatsApp reminder to:', hearing.phone);
          await sendWhatsAppReminder(
            hearing.phone,
            `Reminder: Hearing scheduled for ${hearing.start_datetime} for case ${hearing.case_number}`
          );
          await logSent(t.id, 'hearing', hearing.id, hearing.phone, 'whatsapp');
        }
      }

      // Filings
      const [filings] = await pool.execute(
        `SELECT ce.*, c.case_number, cl.first_name, cl.last_name, cl.phone, cl.email
         FROM calendar_events ce
         LEFT JOIN cases c ON ce.case_id = c.id
         LEFT JOIN clients cl ON c.client_id = cl.id
         WHERE ce.event_type = 'filing'
         AND c.tenant_id = ?
         AND ce.start_datetime BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? MINUTE)`,
        [t.id, settings.filing_reminder_minutes]
      );
      for (const filing of filings) {
        if (settings.email_enabled && filing.email && !(await alreadySent(t.id, 'filing', filing.id, filing.email, 'email'))) {
          await sendEmailReminder(
            filing.email,
            `Upcoming Filing: ${filing.title}`,
            `You have a filing scheduled for ${filing.start_datetime} for case ${filing.case_number}.`
          );
          await logSent(t.id, 'filing', filing.id, filing.email, 'email');
        }
        if (settings.sms_enabled && filing.phone && !(await alreadySent(t.id, 'filing', filing.id, filing.phone, 'sms'))) {
          await sendSMSReminder(
            filing.phone,
            `Reminder: Filing scheduled for ${filing.start_datetime} for case ${filing.case_number}`
          );
          await logSent(t.id, 'filing', filing.id, filing.phone, 'sms');
        }
        if (settings.whatsapp_enabled && filing.phone && !(await alreadySent(t.id, 'filing', filing.id, filing.phone, 'whatsapp'))) {
          await sendWhatsAppReminder(
            filing.phone,
            `Reminder: Filing scheduled for ${filing.start_datetime} for case ${filing.case_number}`
          );
          await logSent(t.id, 'filing', filing.id, filing.phone, 'whatsapp');
        }
      }

      // Tasks
      const [tasks] = await pool.execute(
        `SELECT t.*, u.email, u.first_name, u.last_name
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.id
         WHERE t.status = 'pending'
         AND t.tenant_id = ?
         AND t.due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? MINUTE)`,
        [t.id, settings.task_reminder_minutes]
      );
      for (const task of tasks) {
        if (settings.email_enabled && task.email && !(await alreadySent(t.id, 'task', task.id, task.email, 'email'))) {
          await sendEmailReminder(
            task.email,
            `Task Due: ${task.title}`,
            `You have a task due: ${task.title}. Due date: ${task.due_date}.`
          );
          await logSent(t.id, 'task', task.id, task.email, 'email');
        }
      }

      // KYC renewals (keep weekly window)
      const [kycRenewals] = await pool.execute(
        `SELECT kyc.*, cl.first_name, cl.last_name, cl.email, cl.phone
         FROM kyc_documents kyc
         JOIN clients cl ON kyc.client_id = cl.id
         WHERE cl.tenant_id = ?
         AND kyc.renewal_reminder_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
         AND kyc.is_verified = true`,
        [t.id]
      );
      for (const kyc of kycRenewals) {
        if (settings.email_enabled && kyc.email && !(await alreadySent(t.id, 'kyc', kyc.id, kyc.email, 'email'))) {
          await sendEmailReminder(
            kyc.email,
            `KYC Document Renewal Due: ${kyc.document_type}`,
            `Your ${kyc.document_type} (Number: ${kyc.document_number}) is due for renewal on ${kyc.renewal_reminder_date}.`
          );
          await logSent(t.id, 'kyc', kyc.id, kyc.email, 'email');
        }
        if (settings.whatsapp_enabled && kyc.phone && !(await alreadySent(t.id, 'kyc', kyc.id, kyc.phone, 'whatsapp'))) {
          await sendWhatsAppReminder(
            kyc.phone,
            `Reminder: Your ${kyc.document_type} (Number: ${kyc.document_number}) is due for renewal on ${kyc.renewal_reminder_date}.`
          );
          await logSent(t.id, 'kyc', kyc.id, kyc.phone, 'whatsapp');
        }
      }
    }
  } catch (error) {
    console.error('Error in reminder check:', error);
  }
}

// Schedule reminder checks (runs every hour)
if (process.env.ENABLE_REMINDERS === 'true') {
  cron.schedule('0 * * * *', () => {
    console.log('Running reminder checks...');
    checkAndSendReminders();
  });
}

module.exports = {
  sendEmailReminder,
  sendSMSReminder,
  checkAndSendReminders
};

