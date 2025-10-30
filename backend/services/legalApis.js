const axios = require('axios');

/**
 * eCourts API Integration
 * Access case status, CNR number, cause lists, and judgments
 */
class eCourtsAPI {
  constructor() {
    this.baseURL = process.env.ECOURTS_API_URL || 'https://services.ecourts.gov.in';
    this.apiKey = process.env.ECOURTS_API_KEY;
    this.kleopatraBaseURL = 'https://court-api.kleopatra.io';
    this.timeoutMs = Number(process.env.ECOURTS_TIMEOUT_MS || 15000);
    // Optional custom paths in case you use an aggregator gateway
    this.paths = {
      cnr: process.env.ECOURTS_CNR_PATH || '/api/cases/search-cnr',
      status: process.env.ECOURTS_CASE_STATUS_PATH || '/api/cases/status',
      causeList: process.env.ECOURTS_CAUSE_LIST_PATH || '/api/courts/cause-list',
      judgments: process.env.ECOURTS_JUDGMENTS_PATH || '/api/judgments'
    };
  }

  async searchCaseByCNR(cnrNumber) {
    if (!cnrNumber) {
      throw new Error('CNR number is required');
    }

    try {
      if (!this.apiKey && process.env.ECOURTS_REQUIRE_KEY === 'true') {
        throw new Error('eCourts API key not configured');
      }

      const url = `${this.baseURL}${this.paths.cnr}`;
      const response = await axios.post(
        url,
        { cnr: cnrNumber },
        {
          timeout: this.timeoutMs,
          headers: this.apiKey
            ? { Authorization: `Bearer ${this.apiKey}` }
            : undefined
        }
      );
      return response.data;
    } catch (error) {
      console.error('eCourts API error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch eCourts CNR search');
    }
  }

