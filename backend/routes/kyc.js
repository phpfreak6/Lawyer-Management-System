const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/kyc');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `kyc-${req.params.clientId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 }
});

// All routes require authentication
router.use(authenticate);

// Get KYC documents for a client
router.get('/client/:clientId', async (req, res) => {
  try {
    const [documents] = await pool.execute(
      `SELECT kyc.*, CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name
       FROM kyc_documents kyc
       LEFT JOIN users u ON kyc.uploaded_by = u.id
       JOIN clients cl ON kyc.client_id = cl.id
       WHERE kyc.client_id = ? AND cl.tenant_id = ?
       ORDER BY kyc.created_at DESC`,
      [req.params.clientId, req.tenantId]
    );

    res.json({ documents });
  } catch (error) {
    console.error('Get KYC documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload KYC document
router.post('/client/:clientId', authorize('admin', 'lawyer', 'paralegal'), upload.single('file'), async (req, res) => {
  try {
    const { document_type, document_number, expiry_date, renewal_reminder_date } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify client belongs to tenant
    const [clients] = await pool.execute(
      'SELECT id FROM clients WHERE id = ? AND tenant_id = ?',
      [req.params.clientId, req.tenantId]
    );

    if (clients.length === 0) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Client not found' });
    }

    const filePath = req.file.path.replace(/\\/g, '/');

    // Convert empty strings to null for optional dates
    const expiryDate = expiry_date && expiry_date.trim() !== '' ? expiry_date : null;
    const renewalReminderDate = renewal_reminder_date && renewal_reminder_date.trim() !== '' ? renewal_reminder_date : null;

    console.log('Uploading KYC document with data:', {
      clientId: req.params.clientId,
      document_type,
      document_number,
      filePath,
      expiry_date: expiryDate,
      renewal_reminder_date: renewalReminderDate,
      uploaded_by: req.user.userId
    });

    const [result] = await pool.execute(
      `INSERT INTO kyc_documents (
        client_id, document_type, document_number, file_path,
        expiry_date, renewal_reminder_date, uploaded_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.params.clientId, document_type, document_number, filePath,
       expiryDate, renewalReminderDate, req.user.userId]
    );

    const docId = result.insertId;
    const [documents] = await pool.execute('SELECT * FROM kyc_documents WHERE id = ?', [docId]);

    res.status(201).json({
      document: documents[0],
      message: 'KYC document uploaded successfully'
    });
  } catch (error) {
    console.error('Upload KYC document error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Verify KYC document
router.put('/:id/verify', authorize('admin', 'lawyer'), async (req, res) => {
  try {
    const [documents] = await pool.execute(
      `SELECT kyc.* 
       FROM kyc_documents kyc
       JOIN clients cl ON kyc.client_id = cl.id
       WHERE kyc.id = ? AND cl.tenant_id = ?`,
      [req.params.id, req.tenantId]
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: 'KYC document not found' });
    }

    await pool.execute(
      'UPDATE kyc_documents SET is_verified = true WHERE id = ?',
      [req.params.id]
    );

    const [updatedDocs] = await pool.execute('SELECT * FROM kyc_documents WHERE id = ?', [req.params.id]);

    res.json({ document: updatedDocs[0], message: 'Document verified successfully' });
  } catch (error) {
    console.error('Verify KYC document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle verify/unverify KYC document
router.put('/:id', authorize('admin', 'lawyer'), async (req, res) => {
  try {
    const { is_verified } = req.body;
    
    const [documents] = await pool.execute(
      `SELECT kyc.* 
       FROM kyc_documents kyc
       JOIN clients cl ON kyc.client_id = cl.id
       WHERE kyc.id = ? AND cl.tenant_id = ?`,
      [req.params.id, req.tenantId]
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: 'KYC document not found' });
    }

    await pool.execute(
      'UPDATE kyc_documents SET is_verified = ? WHERE id = ?',
      [is_verified ? 1 : 0, req.params.id]
    );

    const [updatedDocs] = await pool.execute('SELECT * FROM kyc_documents WHERE id = ?', [req.params.id]);

    res.json({ 
      document: updatedDocs[0], 
      message: is_verified ? 'Document verified successfully' : 'Document unverified successfully' 
    });
  } catch (error) {
    console.error('Toggle verify KYC document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download KYC document
router.get('/:id/download', async (req, res) => {
  try {
    console.log('Download request for KYC document ID:', req.params.id);
    console.log('Tenant ID:', req.tenantId);
    
    const [documents] = await pool.execute(
      `SELECT kyc.* 
       FROM kyc_documents kyc
       JOIN clients cl ON kyc.client_id = cl.id
       WHERE kyc.id = ? AND cl.tenant_id = ?`,
      [req.params.id, req.tenantId]
    );

    if (documents.length === 0) {
      console.log('KYC document not found in database');
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documents[0];
    console.log('KYC document found:', document.document_type);
    console.log('File path:', document.file_path);

    if (!fs.existsSync(document.file_path)) {
      console.log('File not found at path:', document.file_path);
      return res.status(404).json({ error: 'File not found on server' });
    }

    console.log('Sending file for download...');
    
    // Get file extension from the original stored file path
    const originalExt = path.extname(document.file_path);
    
    // Create filename: document type + original extension
    const downloadFilename = `${document.document_type}${originalExt}`;
    
    console.log('Downloading with filename:', downloadFilename);
    
    res.download(document.file_path, downloadFilename, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download file' });
        }
      }
    });
  } catch (error) {
    console.error('Download KYC document error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Delete KYC document
router.delete('/:id', authorize('admin', 'lawyer'), async (req, res) => {
  try {
    const [documents] = await pool.execute(
      `SELECT kyc.* 
       FROM kyc_documents kyc
       JOIN clients cl ON kyc.client_id = cl.id
       WHERE kyc.id = ? AND cl.tenant_id = ?`,
      [req.params.id, req.tenantId]
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: 'KYC document not found' });
    }

    // Delete file from filesystem
    if (documents[0].file_path && fs.existsSync(documents[0].file_path)) {
      fs.unlinkSync(documents[0].file_path);
    }

    await pool.execute('DELETE FROM kyc_documents WHERE id = ?', [req.params.id]);

    res.json({ message: 'KYC document deleted successfully' });
  } catch (error) {
    console.error('Delete KYC document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

