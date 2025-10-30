const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../middleware/rbac');
const {
  eCourtsAPI,
  CasemineAPI,
  LegitQuestAPI,
  GSTVerificationAPI,
  PANVerificationAPI,
  DigiLockerAPI,
  eSignAPI
} = require('../services/legalApis');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ============ eCourts API Routes ============

// Get High Court states (Kleopatra API)
router.get('/ecourts/high-court/states', requirePermission(PERMISSIONS.LEGAL_DATA_SEARCH), async (req, res) => {
  try {
    const result = await eCourtsAPI.getHighCourtStates();
    res.json({ result });
  } catch (error) {
    console.error('Get High Court states error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch High Court states' });
  }
});

// Get District Court states (Kleopatra API)
router.get('/ecourts/district-court/states', requirePermission(PERMISSIONS.LEGAL_DATA_SEARCH), async (req, res) => {
  try {
    const result = await eCourtsAPI.getDistrictCourtStates();
    res.json({ result });
  } catch (error) {
    console.error('Get District Court states error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch District Court states' });
  }
});

// Get High Court benches (Kleopatra API)
router.post('/ecourts/high-court/benches', requirePermission(PERMISSIONS.LEGAL_DATA_SEARCH), async (req, res) => {
  try {
    const { state_code } = req.body;
    if (!state_code) {
      return res.status(400).json({ error: 'State code is required' });
    }
    const result = await eCourtsAPI.getHighCourtBenches(state_code);
    res.json({ result });
  } catch (error) {
    console.error('Get High Court benches error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch High Court benches' });
  }
});

// Search case by CNR number
router.post('/ecourts/search-cnr', requirePermission(PERMISSIONS.LEGAL_DATA_SEARCH), async (req, res) => {
  try {
    const { cnr_number } = req.body;

    if (!cnr_number) {
      return res.status(400).json({ error: 'CNR number is required' });
    }

    const result = await eCourtsAPI.searchCaseByCNR(cnr_number);

    // Store the search result in database
    if (result.success) {
      await pool.execute(
        `INSERT INTO legal_data_searches (
          tenant_id, search_type, search_query, result_data, searched_by
        )
        VALUES (?, ?, ?, ?, ?)`,
        [
          req.tenantId,
          'ecourts_cnr',
          cnr_number,
          JSON.stringify(result),
          req.user.userId
        ]
      );
    }

    res.json({ result });
  } catch (error) {
    console.error('eCourts search error:', error);
    res.status(500).json({ error: error.message || 'Failed to search case' });
  }
});

// Get case status
router.get('/ecourts/case-status/:caseNumber', requirePermission(PERMISSIONS.LEGAL_DATA_SEARCH), async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const result = await eCourtsAPI.getCaseStatus(caseNumber);
    res.json({ result });
  } catch (error) {
    console.error('Get case status error:', error);
    res.status(500).json({ error: error.message || 'Failed to get case status' });
  }
});

// Get cause list
router.post('/ecourts/cause-list', requirePermission(PERMISSIONS.LEGAL_DATA_SEARCH), async (req, res) => {
  try {
    const { court_id, date } = req.body;
    const result = await eCourtsAPI.getCauseList(court_id, date);
    res.json({ result });
  } catch (error) {
    console.error('Get cause list error:', error);
    res.status(500).json({ error: error.message || 'Failed to get cause list' });
  }
});

// Get judgment summaries
router.get('/ecourts/judgments', requirePermission(PERMISSIONS.LEGAL_DATA_SEARCH), async (req, res) => {
  try {
    const { court_name, limit = 10 } = req.query;
    const result = await eCourtsAPI.getJudgmentSummaries(court_name, parseInt(limit));
    res.json({ result });
  } catch (error) {
    console.error('Get judgments error:', error);
    res.status(500).json({ error: error.message || 'Failed to get judgments' });
  }
});

// ============ Legal Case Search APIs ============

// Search cases via Casemine
router.post('/cases/search', requirePermission(PERMISSIONS.LEGAL_DATA_SEARCH), async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const result = await CasemineAPI.searchCases(query);
    res.json({ result });
  } catch (error) {
    console.error('Case search error:', error);
    res.status(500).json({ error: error.message || 'Failed to search cases' });
  }
});

// Get judgment details
router.get('/cases/judgment/:caseId', requirePermission(PERMISSIONS.LEGAL_DATA_SEARCH), async (req, res) => {
  try {
    const { caseId } = req.params;
    const result = await CasemineAPI.getJudgment(caseId);
    res.json({ result });
  } catch (error) {
    console.error('Get judgment error:', error);
    res.status(500).json({ error: error.message || 'Failed to get judgment' });
  }
});

// Search via LegitQuest
router.post('/legal-research', requirePermission(PERMISSIONS.LEGAL_DATA_SEARCH), async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const result = await LegitQuestAPI.searchCase(query);
    res.json({ result });
  } catch (error) {
    console.error('Legal research error:', error);
    res.status(500).json({ error: error.message || 'Failed to perform legal research' });
  }
});

// ============ GST Verification ============

