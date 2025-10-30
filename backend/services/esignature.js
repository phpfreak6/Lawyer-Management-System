const axios = require('axios');

/**
 * Adobe Sign Integration
 */
class AdobeSignService {
  constructor() {
    this.clientId = process.env.ADOBE_SIGN_CLIENT_ID;
    this.clientSecret = process.env.ADOBE_SIGN_CLIENT_SECRET;
    this.accessToken = process.env.ADOBE_SIGN_ACCESS_TOKEN;
    this.apiUrl = 'https://api.na1.echosign.com/api/rest/v6';
  }

  async getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      const response = await axios.post('https://api.na1.echosign.com/oauth/token', {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      return response.data.access_token;
    } catch (error) {
      console.error('Error getting Adobe Sign access token:', error);
      throw error;
    }
  }

  async createAgreement(fileUrl, documentName, participantSetInfos) {
    try {
      const token = await this.getAccessToken();

      const agreement = {
        fileInfos: [{ documentURL: fileUrl }],
        name: documentName,
        participantSetsInfo: participantSetInfos,
        state: 'IN_PROCESS'
      };

      const response = await axios.post(
        `${this.apiUrl}/agreements`,
        agreement,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating Adobe Sign agreement:', error);
      throw error;
    }
  }

  async getAgreementStatus(agreementId) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `${this.apiUrl}/agreements/${agreementId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting Adobe Sign agreement status:', error);
      throw error;
    }
  }
}

/**
 * DocuSign Integration
 */
class DocuSignService {
  constructor() {
    this.integratorKey = process.env.DOCUSIGN_INTEGRATOR_KEY;
    this.userId = process.env.DOCUSIGN_USER_ID;
    this.apiUrl = 'https://demo.docusign.net/restapi';
    this.accessToken = process.env.DOCUSIGN_ACCESS_TOKEN;
  }

  async getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }

    // In production, use OAuth flow for DocuSign
    return this.accessToken;
  }

  async createEnvelope(fileBytes, fileName, recipientEmail, recipientName) {
    try {
      const token = await this.getAccessToken();

      const envelope = {
        emailSubject: `Please sign: ${fileName}`,
        documents: [{
          name: fileName,
          fileExtension: fileName.split('.').pop(),
          documentBase64: fileBytes.toString('base64'),
          documentId: '1'
        }],
        recipients: {
          signers: [{
            email: recipientEmail,
            name: recipientName,
            recipientId: '1',
            routingOrder: '1',
            tabs: {
              signHereTabs: [{
                documentId: '1',
                pageNumber: '1',
                xPosition: '100',
                yPosition: '100'
              }]
            }
          }]
        },
        status: 'sent'
      };

      const response = await axios.post(
        `${this.apiUrl}/v2/accounts/${process.env.DOCUSIGN_ACCOUNT_ID}/envelopes`,
        envelope,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating DocuSign envelope:', error);
      throw error;
    }
  }

  async getEnvelopeStatus(envelopeId) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `${this.apiUrl}/v2/accounts/${process.env.DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting DocuSign envelope status:', error);
      throw error;
    }
  }
}

module.exports = {
  AdobeSignService: new AdobeSignService(),
  DocuSignService: new DocuSignService()
};

