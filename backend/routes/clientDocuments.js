const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/client-documents/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'client-' + req.user.userId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPG, PNG, or TXT files are allowed'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

// Get client's own documents
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

    // Get documents for cases involving this client
    const [documents] = await pool.execute(
      `SELECT cd.*, c.case_number, c.subject
       FROM case_documents cd
       JOIN cases c ON cd.case_id = c.id
       WHERE c.client_id = ?
       ORDER BY cd.created_at DESC`,
      [clientId]
    );

    res.json({ documents });
  } catch (error) {
    console.error('Get client documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload document for case (client upload)
router.post('/upload', authorize('client'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { case_id, title, document_type, description } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!case_id || !title) {
      return res.status(400).json({ error: 'Case ID and title are required' });
    }

    // Verify the case belongs to the client
    const [clients] = await pool.execute(
      'SELECT id FROM clients WHERE user_id = ?',
      [userId]
    );

    console.log('Finding client for userId:', userId);
    console.log('Clients found:', clients);

    if (clients.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const clientId = clients[0].id;
    console.log('Client ID:', clientId);

    // Verify case belongs to this client
    const [cases] = await pool.execute(
      'SELECT id, case_number, subject FROM cases WHERE id = ? AND client_id = ?',
      [case_id, clientId]
    );

    console.log('Verifying case:', { case_id, clientId });
    console.log('Cases found:', cases);

    if (cases.length === 0) {
      return res.status(403).json({ 
        error: 'Case not found or access denied',
        details: `Case ${case_id} does not belong to client ${clientId}`
      });
    }

    // Insert document record
    await pool.execute(
      `INSERT INTO case_documents (case_id, title, document_type, description, file_path, uploaded_by, uploaded_by_client)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [case_id, title, document_type || 'client_upload', description || '', 
       req.file.path, userId, true]
    );

    res.json({ 
      message: 'Document uploaded successfully',
      file: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload document' });
  }
});

module.exports = router;