  async getCaseStatus(caseNumber) {
    try {
      const url = `${this.baseURL}${this.paths.status}/${encodeURIComponent(caseNumber)}`;
      const response = await axios.get(url, {
        timeout: this.timeoutMs,
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : undefined
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching case status:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch case status');
    }
  }

  async getCauseList(courtId, date) {
    try {
      const url = `${this.baseURL}${this.paths.causeList}`;
      const response = await axios.post(
        url,
        { court_id: courtId, date },
        {
          timeout: this.timeoutMs,
          headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : undefined
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching cause list:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch cause list');
    }
  }

  async getJudgmentSummaries(courtName, limit = 10) {
    try {
      const url = `${this.baseURL}${this.paths.judgments}`;
      const response = await axios.get(url, {
        params: { court: courtName, limit },
        timeout: this.timeoutMs,
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : undefined
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching judgments:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch judgment summaries');
    }
  }

  // ============ Kleopatra Court API Methods ============
  // Reference: https://e-courts-india-api.readme.io/

  // Get all High Court states
  async getHighCourtStates() {
    const url = `${this.kleopatraBaseURL}/api/core/static/high-court/states`;
    try {
      const headers = this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {};
      const resp = await axios.get(url, { headers, timeout: this.timeoutMs });
      return resp.data;
    } catch (error) {
      console.error('Kleopatra getHighCourtStates error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch High Court states');
    }
  }

  // Get all District Court states
  async getDistrictCourtStates() {
    const url = `${this.kleopatraBaseURL}/api/core/static/district-court/states`;
    try {
      const headers = this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {};
      const resp = await axios.get(url, { headers, timeout: this.timeoutMs });
      return resp.data;
    } catch (error) {
      console.error('Kleopatra getDistrictCourtStates error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch District Court states');
    }
  }

  // Get benches for High Court
  async getHighCourtBenches(stateCode) {
    const url = `${this.kleopatraBaseURL}/api/core/static/high-court/benches`;
    try {
      const headers = this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {};
      const resp = await axios.post(url, { state_code: stateCode }, { headers, timeout: this.timeoutMs });
      return resp.data;
    } catch (error) {
      console.error('Kleopatra getHighCourtBenches error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch High Court benches');
    }
  }

  // Lookup case by CNR (Kleopatra)
  async lookupCaseByCNR(cnrNumber, courtLevel = 'district') {
    const endpoint = courtLevel === 'high' ? '/api/core/live/high-court/lookup' : '/api/core/live/district-court/lookup';
    const url = `${this.kleopatraBaseURL}${endpoint}`;
    try {
      const headers = this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {};
      const resp = await axios.post(url, { cnr: cnrNumber }, { headers, timeout: this.timeoutMs });
      return resp.data;
    } catch (error) {
      console.error('Kleopatra lookupCaseByCNR error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to lookup case by CNR');
    }
  }
}

/**
 * Casemine API Integration
 * Access case law, judgments, and legal precedents
 */
class CasemineAPI {
  constructor() {
    this.baseURL = process.env.CASEMINE_API_URL || 'https://api.casemine.com';
    this.apiKey = process.env.CASEMINE_API_KEY;
  }

  async searchCases(query) {
    if (!this.apiKey) {
      throw new Error('Casemine API key not configured');
    }

    try {
      const response = await axios.post(`${this.baseURL}/search`, {
        query,
        filters: {}
      }, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      console.error('Casemine API error:', error);
      throw error;
    }
  }

  async getJudgment(caseId) {
    try {
      const response = await axios.get(`${this.baseURL}/judgment/${caseId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching judgment:', error);
      throw error;
    }
  }
}

/**
 * LegitQuest API Integration
 * Access case data, legal research
 */
class LegitQuestAPI {
  constructor() {
    this.baseURL = process.env.LEGITQUEST_API_URL || 'https://api.legitquest.com';
    this.apiKey = process.env.LEGITQUEST_API_KEY;
  }

  async searchCase(query) {
    try {
      return {
        success: true,
        query: query,
        results: []
      };
    } catch (error) {
      console.error('LegitQuest API error:', error);
      throw error;
    }
  }

  async getCaseData(caseId) {
    try {
      return {
        success: true,
        case_id: caseId,
        data: {}
      };
    } catch (error) {
      console.error('Error fetching case data:', error);
      throw error;
    }
  }
}

/**
 * GST Verification API
 * Verify GST number for client onboarding and billing
 */
class GSTVerificationAPI {
  constructor() {
    this.baseURL = process.env.GST_API_URL || 'https://api.mygst.com';
    this.apiKey = process.env.GST_API_KEY;
    this.timeoutMs = Number(process.env.GST_TIMEOUT_MS || 15000);
    this.path = process.env.GST_VERIFY_PATH || '/v1/verify';
  }

  async verifyGSTIN(gstin) {
    if (!gstin) {
      throw new Error('GSTIN is required');
    }

    try {
      if (!this.apiKey && process.env.GST_REQUIRE_KEY === 'true') {
        throw new Error('GST API key not configured');
      }
      const url = `${this.baseURL}${this.path}`;
      const response = await axios.post(
        url,
        { gstin },
        {
          timeout: this.timeoutMs,
          headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : undefined
        }
      );
      return response.data;
    } catch (error) {
      console.error('GST verification error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to verify GST');
    }
  }
}

/**
 * PAN Verification API
 * Verify PAN number for client onboarding
 */
class PANVerificationAPI {
  constructor() {
    this.baseURL = process.env.PAN_API_URL || 'https://api.panverify.com';
    this.apiKey = process.env.PAN_API_KEY;
    this.timeoutMs = Number(process.env.PAN_TIMEOUT_MS || 15000);
    this.path = process.env.PAN_VERIFY_PATH || '/v1/verify';
  }

  async verifyPAN(panNumber) {
    if (!panNumber) {
      throw new Error('PAN number is required');
    }

    try {
      if (!this.apiKey && process.env.PAN_REQUIRE_KEY === 'true') {
        throw new Error('PAN API key not configured');
      }
      const url = `${this.baseURL}${this.path}`;
      const response = await axios.post(
        url,
        { pan: panNumber },
        {
          timeout: this.timeoutMs,
          headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : undefined
        }
      );
      return response.data;
    } catch (error) {
      console.error('PAN verification error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to verify PAN');
    }
  }
}

/**
 * DigiLocker API Integration
 * For secure document verification and sharing
 */
class DigiLockerAPI {
  constructor() {
    this.baseURL = process.env.DIGILOCKER_API_URL || 'https://api.digitallocker.gov.in';
    this.clientId = process.env.DIGILOCKER_CLIENT_ID;
    this.clientSecret = process.env.DIGILOCKER_CLIENT_SECRET;
    this.timeoutMs = Number(process.env.DIGILOCKER_TIMEOUT_MS || 15000);
    this.paths = {
      verify: process.env.DIGILOCKER_VERIFY_PATH || '/v1/verify',
      fetch: process.env.DIGILOCKER_FETCH_PATH || '/v1/documents/fetch'
    };
  }

  async verifyDocument(docType, docNumber) {
    try {
      if (!this.clientId || !this.clientSecret) {
        throw new Error('DigiLocker credentials not configured');
      }
      const url = `${this.baseURL}${this.paths.verify}`;
      const response = await axios.post(
        url,
        { document_type: docType, document_number: docNumber },
        {
          timeout: this.timeoutMs,
          headers: {
            'X-Client-Id': this.clientId,
            'X-Client-Secret': this.clientSecret
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('DigiLocker API error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to verify DigiLocker document');
    }
  }

  async fetchDocument(docType, clientAadhaar) {
    try {
      if (!this.clientId || !this.clientSecret) {
        throw new Error('DigiLocker credentials not configured');
      }
      const url = `${this.baseURL}${this.paths.fetch}`;
      const response = await axios.post(
        url,
        { document_type: docType, aadhaar: clientAadhaar },
        {
          timeout: this.timeoutMs,
          headers: {
            'X-Client-Id': this.clientId,
            'X-Client-Secret': this.clientSecret
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching document:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch DigiLocker document');
    }
  }
}

/**
 * eSign API Integration (MeitY)
 * For government-compliant e-signing
 */
class eSignAPI {
  constructor() {
    this.baseURL = process.env.ESIGN_API_URL || 'https://api.esign.service.gov.in';
    this.apiKey = process.env.ESIGN_API_KEY;
    this.timeoutMs = Number(process.env.ESIGN_TIMEOUT_MS || 15000);
    this.paths = {
      create: process.env.ESIGN_CREATE_PATH || '/v1/esign/create',
      verify: process.env.ESIGN_VERIFY_PATH || '/v1/esign/verify'
    };
  }

  async createESignRequest(documentData, signerAadhaar) {
    try {
      if (!this.apiKey) {
        throw new Error('eSign API key not configured');
      }
      const url = `${this.baseURL}${this.paths.create}`;
      const response = await axios.post(
        url,
        { document: documentData, aadhaar: signerAadhaar },
        {
          timeout: this.timeoutMs,
          headers: { Authorization: `Bearer ${this.apiKey}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('eSign API error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to create eSign request');
    }
  }

  async verifySignature(signatureId) {
    try {
      if (!this.apiKey) {
        throw new Error('eSign API key not configured');
      }
      const url = `${this.baseURL}${this.paths.verify}`;
      const response = await axios.post(
        url,
        { signature_id: signatureId },
        {
          timeout: this.timeoutMs,
          headers: { Authorization: `Bearer ${this.apiKey}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error verifying signature:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to verify signature');
    }
  }
}

module.exports = {
  eCourtsAPI: new eCourtsAPI(),
  CasemineAPI: new CasemineAPI(),
  LegitQuestAPI: new LegitQuestAPI(),
  GSTVerificationAPI: new GSTVerificationAPI(),
  PANVerificationAPI: new PANVerificationAPI(),
  DigiLockerAPI: new DigiLockerAPI(),
  eSignAPI: new eSignAPI()
};

