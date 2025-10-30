const express = require('express');
const multer = require('multer');
const fs = require('fs');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { AdobeSignService, DocuSignService } = require('../services/esignature');
const router = express.Router();

const upload = multer({ dest: 'uploads/temp/' });

// All routes require authentication
router.use(authenticate);

// Create e-signature request (Adobe Sign)
router.post('/adobe/create', authorize('admin', 'lawyer'), upload.single('document'), async (req, res) => {
  try {
    const { document_id, recipient_email, recipient_name } = req.body;

    if (!req.file && !document_id) {
      return res.status(400).json({ error: 'Document or document_id is required' });
    }

    let fileUrl = '';
    let fileName = '';

    if (document_id) {
      // Get existing document from database
      const [documents] = await pool.execute(
        'SELECT * FROM case_documents WHERE id = ?',
        [document_id]
      );

      if (documents.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      fileUrl = req.protocol + '://' + req.get('host') + '/uploads/' + documents[0].file_path;
      fileName = documents[0].title;
    } else {
      // Upload new document
      fileUrl = req.file.path;
      fileName = req.file.originalname;
    }

    const participantSetInfos = [{
      memberInfos: [{
        email: recipient_email,
        name: recipient_name
      }],
      order: 1
    }];

    const agreement = await AdobeSignService.createAgreement(fileUrl, fileName, participantSetInfos);

    // Store e-signature request in database
    await pool.execute(
      `INSERT INTO e_signature_requests (
        tenant_id, document_id, provider, agreement_id, recipient_email,
        recipient_name, status, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.tenantId, document_id || null, 'adobe_sign', agreement.id, recipient_email,
       recipient_name, 'sent', req.user.userId]
    );

    res.json({ agreement, message: 'E-signature request created successfully' });
  } catch (error) {
    console.error('Create e-signature request error:', error);
    res.status(500).json({ error: 'Failed to create e-signature request' });
  }
});

// Create e-signature request (DocuSign)
router.post('/docusign/create', authorize('admin', 'lawyer'), upload.single('document'), async (req, res) => {
  try {
    const { document_id, recipient_email, recipient_name } = req.body;

    if (!req.file && !document_id) {
      return res.status(400).json({ error: 'Document or document_id is required' });
    }

    let fileBytes = Buffer.alloc(0);
    let fileName = '';

    if (document_id) {
      const [documents] = await pool.execute(
        'SELECT * FROM case_documents WHERE id = ?',
        [document_id]
      );

      if (documents.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      fileBytes = fs.readFileSync(documents[0].file_path);
      fileName = documents[0].title;
    } else {
      fileBytes = fs.readFileSync(req.file.path);
      fileName = req.file.originalname;
    }

    const envelope = await DocuSignService.createEnvelope(
      fileBytes,
      fileName,
      recipient_email,
      recipient_name
    );

    // Store e-signature request in database
    await pool.execute(
      `INSERT INTO e_signature_requests (
        tenant_id, document_id, provider, agreement_id, recipient_email,
        recipient_name, status, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.tenantId, document_id || null, 'docusign', envelope.envelopeId, recipient_email,
       recipient_name, 'sent', req.user.userId]
    );

    res.json({ envelope, message: 'E-signature request created successfully' });
  } catch (error) {
    console.error('Create e-signature request error:', error);
    res.status(500).json({ error: 'Failed to create e-signature request' });
  }
});

// Get e-signature status
router.get('/:id/status', async (req, res) => {
  try {
    const [requests] = await pool.execute(
      'SELECT * FROM e_signature_requests WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.tenantId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'E-signature request not found' });
    }

    const request = requests[0];
    let status = {};

    if (request.provider === 'adobe_sign') {
      status = await AdobeSignService.getAgreementStatus(request.agreement_id);
    } else if (request.provider === 'docusign') {
      status = await DocuSignService.getEnvelopeStatus(request.agreement_id);
    }

    res.json({ status, request });
  } catch (error) {
    console.error('Get e-signature status error:', error);
    res.status(500).json({ error: 'Failed to get e-signature status' });
  }
});

module.exports = router;

