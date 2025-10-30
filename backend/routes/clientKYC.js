const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Configure multer for KYC document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/kyc/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'kyc-' + req.user.userId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, or PNG files are allowed for KYC'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

// Upload KYC document (client upload)
router.post('/upload', authorize('client'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { document_type, document_number, description } = req.body;
    const userId = req.user.userId;

    if (!document_type) {
      return res.status(400).json({ error: 'Document type is required' });
    }

    // Find client by user_id
    const [clients] = await pool.execute(
      'SELECT id FROM clients WHERE user_id = ?',
      [userId]
    );

    if (clients.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const clientId = clients[0].id;

    // Insert KYC document record
    await pool.execute(
      `INSERT INTO kyc_documents (client_id, document_type, document_number, file_path, description, uploaded_by, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clientId, document_type, document_number || null, req.file.path, 
       description || '', userId, false]
    );

    res.json({ 
      message: 'KYC document uploaded successfully',
      file: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload KYC document error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload KYC document' });
  }
});

// Get client's KYC documents
router.get('/documents', authorize('client'), async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    // Find client by user_id
    const [clients] = await pool.execute(
      'SELECT id FROM clients WHERE user_id = ?',
      [userId]
    );

    if (clients.length === 0) {
      return res.json({ documents: [] });
    }

    const clientId = clients[0].id;

    // Get KYC documents for this client
    const [documents] = await pool.execute(
      `SELECT * FROM kyc_documents 
       WHERE client_id = ?
       ORDER BY created_at DESC`,
      [clientId]
    );

    res.json({ documents });
  } catch (error) {
    console.error('Get KYC documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

