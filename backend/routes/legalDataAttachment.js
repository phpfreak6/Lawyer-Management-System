const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../middleware/rbac');
const {
  eCourtsAPI,
  GSTVerificationAPI,
  PANVerificationAPI
} = require('../services/legalApis');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Attach eCourts case data to a case
 * POST /api/legal-data/attach/case/:caseId/ecourts
 */
router.post('/attach/case/:caseId/ecourts', 
  requirePermission(PERMISSIONS.LEGAL_DATA_SEARCH), 
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const { cnr_number } = req.body;

      if (!cnr_number) {
        return res.status(400).json({ error: 'CNR number is required' });
      }

      // Verify case exists
      const [cases] = await pool.execute(
        'SELECT id, case_number, client_id FROM cases WHERE id = ? AND tenant_id = ?',
        [caseId, req.tenantId]
      );

      if (cases.length === 0) {
        return res.status(404).json({ error: 'Case not found' });
      }

      // Fetch data from eCourts API
      const apiResult = await eCourtsAPI.searchCaseByCNR(cnr_number);

      // Store in database
      await pool.execute(
        `INSERT INTO legal_data_searches (
          tenant_id, case_id, search_type, search_query, result_data, searched_by
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.tenantId,
          caseId,
          'ecourts_cnr',
          cnr_number,
          JSON.stringify(apiResult),
          req.user.userId
        ]
      );

      // Update case with CNR if not already set
      if (apiResult.success && !cases[0].cnr_number) {
        await pool.execute(
          'UPDATE cases SET cnr_number = ? WHERE id = ?',
          [cnr_number, caseId]
        );
      }

      res.json({ 
        success: true,
        message: 'Legal data attached successfully',
        case: cases[0],
        data: apiResult
      });
    } catch (error) {
      console.error('Attach legal data error:', error);
      res.status(500).json({ error: error.message || 'Failed to attach legal data' });
    }
  }
);

/**
 * Attach GST verification to a client
 * POST /api/legal-data/attach/client/:clientId/gst
 */
router.post('/attach/client/:clientId/gst', 
  requirePermission(PERMISSIONS.LEGAL_DATA_VERIFY), 
  async (req, res) => {
    try {
      const { clientId } = req.params;
      const { gstin } = req.body;

      if (!gstin) {
        return res.status(400).json({ error: 'GSTIN is required' });
      }

      // Verify client exists
      const [clients] = await pool.execute(
        'SELECT id, first_name, last_name FROM clients WHERE id = ? AND tenant_id = ?',
        [clientId, req.tenantId]
      );

      if (clients.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Verify GST
      const apiResult = await GSTVerificationAPI.verifyGSTIN(gstin);

      // Store verification result
      await pool.execute(
        `INSERT INTO legal_data_searches (
          tenant_id, client_id, search_type, search_query, result_data, searched_by
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.tenantId,
          clientId,
          'gst_verification',
          gstin,
          JSON.stringify(apiResult),
          req.user.userId
        ]
      );

      // Update client GSTIN if not already set
      if (apiResult.success && !clients[0].gstin) {
        await pool.execute(
          'UPDATE clients SET gstin = ? WHERE id = ?',
          [gstin, clientId]
        );
      }

      res.json({ 
        success: true,
        message: 'GST verification attached successfully',
        client: clients[0],
        verification: apiResult
      });
    } catch (error) {
      console.error('Attach GST verification error:', error);
      res.status(500).json({ error: error.message || 'Failed to attach GST verification' });
    }
  }
);

/**
 * Attach PAN verification to a client
 * POST /api/legal-data/attach/client/:clientId/pan
 */
router.post('/attach/client/:clientId/pan', 
  requirePermission(PERMISSIONS.LEGAL_DATA_VERIFY), 
  async (req, res) => {
    try {
      const { clientId } = req.params;
      const { pan_number } = req.body;

      if (!pan_number) {
        return res.status(400).json({ error: 'PAN number is required' });
      }

      // Verify client exists
      const [clients] = await pool.execute(
        'SELECT id, first_name, last_name FROM clients WHERE id = ? AND tenant_id = ?',
        [clientId, req.tenantId]
      );

      if (clients.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Verify PAN
      const apiResult = await PANVerificationAPI.verifyPAN(pan_number);

      // Store verification result
      await pool.execute(
        `INSERT INTO legal_data_searches (
          tenant_id, client_id, search_type, search_query, result_data, searched_by
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.tenantId,
          clientId,
          'pan_verification',
          pan_number,
          JSON.stringify(apiResult),
          req.user.userId
        ]
      );

      // Update client PAN if not already set
      if (apiResult.success && !clients[0].pan_number) {
        await pool.execute(
          'UPDATE clients SET pan_number = ? WHERE id = ?',
          [pan_number, clientId]
        );
      }

      res.json({ 
        success: true,
        message: 'PAN verification attached successfully',
        client: clients[0],
        verification: apiResult
      });
    } catch (error) {
      console.error('Attach PAN verification error:', error);
      res.status(500).json({ error: error.message || 'Failed to attach PAN verification' });
    }
  }
);

/**
 * Get attached legal data for a case
 * GET /api/legal-data/attach/case/:caseId/data
 */
router.get('/attach/case/:caseId/data', async (req, res) => {
  try {
    const { caseId } = req.params;

    const [searches] = await pool.execute(
      `SELECT id, search_type, search_query, result_data, created_at, searched_by
       FROM legal_data_searches
       WHERE case_id = ? AND tenant_id = ?
       ORDER BY created_at DESC`,
      [caseId, req.tenantId]
    );

    res.json({ 
      success: true,
      case_id: caseId,
      data: searches
    });
  } catch (error) {
    console.error('Get attached data error:', error);
    res.status(500).json({ error: error.message || 'Failed to get attached data' });
  }
});

/**
 * Get attached legal data for a client
 * GET /api/legal-data/attach/client/:clientId/data
 */
router.get('/attach/client/:clientId/data', async (req, res) => {
  try {
    const { clientId } = req.params;

    const [searches] = await pool.execute(
      `SELECT id, search_type, search_query, result_data, created_at, searched_by
       FROM legal_data_searches
       WHERE client_id = ? AND tenant_id = ?
       ORDER BY created_at DESC`,
      [clientId, req.tenantId]
    );

    res.json({ 
      success: true,
      client_id: clientId,
      data: searches
    });
  } catch (error) {
    console.error('Get attached data error:', error);
    res.status(500).json({ error: error.message || 'Failed to get attached data' });
  }
});

module.exports = router;