// Verify GST number
router.post('/verify/gst', requirePermission(PERMISSIONS.LEGAL_DATA_VERIFY), async (req, res) => {
  try {
    const { gstin } = req.body;

    if (!gstin) {
      return res.status(400).json({ error: 'GSTIN is required' });
    }

    const result = await GSTVerificationAPI.verifyGSTIN(gstin);

    // Store verification result
    await pool.execute(
      `INSERT INTO legal_data_searches (
        tenant_id, search_type, search_query, result_data, searched_by
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        'gst_verification',
        gstin,
        JSON.stringify(result),
        req.user.userId
      ]
    );

    res.json({ result });
  } catch (error) {
    console.error('GST verification error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify GSTIN' });
  }
});

// ============ PAN Verification ============

// Verify PAN number
router.post('/verify/pan', requirePermission(PERMISSIONS.LEGAL_DATA_VERIFY), async (req, res) => {
  try {
    const { pan_number } = req.body;

    if (!pan_number) {
      return res.status(400).json({ error: 'PAN number is required' });
    }

    const result = await PANVerificationAPI.verifyPAN(pan_number);

    // Store verification result
    await pool.execute(
      `INSERT INTO legal_data_searches (
        tenant_id, search_type, search_query, result_data, searched_by
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        'pan_verification',
        pan_number,
        JSON.stringify(result),
        req.user.userId
      ]
    );

    res.json({ result });
  } catch (error) {
    console.error('PAN verification error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify PAN' });
  }
});

// ============ DigiLocker Integration ============

// Verify document via DigiLocker
router.post('/digitallocker/verify', requirePermission(PERMISSIONS.LEGAL_DATA_VERIFY), async (req, res) => {
  try {
    const { document_type, document_number } = req.body;

    if (!document_type || !document_number) {
      return res.status(400).json({ error: 'Document type and number are required' });
    }

    const result = await DigiLockerAPI.verifyDocument(document_type, document_number);

    // Store verification result
    await pool.execute(
      `INSERT INTO legal_data_searches (
        tenant_id, search_type, search_query, result_data, searched_by
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        'digitallocker_verify',
        `${document_type}:${document_number}`,
        JSON.stringify(result),
        req.user.userId
      ]
    );

    res.json({ result });
  } catch (error) {
    console.error('DigiLocker verification error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify document' });
  }
});

// Fetch document from DigiLocker
router.post('/digitallocker/fetch', requirePermission(PERMISSIONS.LEGAL_DATA_VERIFY), async (req, res) => {
  try {
    const { document_type, client_aadhaar } = req.body;

    if (!document_type || !client_aadhaar) {
      return res.status(400).json({ error: 'Document type and Aadhaar are required' });
    }

    const result = await DigiLockerAPI.fetchDocument(document_type, client_aadhaar);
    res.json({ result });
  } catch (error) {
    console.error('DigiLocker fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch document' });
  }
});

// ============ eSign Integration ============

// Create eSign request
router.post('/esign/create', requirePermission(PERMISSIONS.LEGAL_DATA_VERIFY), async (req, res) => {
  try {
    const { document_data, signer_aadhaar } = req.body;

    if (!document_data || !signer_aadhaar) {
      return res.status(400).json({ error: 'Document data and signer Aadhaar are required' });
    }

    const result = await eSignAPI.createESignRequest(document_data, signer_aadhaar);

    res.json({ result, message: 'eSign request created successfully' });
  } catch (error) {
    console.error('eSign creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create eSign request' });
  }
});

// Verify eSignature
router.get('/esign/verify/:signatureId', requirePermission(PERMISSIONS.LEGAL_DATA_VERIFY), async (req, res) => {
  try {
    const { signatureId } = req.params;
    const result = await eSignAPI.verifySignature(signatureId);
    res.json({ result });
  } catch (error) {
    console.error('eSign verification error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify signature' });
  }
});

// ============ Search History ============

// Get search history
router.get('/history', async (req, res) => {
  try {
    const [history] = await pool.execute(
      `SELECT lds.*, CONCAT(u.first_name, ' ', u.last_name) as searched_by_name
       FROM legal_data_searches lds
       LEFT JOIN users u ON lds.searched_by = u.id
       WHERE lds.tenant_id = ?
       ORDER BY lds.created_at DESC
       LIMIT 50`,
      [req.tenantId]
    );

    res.json({ history });
  } catch (error) {
    console.error('Get search history error:', error);
    res.status(500).json({ error: 'Failed to get search history' });
  }
});

// Get specific search result
router.get('/history/:id', async (req, res) => {
  try {
    const [searches] = await pool.execute(
      `SELECT lds.*, CONCAT(u.first_name, ' ', u.last_name) as searched_by_name
       FROM legal_data_searches lds
       LEFT JOIN users u ON lds.searched_by = u.id
       WHERE lds.id = ? AND lds.tenant_id = ?`,
      [req.params.id, req.tenantId]
    );

    if (searches.length === 0) {
      return res.status(404).json({ error: 'Search not found' });
    }

    res.json({ search: searches[0] });
  } catch (error) {
    console.error('Get search error:', error);
    res.status(500).json({ error: 'Failed to get search result' });
  }
});

module.exports = router;

