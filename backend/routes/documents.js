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
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 },
  fileFilter: (req, file, cb) => {
    // Accept all file types for legal documents
    cb(null, true);
  }
});

// All routes require authentication
router.use(authenticate);

// Upload document for a case
router.post('/case/:case_id', authorize('admin', 'lawyer', 'paralegal'), upload.single('file'), async (req, res) => {
  try {
    const { case_id } = req.params;
    const { document_type, title, description, tags } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path.replace(/\\/g, '/');

    // Get case to verify it belongs to tenant
    const [cases] = await pool.execute(
      'SELECT id FROM cases WHERE id = ? AND tenant_id = ?',
      [case_id, req.tenantId]
    );

    if (cases.length === 0) {
      fs.unlinkSync(req.file.path); // Delete uploaded file
      return res.status(404).json({ error: 'Case not found' });
    }

    await pool.execute(
      `INSERT INTO case_documents (
        case_id, document_type, title, description, file_path,
        file_size, mime_type, uploaded_by, tags
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [case_id, document_type, title, description, filePath,
       req.file.size, req.file.mimetype, req.user.userId,
       tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : JSON.stringify([])]
    );

    const [documents] = await pool.execute('SELECT * FROM case_documents ORDER BY id DESC LIMIT 1');

    res.status(201).json({
      document: documents[0],
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('Upload document error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download document
router.get('/:id/download', async (req, res) => {
  try {
    console.log('Download request for document ID:', req.params.id);
    console.log('Tenant ID:', req.tenantId);
    
    const [documents] = await pool.execute(
      'SELECT * FROM case_documents WHERE id = ?',
      [req.params.id]
    );

    if (documents.length === 0) {
      console.log('Document not found in database');
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documents[0];
    console.log('Document found:', document.title);
    console.log('File path:', document.file_path);

    // Verify document belongs to a case that belongs to tenant
    const [cases] = await pool.execute(
      'SELECT tenant_id FROM cases WHERE id = ?',
      [document.case_id]
    );

    console.log('Case tenant ID:', cases.length > 0 ? cases[0].tenant_id : 'N/A');

    if (cases.length === 0 || cases[0].tenant_id !== req.tenantId) {
      console.log('Access denied - tenant mismatch');
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(document.file_path)) {
      console.log('File not found at path:', document.file_path);
      return res.status(404).json({ error: 'File not found on server' });
    }

    console.log('Sending file for download...');
    
    // Get file extension from the original stored file path
    const path = require('path');
    const storedFilePath = document.file_path;
    const originalExt = path.extname(storedFilePath);
    
    // Create filename: title + original extension
    const downloadFilename = (document.title || 'document') + originalExt;
    
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
    console.error('Download document error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Search documents by OCR text
router.get('/search', async (req, res) => {
  try {
    const { q, case_id } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    let query = `
      SELECT cd.*, c.case_number, c.subject as case_subject
      FROM case_documents cd
      JOIN cases c ON cd.case_id = c.id
      WHERE c.tenant_id = ?
      AND (
        cd.title LIKE ? 
        OR cd.description LIKE ? 
        OR cd.extracted_text LIKE ?
        OR JSON_SEARCH(cd.tags, 'one', ?) IS NOT NULL
      )
    `;

    const params = [req.tenantId, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`];
    
    if (case_id) {
      query += ' AND cd.case_id = ?';
      params.push(case_id);
    }

    query += ' ORDER BY cd.created_at DESC';

    const [documents] = await pool.execute(query, params);
    res.json({ documents, count: documents.length });
  } catch (error) {
    console.error('Search documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process document with OCR
router.post('/:id/process-ocr', authorize('admin', 'lawyer'), async (req, res) => {
  try {
    const [documents] = await pool.execute(
      'SELECT * FROM case_documents WHERE id = ?',
      [req.params.id]
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documents[0];

    // Verify document belongs to tenant
    const [cases] = await pool.execute(
      'SELECT tenant_id FROM cases WHERE id = ?',
      [document.case_id]
    );

    if (cases.length === 0 || cases[0].tenant_id !== req.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Process OCR
    const ocrService = require('../services/ocrService');
    let extractedText = '';

    if (document.mime_type === 'application/pdf') {
      extractedText = await ocrService.extractTextFromPDF(document.file_path);
    } else if (document.mime_type.startsWith('image/')) {
      extractedText = await ocrService.extractText(document.file_path);
    }

    // Update document with extracted text
    await pool.execute(
      'UPDATE case_documents SET extracted_text = ?, ocr_processed = true WHERE id = ?',
      [extractedText, req.params.id]
    );

    res.json({ 
      message: 'Document processed successfully',
      extracted_text_length: extractedText.length 
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete document
router.delete('/:id', authorize('admin', 'lawyer'), async (req, res) => {
  try {
    const [documents] = await pool.execute(
      'SELECT * FROM case_documents WHERE id = ?',
      [req.params.id]
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documents[0];

    // Verify document belongs to tenant
    const [cases] = await pool.execute(
      'SELECT tenant_id FROM cases WHERE id = ?',
      [document.case_id]
    );

    if (cases.length === 0 || cases[0].tenant_id !== req.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    await pool.execute('DELETE FROM case_documents WHERE id = ?', [req.params.id]);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
